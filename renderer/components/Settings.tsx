import React, { useState } from 'react';

const Settings: React.FC = () => {
  const [theme, setTheme] = useState<string>('light');
  const [fontSize, setFontSize] = useState<string>('medium');
  const [autoExecute, setAutoExecute] = useState<boolean>(false);

  // 設定が変更された時に呼び出される関数
  // 実際のアプリケーションでは、設定を保存する処理を追加する
  const handleSaveSettings = () => {
    alert('設定が保存されました');
    // localStorage や Electron の設定保存機能などを使う実装を追加
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">設定</h2>

      <div className="max-w-md">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            テーマ
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="small">小</option>
            <option value="medium">中</option>
            <option value="large">大</option>
          </select>
        </div>

        <div className="mb-4">
          <div className="flex items-center">
            <input
              id="auto-execute"
              type="checkbox"
              checked={autoExecute}
              onChange={(e) => setAutoExecute(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="auto-execute" className="ml-2 block text-sm text-gray-700">
              サンプルクエリを選択時に自動実行する
            </label>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSaveSettings}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            設定を保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;