import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ChartProps {
  data: any[];
}

const Chart: React.FC<ChartProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [xAxisKey, setXAxisKey] = useState<string>('');
  const [yAxisKey, setYAxisKey] = useState<string>('');

  // データの列を取得
  const columns = useMemo(() => {
    if (data && data.length > 0) {
      return Object.keys(data[0]);
    }
    return [];
  }, [data]);

  // コンポーネントのマウント時またはデータ変更時に最初の列をデフォルト選択
  useMemo(() => {
    if (columns.length > 0) {
      setXAxisKey(columns[0]);
      // 数値型の列を探してY軸にデフォルト設定
      const numericColumn = columns.find(col => 
        typeof data[0][col] === 'number'
      );
      setYAxisKey(numericColumn || columns[1] || columns[0]);
    }
  }, [columns, data]);

  // データがない場合
  if (!data || data.length === 0) {
    return <div>グラフを表示するデータがありません。</div>;
  }

  // 適切なデータが選択されていない場合
  if (!xAxisKey || !yAxisKey) {
    return <div>X軸とY軸のデータフィールドを選択してください。</div>;
  }

  // パイチャート用のCOLORS
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  // チャートの種類に応じたレンダリング
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={yAxisKey} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={yAxisKey} stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                fill="#8884d8"
                dataKey={yAxisKey}
                nameKey={xAxisKey}
                label={(entry) => entry[xAxisKey]}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return <div>選択したチャートタイプは無効です。</div>;
    }
  };

  return (
    <div className="chart-container">
      <div className="flex mb-4 space-x-4">
        <div>
          <label htmlFor="chart-type" className="block text-sm font-medium text-gray-700 mb-1">
            グラフの種類
          </label>
          <select
            id="chart-type"
            value={chartType}
            onChange={(e) => setChartType(e.target.value as any)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="bar">棒グラフ</option>
            <option value="line">折れ線グラフ</option>
            <option value="pie">円グラフ</option>
          </select>
        </div>

        <div>
          <label htmlFor="x-axis" className="block text-sm font-medium text-gray-700 mb-1">
            X軸 / ラベル
          </label>
          <select
            id="x-axis"
            value={xAxisKey}
            onChange={(e) => setXAxisKey(e.target.value)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            {columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="y-axis" className="block text-sm font-medium text-gray-700 mb-1">
            Y軸 / 値
          </label>
          <select
            id="y-axis"
            value={yAxisKey}
            onChange={(e) => setYAxisKey(e.target.value)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            {columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>
      </div>

      {renderChart()}
    </div>
  );
};

export default Chart;