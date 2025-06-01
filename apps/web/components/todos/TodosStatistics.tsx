/**
 * Компонент статистики TODO
 * Вынесен из основного файла для лучшей модуляризации
 */

import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProjectTodo } from '@/types/todos.types';
import { useTodoStatistics } from '@/hooks/useTodos';

interface TodosStatisticsProps {
  todos: ProjectTodo[];
  className?: string;
}

export const TodosStatistics: React.FC<TodosStatisticsProps> = React.memo(({ 
  todos, 
  className = '' 
}) => {
  const stats = useTodoStatistics(todos);

  const getDebtDescription = (debtIndex: number) => {
    if (debtIndex < 1) {
      return 'Отличное состояние кода! Минимальный технический долг.';
    } else if (debtIndex < 2) {
      return 'Умеренный технический долг. Стоит запланировать рефакторинг.';
    } else {
      return 'Высокий технический долг. Требуется приоритетная работа.';
    }
  };

  const getDebtBadgeVariant = (debtIndex: number) => {
    if (debtIndex > 2) return 'destructive';
    if (debtIndex > 1) return 'default';
    return 'secondary';
  };

  const getDebtBadgeLabel = (debtIndex: number) => {
    if (debtIndex > 2) return 'Высокий';
    if (debtIndex > 1) return 'Средний';
    return 'Низкий';
  };

  return (
    <div className={`todos-statistics space-y-4 ${className}`}>
      {/* Основная статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.totalCritical}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Критичных</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalTasks}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Задач</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.totalHacks}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Хаков</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.totalNotes}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Заметок</div>
        </div>
      </div>

      {/* Индекс технического долга */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Индекс технического долга
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Оценка: {stats.debtIndex.toFixed(1)}/3.0
              </span>
              <Badge variant={getDebtBadgeVariant(stats.debtIndex)}>
                {getDebtBadgeLabel(stats.debtIndex)}
              </Badge>
            </div>
            <Progress 
              value={(stats.debtIndex / 3) * 100} 
              className="h-2"
            />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {getDebtDescription(stats.debtIndex)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Предупреждения */}
      {stats.totalCritical > 0 && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Обнаружено {stats.totalCritical} критических проблем (FIXME). 
            Рекомендуется исправить их в приоритетном порядке.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
});

TodosStatistics.displayName = 'TodosStatistics';
