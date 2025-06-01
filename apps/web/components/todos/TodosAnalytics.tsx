/**
 * Компонент аналитики TODO
 */

import React from 'react';
import { PieChart, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectTodo } from '@/types/todos.types';
import { useTodoStatistics } from '@/hooks/useTodos';
import { TODO_TYPES } from '@/config/todos.config';

interface TodosAnalyticsProps {
  todos: ProjectTodo[];
  className?: string;
}

export const TodosAnalytics: React.FC<TodosAnalyticsProps> = React.memo(({
  todos,
  className = ''
}) => {
  const stats = useTodoStatistics(todos);

  if (todos.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        Нет данных для анализа
      </div>
    );
  }

  return (
    <div className={`todos-analytics grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Распределение по типам */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Распределение по типам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(TODO_TYPES).map(([type, config]) => {
              const count = stats.byType[type] || 0;
              const percentage = todos.length > 0 ? (count / todos.length) * 100 : 0;
              
              if (count === 0) return null;
              
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <config.icon className={`h-4 w-4 ${config.color}`} />
                    <span className="text-sm">{config.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Топ проблемных файлов */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            Файлы с наибольшим техдолгом
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.mostProblematicFiles.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Нет данных о проблемных файлах
              </div>
            ) : (
              stats.mostProblematicFiles.map(([fileName, count]) => (
                <div key={fileName} className="flex items-center justify-between">
                  <span className="text-sm truncate pr-2" title={fileName}>
                    {fileName}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {count}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Дополнительные метрики */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">Сводная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {Object.keys(stats.byFile).length}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Файлов с TODO
              </div>
            </div>
            
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {(todos.length / Math.max(Object.keys(stats.byFile).length, 1)).toFixed(1)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Среднее на файл
              </div>
            </div>
            
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {((stats.totalCritical / Math.max(todos.length, 1)) * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Критичных
              </div>
            </div>
            
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {stats.debtIndex.toFixed(1)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Индекс долга
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

TodosAnalytics.displayName = 'TodosAnalytics';
