import React, { useState, useEffect } from 'react';
import { DataRow } from '../types/index';

interface DataTableProps {
  data: DataRow[];
}

interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc';
}

type Filters = {
  [key: string]: string;
};

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState<Filters>({});
  const [filteredData, setFilteredData] = useState<DataRow[]>([]);

  useEffect(() => {
    let filtered = [...data];

    // フィルタ適用
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        filtered = filtered.filter(item => {
          if (item[key] === null || item[key] === undefined) return false;
          return item[key].toString().toLowerCase().includes(filters[key].toLowerCase());
        });
      }
    });

    // ソート適用
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key!] < b[sortConfig.key!]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key!] > b[sortConfig.key!]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredData(filtered);
  }, [data, filters, sortConfig]);

  const requestSort = (key: string): void => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (key: string, value: string): void => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (!data || data.length === 0) {
    return <div className="bg-white p-6 rounded-lg shadow text-center">データがありません</div>;
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort(column)}
                >
                  <div className="flex items-center">
                    {column}
                    {sortConfig.key === column && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
            <tr>
              {columns.map((column) => (
                <th key={`filter-${column}`} className="px-6 py-2 bg-gray-100">
                  <input
                    type="text"
                    className="block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`${column}でフィルタ`}
                    value={filters[column] || ''}
                    onChange={(e) => handleFilterChange(column, e.target.value)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row[column] !== null && row[column] !== undefined ? row[column].toString() : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="text-sm text-gray-700">
          {filteredData.length} 件中 {filteredData.length} 件表示 (フィルタ適用済み)
        </div>
      </div>
    </div>
  );
};

export default DataTable;