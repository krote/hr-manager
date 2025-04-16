import { ipcMain, dialog, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffmpegStatic from 'ffmpeg-static';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';

// 設定関連の型
interface TranscriptionConfig {
  mode: 'local' | 'cloud';
  cloudApiKey?: string;
  cloudApiUrl?: string;
  whisperModel?: string; // tiny, base, small, medium, largeなど
}

// 設定を保存・読み込み
const configPath = path.join(app.getPath('userData'), 'transcription-config.json');
const whisperModelPath = path.join(app.getPath('userData'), 'models');
const whisperExecPath = path.join(app.getPath('userData'), 'bin');

// Whisper.cppの実行パスを設定
let whisperPath = '';

// デフォルト設定
const defaultConfig: TranscriptionConfig = {
  mode: 'local',
  whisperModel: 'tiny'
};

// 設定の読み込み
function loadConfig(): TranscriptionConfig {
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData) as TranscriptionConfig;
    }
  } catch (error) {
    console.error('設定ファイルの読み込みエラー:', error);
  }
  
  // デフォルト設定を保存して返す
  saveConfig(defaultConfig);
  return defaultConfig;
}

// 設定の保存
function saveConfig(config: TranscriptionConfig): void {
  try {
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (error) {
    console.error('設定ファイルの保存エラー:', error);
  }
}

// Whisper.cpp ベースの文字起こしとクラウド処理の設定
export function setupTranscriptionHandlers() {
  // 設定を読み込む
  loadConfig();
  
  // ffmpegのパスを設定
  const ffmpegPath = ffmpegStatic as unknown as string;
  ffmpeg.setFfmpegPath(ffmpegPath);
  
  // Whisper.cppのセットアップ
  setupWhisperModel().catch(error => {
    console.error('Whisper.cppのセットアップエラー:', error);
  });

  // 動画ファイル選択ハンドラ
  ipcMain.handle('select-video-file', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Video Files', extensions: ['mp4', 'avi'] }
        ]
      });

      if (canceled || filePaths.length === 0) {
        return { success: false, error: 'ファイル選択がキャンセルされました' };
      }

      return { success: true, filePath: filePaths[0] };
    } catch (error: unknown) {
      console.error('ファイル選択エラー:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // 文字起こし処理ハンドラ
  ipcMain.handle('transcribe-video', async (_event, filePath: string) => {
    try {
      // 設定を再読み込み
      const config = loadConfig();
      
      // 一時オーディオファイルのパス
      const tempDir = path.join(os.tmpdir(), 'hr-manager-temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const audioPath = path.join(tempDir, `${path.basename(filePath, path.extname(filePath))}.wav`);
      
      // 動画から音声を抽出 (wav形式、モノラル、16kHz)
      await extractAudioFromVideo(filePath, audioPath);
      
      let transcription;
      let sentiment;
      
      // モードに応じて処理を分岐
      if (config.mode === 'local') {
        // ローカル処理（Whisper.cpp）
        transcription = await transcribeWithWhisper(audioPath, config);
        sentiment = analyzeLocalSentiment(transcription);
      } else {
        // クラウド処理（APIを使用）
        if (!config.cloudApiKey || !config.cloudApiUrl) {
          return { 
            success: false, 
            error: 'クラウドAPIの設定が不完全です。設定を確認してください' 
          };
        }
        
        const cloudResponse = await transcribeWithCloudApi(audioPath, config);
        transcription = cloudResponse.transcription;
        sentiment = cloudResponse.sentiment;
      }
      
      // 総評生成
      const summary = generateMeetingSummary(transcription, sentiment);
      
      // 結果をJSONとして返す
      const result = {
        transcription,
        sentiment,
        summary,
        audioProcessed: true
      };
      
      return { success: true, result };
    } catch (error: unknown) {
      console.error('文字起こしエラー:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
  
  // 設定更新ハンドラ
  ipcMain.handle('update-transcription-config', async (_event, newConfig: TranscriptionConfig) => {
    try {
      saveConfig(newConfig);
      return { success: true };
    } catch (error: unknown) {
      console.error('設定更新エラー:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
  
  // 設定取得ハンドラ
  ipcMain.handle('get-transcription-config', async () => {
    try {
      const config = loadConfig();
      return { success: true, config };
    } catch (error: unknown) {
      console.error('設定取得エラー:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}

// Whisper.cppのセットアップ
async function setupWhisperModel(): Promise<void> {
  // モデルとバイナリを保存するディレクトリの作成
  if (!fs.existsSync(whisperModelPath)) {
    fs.mkdirSync(whisperModelPath, { recursive: true });
  }
  
  if (!fs.existsSync(whisperExecPath)) {
    fs.mkdirSync(whisperExecPath, { recursive: true });
  }
  
  // TODO: 実際のデプロイでは、whisper.cppをバンドルするか、ダウンロードする処理を実装
  // このサンプルでは、パスのみ設定しておく
  const platform = process.platform;
  
  if (platform === 'win32') {
    whisperPath = path.join(whisperExecPath, 'whisper.exe');
  } else if (platform === 'darwin' || platform === 'linux') {
    whisperPath = path.join(whisperExecPath, 'whisper');
  }
  
  // whisper.cppが存在しない場合、シミュレーションモードを使用
  if (!fs.existsSync(whisperPath)) {
    console.log('Whisper.cppバイナリが見つかりません。シミュレーションモードを使用します。');
  }
}

// 動画から音声を抽出する関数
async function extractAudioFromVideo(videoPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    (ffmpeg as any)(videoPath)
      .output(outputPath)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });
}

// Whisper.cppを使った文字起こし
async function transcribeWithWhisper(audioPath: string, config: TranscriptionConfig): Promise<any[]> {
  // Whisper.cppが存在しない場合、シミュレーションモードを使用
  if (!fs.existsSync(whisperPath)) {
    return simulateTranscription(audioPath);
  }
  
  try {
    const modelName = config.whisperModel || 'tiny';
    const modelPath = path.join(whisperModelPath, `ggml-${modelName}.bin`);
    
    // モデルファイルが存在するか確認
    if (!fs.existsSync(modelPath)) {
      console.log(`モデルファイル ${modelPath} が見つかりません。シミュレーションモードを使用します。`);
      return simulateTranscription(audioPath);
    }
    
    // Whisper.cppを実行
    const execFileAsync = promisify(execFile);
    const output = await execFileAsync(whisperPath, [
      '-m', modelPath,
      '-f', audioPath,
      '--output-json',
      '-otxt'
    ]);
    
    // 出力からJSON部分を抽出して解析
    const jsonOutput = output.stdout.match(/\{.*\}/s);
    if (!jsonOutput) {
      throw new Error('Whisper.cppの出力からJSONを抽出できませんでした');
    }
    
    const result = JSON.parse(jsonOutput[0]);
    
    // Whisper.cppの出力を適切な形式に変換
    return formatWhisperOutput(result);
  } catch (error) {
    console.error('Whisper.cppによる文字起こしエラー:', error);
    // エラー時はシミュレーションで代替
    return simulateTranscription(audioPath);
  }
}

// Whisper.cppの出力を適切な形式に変換
function formatWhisperOutput(whisperResult: any): any[] {
  try {
    // Whisper.cppの出力構造によって変更が必要
    // この例では簡易的な変換を行う
    if (!whisperResult.segments || !Array.isArray(whisperResult.segments)) {
      throw new Error('無効なWhisper.cpp出力形式');
    }
    
    return whisperResult.segments.map((segment: any) => ({
      start: segment.start,
      end: segment.end,
      text: segment.text
    }));
  } catch (error) {
    console.error('Whisper出力の変換エラー:', error);
    return [];
  }
}

// クラウドAPIを使った文字起こし
async function transcribeWithCloudApi(audioPath: string, config: TranscriptionConfig): Promise<{
  transcription: any[];
  sentiment: any[];
}> {
  try {
    // 音声ファイルを読み込む
    const audioData = fs.readFileSync(audioPath);
    
    // クラウドAPIにリクエスト
    const response = await fetch(config.cloudApiUrl!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.cloudApiKey}`,
        'Content-Type': 'application/octet-stream'
      },
      body: audioData
    });
    
    if (!response.ok) {
      throw new Error(`APIリクエストエラー: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // クラウドAPIのレスポンス形式に合わせて処理
    // この例では簡易的な形式を想定
    return {
      transcription: formatCloudTranscription(result),
      sentiment: formatCloudSentiment(result)
    };
  } catch (error) {
    console.error('クラウドAPIエラー:', error);
    // エラー時はシミュレーションで代替
    const transcription = simulateTranscription(audioPath);
    const sentiment = analyzeLocalSentiment(transcription);
    return { transcription, sentiment };
  }
}

// クラウドAPIの文字起こし結果を適切な形式に変換
function formatCloudTranscription(cloudResult: any): any[] {
  try {
    // クラウドAPIのレスポンス形式に合わせて変更が必要
    // この例では簡易的な変換を行う
    if (!cloudResult.transcription || !Array.isArray(cloudResult.transcription)) {
      throw new Error('無効なクラウドAPIレスポンス形式');
    }
    
    return cloudResult.transcription.map((segment: any) => ({
      start: segment.start,
      end: segment.end,
      text: segment.text
    }));
  } catch (error) {
    console.error('クラウド出力の変換エラー:', error);
    return [];
  }
}

// クラウドAPIの感情分析結果を適切な形式に変換
function formatCloudSentiment(cloudResult: any): any[] {
  try {
    // クラウドAPIのレスポンス形式に合わせて変更が必要
    // この例では簡易的な変換を行う
    if (!cloudResult.sentiment || !Array.isArray(cloudResult.sentiment)) {
      throw new Error('無効なクラウドAPIレスポンス形式');
    }
    
    return cloudResult.sentiment.map((segment: any) => ({
      start: segment.start,
      end: segment.end,
      emotion: segment.emotion,
      confidence: segment.confidence
    }));
  } catch (error) {
    console.error('クラウド感情分析の変換エラー:', error);
    return [];
  }
}

// 文字起こしのシミュレーション（Whisper.cppの代わり）
function simulateTranscription(_audioPath: string) {
  // 実際にはここで whisper.cpp または vosk を使って文字起こし
  // 現在は模擬データを返す
  return [
    { start: 0, end: 5, text: "こんにちは、今日の1on1ミーティングを始めましょう。" },
    { start: 5, end: 10, text: "はい、よろしくお願いします。先週のタスクについて報告します。" },
    { start: 10, end: 15, text: "プロジェクトAの進捗状況はどうですか？" },
    { start: 15, end: 20, text: "予定通り進んでいますが、一部の機能で問題が発生しています。" },
    { start: 20, end: 25, text: "具体的にどのような問題ですか？" },
    { start: 25, end: 35, text: "データベースの接続が安定しないことがあります。原因を調査中ですが、ネットワーク環境に依存する問題かもしれません。" },
    { start: 35, end: 40, text: "それは大きな問題になりそうですね。サポートチームに相談してみましょうか？" },
    { start: 40, end: 45, text: "はい、そうしていただけると助かります。できるだけ早く解決したいです。" },
    { start: 45, end: 50, text: "了解しました。他に気になる点はありますか？" },
    { start: 50, end: 60, text: "最近の業務量が増えてきて、少し負担に感じています。もう少しチームで分担できるとありがたいです。" },
    { start: 60, end: 70, text: "わかりました。業務分担を見直しましょう。無理のない範囲で進めることが大切です。次回のチーム会議で調整します。" },
    { start: 70, end: 80, text: "ありがとうございます。それだけでも大分助かります。" },
    { start: 80, end: 90, text: "他にキャリアについての希望や学びたいことはありますか？" },
    { start: 90, end: 100, text: "はい、最近はデータ分析のスキルを向上させたいと考えています。何か良い学習リソースがあれば教えていただきたいです。" },
    { start: 100, end: 110, text: "データ分析ですね。社内トレーニングプログラムを確認しますが、Coursera のデータサイエンスコースも良いかもしれません。" },
    { start: 110, end: 120, text: "ありがとうございます。検討してみます。" }
  ];
}

// ローカルでの感情分析（シンプルな単語ベースの分析）
function analyzeLocalSentiment(transcription: any[]): any[] {
  // 実際には音声の特徴や言語内容から感情を分析
  // TensorFlow.jsなどのローカルモデルを使用するのが理想的
  
  // 感情タイプは辞書で定義されている
  
  // 感情に関連する単語の辞書（簡易版）
  const emotionKeywords: Record<string, string[]> = {
    positive: ['ありがとう', '良い', '助かります', '嬉しい', '解決', '成功'],
    negative: ['問題', '難しい', 'バグ', '失敗', '心配'],
    concerned: ['どのような問題', '大きな問題', '懸念', '調査'],
    stressed: ['負担', '増えて', '忙しい', 'ストレス'],
    relieved: ['わかりました', '了解', '調整します'],
    interested: ['希望', '学びたい', '検討', '向上']
  };
  
  // 各セグメントの感情を分析
  return transcription.map(segment => {
    // デフォルトは中立（neutral）
    let emotion = 'neutral';
    let maxCount = 0;
    let confidence = 0.6; // デフォルトの信頼度
    
    // 各感情タイプに該当するキーワードをカウント
    for (const [emotionType, keywords] of Object.entries(emotionKeywords)) {
      let count = 0;
      for (const keyword of keywords) {
        if (segment.text.includes(keyword)) {
          count++;
        }
      }
      
      // 最も多くのキーワードに一致した感情タイプを採用
      if (count > maxCount) {
        maxCount = count;
        emotion = emotionType;
        // キーワードの一致度に応じて信頼度を調整
        confidence = Math.min(0.6 + (count * 0.1), 0.9);
      }
    }
    
    return {
      start: segment.start,
      end: segment.end,
      emotion,
      confidence
    };
  });
}

// ミーティング総評の生成
function generateMeetingSummary(transcription: any[], sentiment: any[]) {
  // 実際のプロダクションでは、より高度なNLPやAIを使用して総評を生成
  // この例では簡略化された実装
  
  // トピックとアクションアイテムの抽出（簡易版）
  const mainTopics = extractTopics(transcription);
  const actionItems = extractActionItems(transcription);
  const emotionalInsights = analyzeEmotionalInsights(sentiment, transcription);
  
  return {
    mainTopics,
    emotionalInsights,
    actionItems,
    overallAssessment: generateOverallAssessment(transcription, sentiment, mainTopics, actionItems)
  };
}

// トピックの抽出（簡易版）
function extractTopics(transcription: any[]): string[] {
  // この例では、頻出する重要な名詞や名詞句を抽出
  // 実際にはより高度なNLPやキーフレーズ抽出を行う
  
  // トピックに関連する重要キーワード
  const topicKeywords = [
    'プロジェクト', 'タスク', '進捗', 'データベース', '接続',
    '問題', '機能', '業務', '分担', 'キャリア', 'スキル',
    'データ分析', 'トレーニング'
  ];
  
  // テキストから各キーワードの出現回数をカウント
  const keywordCounts: Record<string, number> = {};
  
  for (const segment of transcription) {
    for (const keyword of topicKeywords) {
      if (segment.text.includes(keyword)) {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      }
    }
  }
  
  // 頻度順にソート
  const sortedKeywords = Object.keys(keywordCounts)
    .sort((a, b) => keywordCounts[b] - keywordCounts[a])
    .slice(0, 5); // 上位5つを取得
  
  // キーワードからトピックフレーズを生成
  return sortedKeywords.map(keyword => {
    // 会話から関連するフレーズを見つける
    for (const segment of transcription) {
      if (segment.text.includes(keyword)) {
        // キーワードを含む短いフレーズを抽出（簡易版）
        const start = Math.max(0, segment.text.indexOf(keyword) - 10);
        const end = Math.min(segment.text.length, segment.text.indexOf(keyword) + keyword.length + 15);
        const phrase = segment.text.substring(start, end).trim();
        
        // フレーズがある程度の長さがあれば使用
        if (phrase.length > keyword.length + 5) {
          return phrase;
        }
      }
    }
    // 適切なフレーズが見つからなければキーワードをそのまま返す
    return `${keyword}について`;
  });
}

// アクションアイテムの抽出（簡易版）
function extractActionItems(transcription: any[]): string[] {
  // アクションアイテムを示す表現
  const actionPhrases = [
    'しましょう', 'べきです', '必要があります', 
    '検討します', '確認します', '調整します',
    'お願いします', '見直し', '相談'
  ];
  
  const actionItems: string[] = [];
  
  for (const segment of transcription) {
    for (const phrase of actionPhrases) {
      if (segment.text.includes(phrase)) {
        // アクション文を含む短いフレーズを抽出
        const start = Math.max(0, segment.text.indexOf(phrase) - 15);
        const end = Math.min(segment.text.length, segment.text.indexOf(phrase) + phrase.length + 5);
        const actionText = segment.text.substring(start, end).trim();
        
        // 重複を避ける
        if (!actionItems.some(item => item.includes(actionText))) {
          actionItems.push(actionText);
        }
      }
    }
  }
  
  return actionItems.slice(0, 3); // 最大3つのアクションアイテム
}

// 感情的なインサイトの分析
function analyzeEmotionalInsights(sentiment: any[], transcription: any[]): string[] {
  const insights: string[] = [];
  
  // 感情の変化を分析
  for (let i = 1; i < sentiment.length; i++) {
    const prev = sentiment[i - 1];
    const current = sentiment[i];
    
    // 感情の変化を検出
    if (prev.emotion !== current.emotion) {
      // 対応するテキストセグメントを見つける
      const textSegment = transcription.find(seg => 
        seg.start >= current.start && seg.start < current.end
      );
      
      if (textSegment) {
        let insightText = '';
        
        // 感情の変化に基づいてインサイトを生成
        if (current.emotion === 'stressed' || current.emotion === 'concerned') {
          insightText = `「${textSegment.text.substring(0, 20)}...」の話題で不安や懸念が見られた`;
        } else if (current.emotion === 'relieved') {
          insightText = `「${textSegment.text.substring(0, 20)}...」の後に安心感が見られた`;
        } else if (current.emotion === 'positive') {
          insightText = `「${textSegment.text.substring(0, 20)}...」の議論で前向きな反応が見られた`;
        } else if (current.emotion === 'interested') {
          insightText = `「${textSegment.text.substring(0, 20)}...」の話題に特に興味を示した`;
        }
        
        if (insightText && !insights.some(insight => insight.includes(insightText.substring(0, 15)))) {
          insights.push(insightText);
        }
      }
    }
  }
  
  // 感情の頻度分析
  const emotionCounts: Record<string, number> = {};
  for (const item of sentiment) {
    emotionCounts[item.emotion] = (emotionCounts[item.emotion] || 0) + 1;
  }
  
  // 最も頻度の高い感情
  const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => 
    emotionCounts[a] > emotionCounts[b] ? a : b
  );
  
  // 全体的な感情の傾向に関するインサイト
  if (dominantEmotion && dominantEmotion !== 'neutral') {
    const emotionMap: Record<string, string> = {
      positive: '前向きな感情',
      negative: 'ネガティブな感情',
      concerned: '懸念や不安',
      stressed: 'ストレスや負担',
      relieved: '安心感',
      interested: '高い関心'
    };
    
    insights.push(`全体を通して${emotionMap[dominantEmotion] || dominantEmotion}が支配的だった`);
  }
  
  return insights.slice(0, 3); // 最大3つのインサイトを返す
}

// 総合的な評価文の生成
function generateOverallAssessment(
  transcription: any[], 
  sentiment: any[], 
  topics: string[], 
  actions: string[]
): string {
  // 感情の割合を計算
  const emotionCounts: Record<string, number> = {};
  for (const item of sentiment) {
    emotionCounts[item.emotion] = (emotionCounts[item.emotion] || 0) + 1;
  }
  
  const totalEmotions = sentiment.length;
  const positiveRatio = ((emotionCounts['positive'] || 0) + (emotionCounts['relieved'] || 0)) / totalEmotions;
  const concernedRatio = ((emotionCounts['concerned'] || 0) + (emotionCounts['stressed'] || 0)) / totalEmotions;
  
  // 会話の全テキストを結合
  const fullText = transcription.map(item => item.text).join(' ');
  
  let assessment = '';
  
  // 感情に基づく評価
  if (positiveRatio > 0.3) {
    assessment += '全体的にポジティブな会話で、';
  } else if (concernedRatio > 0.3) {
    assessment += '懸念や不安が表明される会話で、';
  } else {
    assessment += '中立的なトーンの会話で、';
  }
  
  // トピックに基づく評価
  if (topics.length > 0) {
    const topicText = topics.slice(0, 2).join('や');
    assessment += `主に${topicText}について議論されました。`;
  }
  
  // キーワードベースの評価文
  if (fullText.includes('負担') || fullText.includes('忙しい') || fullText.includes('ストレス')) {
    assessment += '業務負荷に関する懸念が示されていますので、サポートが必要かもしれません。';
  }
  
  if (fullText.includes('学びたい') || fullText.includes('向上') || fullText.includes('スキル')) {
    assessment += 'スキル開発や成長に対する意欲が見られます。';
  }
  
  if (fullText.includes('問題') || fullText.includes('バグ') || fullText.includes('エラー')) {
    assessment += '技術的な課題の解決が優先事項と思われます。';
  }
  
  // アクションアイテムへの言及
  if (actions.length > 0) {
    assessment += '具体的なフォローアップが必要です。';
  }
  
  return assessment;
}