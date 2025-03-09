import React, { useState } from 'react';
import { SampleQuery } from '../types';

interface SqlEditorProps {
  onExecute: (sql: string) => void;
}

const SqlEditor: React.FC<SqlEditorProps> = ({ onExecute }) => {
  const [sql, setSql] = useState<string>('SELECT * FROM sales LIMIT 10');

  const handleExecute = (): void => {
    onExecute(sql);
  };

  // サンプルクエリのリスト
  const sampleQueries: SampleQuery[] = [
    { name: '全データ', query: 'SELECT * FROM sales LIMIT 10' },
    { name: '製品別集計', query: 'SELECT product, SUM(amount) as total FROM sales GROUP BY product ORDER BY total DESC' },
    { name: 'カテゴリ別集計', query: 'SELECT category, COUNT(*) as count, SUM(amount) as total FROM sales GROUP BY category' },
    { name: '月別集計', query: "SELECT strftime('%Y-%m', date) as month, SUM(amount) as total FROM sales GROUP BY month ORDER BY month" }
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">SQLクエリ</h2>
          <div className="flex space-x-2">
            <select 
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
              onChange={(e) => setSql(e.target.value)}
            >
              <option value="">サンプルクエリ</option>
              {sampleQueries.map((item, index) => (
                <option key={index} value={item.query}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          className="w-full h-40 p-3 border border-gray-300 rounded-md font-mono"
          placeholder="SELECT * FROM table"
        />
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleExecute}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          実行
        </button>
      </div>
    </div>
  );
};

export default SqlEditor;