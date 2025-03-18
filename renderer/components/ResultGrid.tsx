import React from 'react';

interface ResultGridProps {
  data: any[];
}

const ResultGrid: React.FC<ResultGridProps> = ({ data }) => {
  // データが空の場合は何も表示しない
  if (!data || data.length === 0) {
    return <div className="text-gray-500">結果はありません</div>;
  }

  // メッセージのみの場合（非SELECT文の結果）
  if (data[0].message) {
    return <div className="text-green-600 font-medium">{data[0].message}</div>;
  }

  // テーブル列のヘッダーを取得
  const headers = Object.keys(data[0]);

  return (
    <div className="overflow-auto max-h-96 border rounded">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {headers.map((header) => (
                <td
                  key={`${rowIndex}-${header}`}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                >
                  {row[header] === null ? 
                    <span className="text-gray-400 italic">null</span> : 
                    String(row[header])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultGrid;