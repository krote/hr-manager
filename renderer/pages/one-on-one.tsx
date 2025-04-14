import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useRouter } from 'next/router'

interface Meeting {
  id: number
  employeeName: string
  date: string
  notes: string
  followUpItems: string[]
  completed: boolean
  transcription?: any
  sentiment?: any
  summary?: any
}

// IPC APIのタイプ定義
declare global {
  interface Window {
    electronAPI: {
      executeQuery: (query: string) => Promise<any>
    }
  }
}

const OneOnOnePage: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [newMeeting, setNewMeeting] = useState<Partial<Meeting>>({
    employeeName: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    followUpItems: [],
    completed: false
  })
  const [newFollowUpItem, setNewFollowUpItem] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false)

  useEffect(() => {
    // データベースからのロード処理を模擬
    const mockMeetings: Meeting[] = [
      {
        id: 1,
        employeeName: '山田太郎',
        date: '2024-04-10',
        notes: 'プロジェクトAの進捗について議論。タイムラインに遅れが生じている。',
        followUpItems: ['リソース追加の検討', '週次進捗レポートの提出'],
        completed: false
      },
      {
        id: 2,
        employeeName: '佐藤花子',
        date: '2024-04-12',
        notes: 'キャリア目標について話し合い。デザインスキルを向上させたいと希望。',
        followUpItems: ['デザイントレーニングの機会を探す', 'メンターの割り当て'],
        completed: true
      }
    ]
    setMeetings(mockMeetings)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewMeeting({ ...newMeeting, [name]: value })
  }

  const handleAddFollowUpItem = () => {
    if (newFollowUpItem.trim()) {
      setNewMeeting({
        ...newMeeting,
        followUpItems: [...(newMeeting.followUpItems || []), newFollowUpItem.trim()]
      })
      setNewFollowUpItem('')
    }
  }

  const handleRemoveFollowUpItem = (index: number) => {
    const updatedItems = [...(newMeeting.followUpItems || [])]
    updatedItems.splice(index, 1)
    setNewMeeting({ ...newMeeting, followUpItems: updatedItems })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newId = meetings.length ? Math.max(...meetings.map(m => m.id)) + 1 : 1
    const meetingToAdd = {
      ...newMeeting,
      id: newId,
      followUpItems: newMeeting.followUpItems || [],
      completed: false
    } as Meeting
    
    setMeetings([...meetings, meetingToAdd])
    setNewMeeting({
      employeeName: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      followUpItems: [],
      completed: false
    })
  }

  const toggleMeetingCompletion = (id: number) => {
    setMeetings(
      meetings.map(meeting =>
        meeting.id === id
          ? { ...meeting, completed: !meeting.completed }
          : meeting
      )
    )
  }

  // 動画ファイル選択・分析処理
  const handleSelectVideo = async (meetingId: number) => {
    try {
      // 非同期で動画ファイル選択ダイアログを表示
      const selectResult = await (window as any).electronAPI.selectVideoFile();
      
      if (!selectResult.success) {
        console.error('ファイル選択エラー:', selectResult.error);
        return;
      }
      
      setIsProcessing(true);
      
      // 選択されたミーティングを保存
      const meeting = meetings.find(m => m.id === meetingId);
      if (meeting) {
        setSelectedMeeting(meeting);
      }
      
      // 文字起こし・感情分析処理を実行
      const transcribeResult = await (window as any).electronAPI.transcribeVideo(selectResult.filePath);
      
      if (!transcribeResult.success) {
        console.error('文字起こしエラー:', transcribeResult.error);
        setIsProcessing(false);
        return;
      }
      
      // 分析結果をミーティングに追加して保存
      const updatedMeetings = meetings.map(meeting => {
        if (meeting.id === meetingId) {
          return {
            ...meeting,
            transcription: transcribeResult.result.transcription,
            sentiment: transcribeResult.result.sentiment,
            summary: transcribeResult.result.summary
          };
        }
        return meeting;
      });
      
      setMeetings(updatedMeetings);
      
      // 分析結果があるミーティングを選択して表示
      const analyzedMeeting = updatedMeetings.find(m => m.id === meetingId);
      if (analyzedMeeting) {
        setSelectedMeeting(analyzedMeeting);
        setIsAnalysisModalOpen(true);
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('動画処理エラー:', error);
      setIsProcessing(false);
    }
  };

  // 分析結果表示用モーダル
  const AnalysisModal = () => {
    if (!selectedMeeting || !selectedMeeting.transcription || !selectedMeeting.sentiment || !selectedMeeting.summary) {
      return null;
    }
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{selectedMeeting.employeeName}とのミーティング分析</h2>
              <button 
                onClick={() => setIsAnalysisModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">ミーティング総評</h3>
              <div className="border rounded-lg p-4 bg-blue-50">
                <p>{selectedMeeting.summary.overallAssessment}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">主なトピック</h3>
                <ul className="list-disc list-inside space-y-1">
                  {selectedMeeting.summary.mainTopics.map((topic: string, index: number) => (
                    <li key={index}>{topic}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">感情分析インサイト</h3>
                <ul className="list-disc list-inside space-y-1">
                  {selectedMeeting.summary.emotionalInsights.map((insight: string, index: number) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">アクションアイテム</h3>
              <ul className="list-disc list-inside space-y-1">
                {selectedMeeting.summary.actionItems.map((item: string, index: number) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">議事録</h3>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                {selectedMeeting.transcription.map((item: any, index: number) => (
                  <div key={index} className="mb-2 pb-2 border-b last:border-b-0">
                    <div className="flex items-center">
                      <span className="text-gray-500 text-sm mr-2">{`${item.start}s - ${item.end}s`}</span>
                      <span 
                        className={`text-xs px-2 py-0.5 rounded ${getEmotionColor(
                          selectedMeeting.sentiment.find((s: any) => item.start >= s.start && item.end <= s.end)?.emotion
                        )}`}
                      >
                        {getEmotionText(selectedMeeting.sentiment.find((s: any) => item.start >= s.start && item.end <= s.end)?.emotion)}
                      </span>
                    </div>
                    <p>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 感情に応じた色を返す関数
  const getEmotionColor = (emotion: string): string => {
    switch (emotion) {
      case 'neutral': return 'bg-gray-200 text-gray-800';
      case 'positive': return 'bg-green-200 text-green-800';
      case 'stressed': return 'bg-red-200 text-red-800';
      case 'concerned': return 'bg-yellow-200 text-yellow-800';
      case 'relieved': return 'bg-blue-200 text-blue-800';
      case 'interested': return 'bg-purple-200 text-purple-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  // 感情テキストを返す関数
  const getEmotionText = (emotion: string): string => {
    switch (emotion) {
      case 'neutral': return '中立';
      case 'positive': return 'ポジティブ';
      case 'stressed': return 'ストレス';
      case 'concerned': return '懸念';
      case 'relieved': return '安心';
      case 'interested': return '興味';
      default: return '中立';
    }
  };

  return (
    <Layout title="1on1ミーティング管理">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">1on1ミーティング管理</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ミーティングリスト */}
          <div>
            <h2 className="text-xl font-semibold mb-4">ミーティング一覧</h2>
            {meetings.length === 0 ? (
              <p className="text-gray-500">ミーティングはまだありません</p>
            ) : (
              <div className="space-y-4">
                {meetings.map(meeting => (
                  <div 
                    key={meeting.id} 
                    className={`border rounded-lg p-4 shadow-sm ${
                      meeting.completed ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{meeting.employeeName}</h3>
                        <p className="text-sm text-gray-500">{meeting.date}</p>
                      </div>
                      <div className="flex items-center">
                        {meeting.summary && (
                          <button
                            onClick={() => {
                              setSelectedMeeting(meeting);
                              setIsAnalysisModalOpen(true);
                            }}
                            className="mr-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                          >
                            分析結果
                          </button>
                        )}
                        <input 
                          type="checkbox" 
                          checked={meeting.completed}
                          onChange={() => toggleMeetingCompletion(meeting.id)}
                          className="h-5 w-5 text-blue-600"
                        />
                      </div>
                    </div>
                    
                    <p className="my-2">{meeting.notes}</p>
                    
                    {meeting.followUpItems.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium mb-1">フォローアップ項目:</h4>
                        <ul className="text-sm list-disc list-inside space-y-1">
                          {meeting.followUpItems.map((item, index) => (
                            <li key={index} className="text-gray-700">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <button
                        onClick={() => handleSelectVideo(meeting.id)}
                        disabled={isProcessing}
                        className={`text-sm px-3 py-1 rounded ${
                          isProcessing 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isProcessing ? '処理中...' : '動画を分析'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 新規ミーティングフォーム */}
          <div>
            <h2 className="text-xl font-semibold mb-4">新規ミーティング登録</h2>
            <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">従業員名</label>
                <input
                  type="text"
                  name="employeeName"
                  value={newMeeting.employeeName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">日付</label>
                <input
                  type="date"
                  name="date"
                  value={newMeeting.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">メモ</label>
                <textarea
                  name="notes"
                  value={newMeeting.notes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md h-24"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">フォローアップ項目</label>
                <div className="flex">
                  <input
                    type="text"
                    value={newFollowUpItem}
                    onChange={(e) => setNewFollowUpItem(e.target.value)}
                    className="w-full px-3 py-2 border rounded-l-md"
                    placeholder="新しい項目を入力"
                  />
                  <button
                    type="button"
                    onClick={handleAddFollowUpItem}
                    className="bg-blue-600 text-white px-3 py-2 rounded-r-md"
                  >
                    追加
                  </button>
                </div>
                
                {newMeeting.followUpItems && newMeeting.followUpItems.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {newMeeting.followUpItems.map((item, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-sm flex-grow">{item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFollowUpItem(index)}
                          className="text-red-500 text-sm"
                        >
                          削除
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                ミーティングを登録
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* 分析結果モーダル */}
      {isAnalysisModalOpen && <AnalysisModal />}
    </Layout>
  )
}

export default OneOnOnePage