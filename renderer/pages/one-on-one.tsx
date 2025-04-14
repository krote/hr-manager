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
                      <input 
                        type="checkbox" 
                        checked={meeting.completed}
                        onChange={() => toggleMeetingCompletion(meeting.id)}
                        className="h-5 w-5 text-blue-600"
                      />
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
    </Layout>
  )
}

export default OneOnOnePage