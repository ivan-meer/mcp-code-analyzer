import React from 'react';

interface ChartData {
  name: string;
  value: number;
}

interface BarChartProps {
  data: ChartData[];
}

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.name} className="flex items-center">
          <div className="w-24 text-sm">{item.name}</div>
          <div className="flex-1">
            <div 
              className="h-6 bg-blue-500 rounded"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          <div className="w-8 text-right text-sm">{item.value}%</div>
        </div>
      ))}
    </div>
  );
};

interface PieChartProps {
  data: ChartData[];
}

export const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="flex flex-wrap gap-2">
      {data.map((item) => (
        <div key={item.name} className="flex items-center">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: getColor(item.name) }}
          />
          <div className="ml-2 text-sm">
            {item.name}: {Math.round((item.value / total) * 100)}%
          </div>
        </div>
      ))}
    </div>
  );
};

function getColor(name: string): string {
  const colors: Record<string, string> = {
    'Errors': '#ef4444',
    'Warnings': '#f59e0b',
    'Suggestions': '#10b981',
    'Complexity': '#3b82f6',
    'Duplication': '#8b5cf6',
    'Issues': '#ec4899',
    'Coverage': '#14b8a6'
  };
  return colors[name] || '#64748b';
}
