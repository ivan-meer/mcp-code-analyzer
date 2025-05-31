import React from 'react';
import { ProjectAnalysis } from '@/types/analysis.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Files, GitBranch, Zap, BookOpen, CheckSquare } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Pie, PieChart, Cell } from 'recharts';

interface ProjectVisualizationProps {
  data: ProjectAnalysis;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const ProjectVisualization: React.FC<ProjectVisualizationProps> = ({ data }) => {
  // Prepare data for charts
  const fileTypeData = data.files.reduce((acc, file) => {
    const type = file.type;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const fileTypeChartData = Object.entries(fileTypeData).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  const languageData = data.metrics.languages.map(lang => ({
    name: lang,
    value: data.files.filter(file => file.type === lang).length,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Визуализация проекта
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Основные метрики */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Основные метрики
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{data.metrics.total_files}</div>
                  <div className="text-sm text-gray-500">Файлов</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{data.metrics.total_lines.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Строк кода</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{data.metrics.total_functions}</div>
                  <div className="text-sm text-gray-500">Функций</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{Math.round(data.metrics.avg_lines_per_file)}</div>
                  <div className="text-sm text-gray-500">Строк/файл</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Диаграмма типов файлов */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Files className="h-5 w-5" />
                Типы файлов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={fileTypeChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {fileTypeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Диаграмма языков */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Языки программирования
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={languageData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Диаграмма зависимостей */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Зависимости
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={data.dependencies}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <XAxis dataKey="from" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="to" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* TODO/FIXME комментарии */}
          {data.all_todos && data.all_todos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  TODO/FIXME комментарии
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.all_todos.slice(0, 5).map((todo, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                      <span className="font-medium">{todo.content}</span>
                      <span className="text-sm text-gray-500">{todo.file_path}:{todo.line}</span>
                    </li>
                  ))}
                </ul>
                {data.all_todos.length > 5 && (
                  <div className="text-center text-sm text-gray-500 mt-4">
                    Показано только 5 из {data.all_todos.length} комментариев
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectVisualization;
