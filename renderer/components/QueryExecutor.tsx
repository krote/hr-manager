import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import ResultGrid from '../components/ResultGrid';
import Chart from '../components/Chart';

interface QueryExecutorProps {
  initialQuery?: string;
  onQueryChange?: (query: string) => void;
}

const QueryExecutor = forwardRef<any, QueryExecutorProps>(({ initialQuery = 'SELECT * FROM sample_data', onQueryChange }, ref) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showChart, setShowChart] = useState<boolean>(false);

  // クエリを実行する関数
  const executeQuery = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    setShowChart(false);

    try {
      const result = await window.electronAPI.executeQuery(query);
      
      if (result.success) {
        // SELECTクエリの場合、データを表示
        if (result.data) {
          setResults(result.data);
        } 
        // その他のクエリの場合、変更行数を表示
        else if (result.changes !== undefined) {
          setResults([{ message: `操作が成功しました。${result.changes}行が変更されました。` }]);
        }
      } else {
        setError(result.error || 'クエリの実行中にエラーが発生しました。');
      }
    } catch (err) {
      setError('クエリの実行中にエラーが発生しました: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  // クエリの変更ハンドラ
  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (onQueryChange) {
      onQueryChange(newQuery);
    }
  };

  // チャートの表示／非表示を切り替える関数
  const toggleChart = () => {
    setShowChart(!showChart);
  };

  // 親コンポーネントから executeQuery を呼び出せるようにする
  useImperativeHandle(ref, () => ({
    executeQuery
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">SQLクエリの実行</h2>
        
        {/* クエリ入力エリア */}
        <div className="mb-4">
          <textarea
            value={query}
            onChange={handleQueryChange}
            className="w-full h-32 p-2 border border-gray-300 rounded font-mono"
            placeholder="SQLクエリを入力してください..."
          />
        </div>
        
        {/* 実行ボタン */}
        <div className="mb-4">
          <button
            onClick={executeQuery}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isLoading ? '実行中...' : 'クエリを実行'}
          </button>
        </div>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="px-4 mb-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* 結果表示エリア */}
      {results && results.length > 0 && (
        <div className="px-4 flex-grow overflow-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold">実行結果</h3>
            
            {/* グラフ表示切り替えボタン - データが適切な形式の場合のみ表示 */}
            {!results[0].message && (
              <button
                onClick={toggleChart}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {showChart ? 'グラフを非表示' : 'グラフを表示'}
              </button>
            )}
          </div>
          
          {/* テーブル表示 */}
          <ResultGrid data={results} />
          
          {/* グラフ表示 */}
          {showChart && !results[0].message && (
            <div className="mt-4 border p-4 rounded">
              <Chart data={results} />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default QueryExecutor;