import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { DataRow } from '../types';

// ChartJSの登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type ChartType = 'bar' | 'line' | 'pie' | 'doughnut';

interface DataGraphProps {
  data: DataRow[];
}

const DataGraph: React.FC<DataGraphProps> = ({ data }) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [chartData, setChartData] = useState<ChartData<ChartType> | null>(null);
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');

  // データからカラムの取得
  const columns: string[] = data && data.length > 0 ? Object.keys(data[0]) : [];
  
  // 数値カラムを識別
  const numericColumns: string[] = columns.filter(column => {
    return data.some(row => typeof row[column] === 'number');
  });

  // カテゴリカラム (文字列または日付を含むカラム)
  const categoryColumns: string[] = columns.filter(column => {
    return !numericColumns.includes(column);
  });

  useEffect(() => {
    if (data && data.length > 0 && xAxis && yAxis) {
      prepareChartData();
    }
  }, [data, xAxis, yAxis, chartType]);

  useEffect(() => {
    // 初期カラム設定
    if (categoryColumns.length > 0) {
      setXAxis(categoryColumns[0]);
    }
    if (numericColumns.length > 0) {
      setYAxis(numericColumns[0]);
    }
  }, [data]);

  const prepareChartData = (): void => {
    const labels = data.map(item => item[xAxis]);
    
    // 棒グラフ、線グラフ用データ
    if (chartType === 'bar' || chartType === 'line') {
      const datasets = [{
        label: yAxis,
        data: data.map(item => item[yAxis]),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgb(53, 162, 235)',
        borderWidth: 1,
      }];
      
      setChartData({
        labels,
        datasets,
      });
    } 
    // 円グラフ、ドーナツグラフ用データ
    else if (chartType === 'pie' || chartType === 'doughnut') {
      const backgroundColors = [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)',
        'rgba(255, 159, 64, 0.5)',
      ];
      
      setChartData({
        labels,
        datasets: [{
          label: yAxis,
          data: data.map(item => item[yAxis]),
          backgroundColor: labels.map((_, i) => backgroundColors[i % backgroundColors.length]),
          borderColor: 'white',
          borderWidth: 1,
        }],
      });
    }
  };

  const renderChart = (): React.ReactNode => {
    if (!chartData) {
      return <div className="p-6 text-center">データとカラムを選択してください</div>;
    }

    const options: ChartOptions<ChartType> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: `${xAxis} vs ${yAxis}`,
        },
      },
    };
/*
    switch (chartType) {
      case 'bar':
        return <Bar data={chartData} options={options as ChartOptions<'bar'>} height={300} />;
      case 'line':
        return <Line data={chartData} options={options as ChartOptions<'line'>} height={300} />;
      case 'pie':
        return <Pie data={chartData} options={options as ChartOptions<'pie'>} height={300} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={options as ChartOptions<'doughnut'>} height={300} />;
      default:
        return <Bar data={chartData} options={options as ChartOptions<'bar'>} height={300} />;
    }
        */
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex flex-wrap mb-4 gap-4">
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">グラフタイプ</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as ChartType)}
            className="block w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="bar">棒グラフ</option>
            <option value="line">折れ線グラフ</option>
            <option value="pie">円グラフ</option>
            <option value="doughnut">ドーナツグラフ</option>
          </select>
        </div>
        
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">X軸 (カテゴリ)</label>
          <select
            value={xAxis}
            onChange={(e) => setXAxis(e.target.value)}
            className="block w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">選択してください</option>
            {categoryColumns.map(column => (
              <option key={column} value={column}>{column}</option>
            ))}
          </select>
        </div>
        
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">Y軸 (数値)</label>
          <select
            value={yAxis}
            onChange={(e) => setYAxis(e.target.value)}
            className="block w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">選択してください</option>
            {numericColumns.map(column => (
              <option key={column} value={column}>{column}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mt-4" style={{ height: '400px' }}>
        {renderChart()}
      </div>
    </div>
  );
};

export default DataGraph;