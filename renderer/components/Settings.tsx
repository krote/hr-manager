import React, { useState, useEffect } from 'react';

interface TranscriptionConfig {
  mode: 'local' | 'cloud';
  cloudApiKey?: string;
  cloudApiUrl?: string;
  whisperModel?: string;
}

interface GeneralConfig {
  theme: string;
  fontSize: string;
  autoExecute: boolean;
}

const Settings: React.FC = () => {
  // 一般設定
  const [generalConfig, setGeneralConfig] = useState<GeneralConfig>({
    theme: 'light',
    fontSize: 'medium',
    autoExecute: false
  });
  
  // 文字起こし設定
  const [transcriptionConfig, setTranscriptionConfig] = useState<TranscriptionConfig>({
    mode: 'local',
    whisperModel: 'tiny',
    cloudApiKey: '',
    cloudApiUrl: ''
  });
  
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // 一般設定の変更ハンドラ
  const handleGeneralChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : value;
    
    setGeneralConfig(prev => ({ ...prev, [name]: newValue }));
  };
  
  // 文字起こし設定の変更ハンドラ
  const handleTranscriptionChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTranscriptionConfig(prev => ({ ...prev, [name]: value }));
  };
  
  // 設定読み込み
  useEffect(() => {
    loadTranscriptionConfig();
  }, []);
  
  const loadTranscriptionConfig = async () => {
    try {
      // electronAPIが利用可能かチェック
      if ((window as any).electronAPI && (window as any).electronAPI.getTranscriptionConfig) {
        const result = await (window as any).electronAPI.getTranscriptionConfig();
        if (result.success) {
          setTranscriptionConfig(result.config);
        }
      }
    } catch (error) {
      console.error('設定読み込みエラー:', error);
    }
  };
  
  // 一般設定の保存
  const handleSaveGeneralSettings = () => {
    setIsSaving(true);
    
    // 一般設定の保存処理（実際のアプリではlocalStorageなどに保存）
    setTimeout(() => {
      setMessage({ text: '一般設定が保存されました', type: 'success' });
      setIsSaving(false);
      
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
    }, 500);
  };
  
  // 文字起こし設定の保存
  const handleSaveTranscriptionSettings = async () => {
    setIsSaving(true);
    
    try {
      // electronAPIが利用可能かチェック
      if ((window as any).electronAPI && (window as any).electronAPI.updateTranscriptionConfig) {
        const result = await (window as any).electronAPI.updateTranscriptionConfig(transcriptionConfig);
        
        if (result.success) {
          setMessage({ text: '文字起こし設定が保存されました', type: 'success' });
        } else {
          setMessage({ 
            text: `設定の保存に失敗しました: ${result.error}`, 
            type: 'error' 
          });
        }
      } else {
        setMessage({ 
          text: 'Electron APIが利用できません', 
          type: 'error' 
        });
      }
    } catch (error) {
      setMessage({ text: '設定の保存に失敗しました', type: 'error' });
      console.error('設定保存エラー:', error);
    } finally {
      setIsSaving(false);
      
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
    }
  };
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">設定</h2>
      
      {message.text && (
        <div className={`mb-4 p-3 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          <button 
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'general' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('general')}
          >
            一般設定
          </button>
          <button 
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transcription' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('transcription')}
          >
            文字起こし設定
          </button>
        </nav>
      </div>
      
      {activeTab === 'general' ? (
        <div className="max-w-md">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              テーマ
            </label>
            <select
              name="theme"
              value={generalConfig.theme}
              onChange={handleGeneralChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md"
            >
              <option value="light">ライト</option>
              <option value="dark">ダーク</option>
              <option value="system">システム設定に合わせる</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              フォントサイズ
            </label>
            <select
              name="fontSize"
              value={generalConfig.fontSize}
              onChange={handleGeneralChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md"
            >
              <option value="small">小</option>
              <option value="medium">中</option>
              <option value="large">大</option>
            </select>
          </div>

          <div className="mb-4">
            <div className="flex items-center">
              <input
                id="autoExecute"
                name="autoExecute"
                type="checkbox"
                checked={generalConfig.autoExecute}
                onChange={handleGeneralChange}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="autoExecute" className="ml-2 block text-sm text-gray-700">
                サンプルクエリを選択時に自動実行する
              </label>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSaveGeneralSettings}
              disabled={isSaving}
              className={`py-2 px-4 border border-transparent rounded-md text-white ${
                isSaving 
                  ? 'bg-gray-400' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isSaving ? '保存中...' : '設定を保存'}
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-md">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              処理モード
            </label>
            <select
              name="mode"
              value={transcriptionConfig.mode}
              onChange={handleTranscriptionChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md"
            >
              <option value="local">ローカル処理（Whisper.cpp）</option>
              <option value="cloud">クラウドAPI（外部サービス）</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              ローカル処理はプライバシーに優れ、クラウドAPIは高精度です。
            </p>
          </div>
          
          {transcriptionConfig.mode === 'local' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Whisperモデル
              </label>
              <select
                name="whisperModel"
                value={transcriptionConfig.whisperModel}
                onChange={handleTranscriptionChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md"
              >
                <option value="tiny">Tiny（軽量・高速）</option>
                <option value="base">Base（バランス型）</option>
                <option value="small">Small（より高精度）</option>
                <option value="medium">Medium（高精度・重い）</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                大きいモデルほど精度が上がりますが、メモリ使用量と処理時間が増加します。
              </p>
            </div>
          )}
          
          {transcriptionConfig.mode === 'cloud' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API URL
                </label>
                <input
                  type="text"
                  name="cloudApiUrl"
                  value={transcriptionConfig.cloudApiUrl || ''}
                  onChange={handleTranscriptionChange}
                  placeholder="https://api.example.com/transcribe"
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  APIキー
                </label>
                <input
                  type="password"
                  name="cloudApiKey"
                  value={transcriptionConfig.cloudApiKey || ''}
                  onChange={handleTranscriptionChange}
                  placeholder="sk_..."
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                />
                <p className="text-sm text-gray-500 mt-1">
                  APIキーは安全に保存され、選択したAPIサービスへのリクエスト時のみ使用されます。
                </p>
              </div>
            </>
          )}
          
          <div className="mt-6">
            <button
              onClick={handleSaveTranscriptionSettings}
              disabled={isSaving}
              className={`py-2 px-4 border border-transparent rounded-md text-white ${
                isSaving 
                  ? 'bg-gray-400' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isSaving ? '保存中...' : '設定を保存'}
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-2">ローカル処理について</h3>
            <p className="text-sm text-gray-700 mb-4">
              ローカル処理ではWhisper.cppを使用し、データがデバイスから外部に送信されないためプライバシーが確保されます。
              Whisper.cppのモデルは初回使用時に自動でダウンロードされます。
            </p>
            
            <h3 className="text-lg font-semibold mb-2">クラウドAPIについて</h3>
            <p className="text-sm text-gray-700">
              クラウドAPIを利用すると高精度な文字起こしと感情分析が可能ですが、音声データが外部サーバーに送信されます。
              APIの利用には提供元のサービス条件が適用されます。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;