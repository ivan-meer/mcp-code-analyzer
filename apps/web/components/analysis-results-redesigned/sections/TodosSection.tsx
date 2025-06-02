/**
 * Секция для работы с TODO/FIXME/HACK комментариями
 * 
 * Этот компонент предоставляет комплексный интерфейс для управления
 * задачами и заметками разработчиков, найденными в коде проекта.
 * Он помогает отслеживать технический долг и планировать рефакторинг.
 * 
 * Особенности:
 * 1. Приоритизация по типам (FIXME > TODO > HACK > NOTE)
 * 2. Группировка по файлам и авторам
 * 3. Анализ распределения технического долга
 * 4. Экспорт для систем управления задачами
 * 5. Интеграция с редакторами кода
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, AlertCircle, Lightbulb, Wrench, Calendar,
  Download, Filter, TrendingUp, PieChart, FileText,
  ExternalLink, Target, Clock, User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { ProjectTodo } from '@/types/analysis.types';
import { useTodoFiltering } from '@/hooks/useFiltering';
import { SearchFilter } from '@/components/shared/SearchFilter';
import { VirtualList } from '@/components/shared/VirtualList';
import { TodoItem } from '@/components/shared/DependencyAndTodoItems';

interface TodosSectionProps {
  todos: Array<ProjectTodo & { type: 'TODO' | 'FIXME' | 'HACK' | 'NOTE' }>;
  projectPath: string;
  onFileNavigate?: (filePath: string, line?: number) => void;
  className?: string;
}

/**
 * Компонент для отображения статистики по TODO
 */
const TodosOverview: React.FC<{ todos: Array<ProjectTodo & { type: 'TODO' | 'FIXME' | 'HACK' | 'NOTE' }> }> = ({ todos }) => {
  const totalCount = todos.length;
  const criticalCount = todos.filter(t => t.type === 'FIXME').length;
  const todoCount = todos.filter(t => t.type === 'TODO').length;
  const hackCount = todos.filter(t => t.type === 'HACK').length;
  const noteCount = todos.filter(t => t.type === 'NOTE').length;

  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center space-x-1">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span>{criticalCount}</span>
      </div>
      <div className="flex items-center space-x-1">
        <Lightbulb className="h-4 w-4 text-blue-500" />
        <span>{todoCount}</span>
      </div>
      <div className="flex items-center space-x-1">
        <Wrench className="h-4 w-4 text-orange-500" />
        <span>{hackCount}</span>
      </div>
      <div className="flex items-center space-x-1">
        <Calendar className="h-4 w-4 text-green-500" />
        <span>{noteCount}</span>
      </div>
      <div className="flex items-center space-x-1">
        <span className="text-slate-500 dark:text-slate-400">Всего:</span>
        <span>{totalCount}</span>
      </div>
    </div>
  );
};

/**
 * Типы TODO с их конфигурацией
 */
const TODO_TYPES: Record<'FIXME' | 'TODO' | 'HACK' | 'NOTE', {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  priority: number;
  label: string;
  description: string;
}> = {
  FIXME: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    priority: 1,
    label: 'Критично',
    description: 'Требует немедленного исправления'
  },
  TODO: {
    icon: Lightbulb,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    priority: 2,
    label: 'Запланировано',
    description: 'Задача для будущей реализации'
  },
  HACK: {
    icon: Wrench,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    priority: 3,
    label: 'Временное решение',
    description: 'Требует рефакторинга'
  },
  NOTE: {
    icon: Calendar,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    priority: 4,
    label: 'Заметка',
    description: 'Информационный комментарий'
  }
} as const;

/**
 * Компонент статистики TODO
 */
const TodosStatistics: React.FC<{ todos: ProjectTodo[] }> = ({ todos }) => {
  const stats = useMemo(() => {
    const byType = todos.reduce((acc, todo) => {
      acc[todo.type] = (acc[todo.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byFile = todos.reduce((acc, todo) => {
      const fileName = todo.file_path.split('/').pop() || todo.file_path;
      acc[fileName] = (acc[fileName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalCritical = (byType.FIXME || 0);
    const totalTasks = (byType.TODO || 0);
    const totalHacks = (byType.HACK || 0);
    const totalNotes = (byType.NOTE || 0);

    // Расчет "индекса технического долга"
    const debtIndex = (totalCritical * 3 + totalTasks * 2 + totalHacks * 1) / Math.max(todos.length, 1);

    return {
      byType,
      byFile,
      totalCritical,
      totalTasks,
      totalHacks,
      totalNotes,
      debtIndex,
      mostProblematicFiles: Object.entries(byFile)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
    };
  }, [todos]);

  return (
    <div className="space-y-4">
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
              <Badge 
                variant={stats.debtIndex > 2 ? 'destructive' : stats.debtIndex > 1 ? 'default' : 'secondary'}
              >
                {stats.debtIndex > 2 ? 'Высокий' : stats.debtIndex > 1 ? 'Средний' : 'Низкий'}
              </Badge>
            </div>
            <Progress 
              value={(stats.debtIndex / 3) * 100} 
              className="h-2"
            />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {stats.debtIndex < 1 
                ? 'Отличное состояние кода! Минимальный технический долг.'
                : stats.debtIndex < 2
                ? 'Умеренный технический долг. Стоит запланировать рефакторинг.'
                : 'Высокий технический долг. Требуется приоритетная работа.'
              }
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
};

/**
 * Компонент анализа TODO по файлам
 */
const TodosByFiles: React.FC<{ 
  todos: ProjectTodo[];
  onFileClick?: (filePath: string, line?: number) => void;
}> = ({ todos, onFileClick }) => {
  const fileGroups = useMemo(() => {
    const groups = todos.reduce((acc, todo) => {
      const fileName = todo.file_path.split('/').pop() || todo.file_path;
      if (!acc[fileName]) {
        acc[fileName] = {
          fullPath: todo.file_path,
          todos: [],
          criticalCount: 0,
          totalCount: 0
        };
      }
      acc[fileName].todos.push(todo);
      acc[fileName].totalCount++;
      if (todo.type === 'FIXME') {
        acc[fileName].criticalCount++;
      }
      return acc;
    }, {} as Record<string, {
      fullPath: string;
      todos: ProjectTodo[];
      criticalCount: number;
      totalCount: number;
    }>);

    return Object.entries(groups)
      .sort(([, a], [, b]) => b.criticalCount - a.criticalCount || b.totalCount - a.totalCount);
  }, [todos]);

  return (
    <div className="space-y-3">
      {fileGroups.map(([fileName, group]) => (
        <Card key={fileName} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => onFileClick?.(group.fullPath)}
                className="flex items-center space-x-2 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <FileText className="h-4 w-4" />
                <span className="font-medium">{fileName}</span>
                <ExternalLink className="h-3 w-3" />
              </button>
              <div className="flex items-center space-x-2">
                {group.criticalCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {group.criticalCount} критичных
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {group.totalCount} всего
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {group.todos.slice(0, 3).map((todo, index) => (
                <TodoItem
                  key={`${todo.file_path}-${todo.line}`}
                  todo={todo}
                  variant="compact"
                  onFileClick={onFileClick}
                />
              ))}
              {group.todos.length > 3 && (
                <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">
                  ... и еще {group.todos.length - 3} элементов
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/**
 * Компонент приоритетной очереди TODO
 */
const PriorityQueue: React.FC<{ 
  todos: ProjectTodo[];
  onFileClick?: (filePath: string, line?: number) => void;
}> = ({ todos, onFileClick }) => {
  const prioritizedTodos = useMemo(() => {
    return [...todos].sort((a, b) => {
      const aPriority = TODO_TYPES[a.type as keyof typeof TODO_TYPES].priority;
      const bPriority = TODO_TYPES[b.type as keyof typeof TODO_TYPES].priority;
      return aPriority - bPriority;
    });
  }, [todos]);

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Сортировка по приоритету: FIXME → TODO → HACK → NOTE
      </div>
      {prioritizedTodos.slice(0, 20).map((todo, index) => (
        <motion.div
          key={`${todo.file_path}-${todo.line}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <TodoItem
            todo={todo}
            variant="detailed"
            onFileClick={onFileClick}
          />
        </motion.div>
      ))}
      {prioritizedTodos.length > 20 && (
        <div className="text-center p-4">
          <Button variant="outline" size="sm">
            Показать все {prioritizedTodos.length} элементов
          </Button>
        </div>
      )}
    </div>
  );
};

/**
 * Основной компонент TodosSection
 */
export const TodosSection: React.FC<TodosSectionProps> = ({
  todos,
  projectPath,
  onFileNavigate,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('list');

  // Используем хук фильтрации для TODO с адаптером типов
  const {
    filteredTodos,
    filters: rawFilters,
    search,
    updateFilters: rawUpdateFilters,
    quickSearch,
    resetFilters,
    availableTodoTypes,
    stats
  } = useTodoFiltering(todos as Array<ProjectTodo & { type: 'TODO' | 'FIXME' | 'HACK' | 'NOTE' }>);

  // Адаптер для преобразования FilterState в формат, ожидаемый SearchFilter
  const filters = useMemo(() => ({
    todoTypes: rawFilters.todoTypes || []
  }), [rawFilters]);

  // Адаптер для преобразования вызовов SearchFilter в формат useTodoFiltering
  const updateFilters = useCallback((groupId: string, values: string[]) => {
    if (groupId === 'todoTypes') {
      rawUpdateFilters({ todoTypes: values });
    }
  }, [rawUpdateFilters]);

  // Подготовка фильтров с учетом строгой типизации
  const filterGroups = useMemo(() => [
    {
      id: 'todoTypes',
      label: 'Типы задач',
      options: (['FIXME', 'TODO', 'HACK', 'NOTE'] as const)
        .filter(type => availableTodoTypes.includes(type))
        .map(type => ({
          id: type,
          label: TODO_TYPES[type].label,
          count: todos.filter(t => t.type === type).length
        })),
      multiSelect: true
    }
  ], [availableTodoTypes, todos]);

  // Обработчики событий
  const handleFileClick = useCallback((filePath: string, line?: number) => {
    onFileNavigate?.(filePath, line);
  }, [onFileNavigate]);

  const handleCopyContent = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
  }, []);

  const handleExport = useCallback(() => {
    // Экспорт в формате для трекеров задач
    const exportData = filteredTodos.map(todo => ({
      title: `[${todo.type}] ${todo.content.substring(0, 50)}${todo.content.length > 50 ? '...' : ''}`,
      description: todo.content,
      file: todo.file_path,
      line: todo.line,
      type: todo.type,
      priority: TODO_TYPES[todo.type as keyof typeof TODO_TYPES]?.label || 'Normal'
    }));

    const csvContent = [
      'Title,Description,File,Line,Type,Priority',
      ...exportData.map(item => 
        `"${item.title}","${item.description}","${item.file}",${item.line},"${item.type}","${item.priority}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectPath.split('/').pop()}-todos.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredTodos, projectPath]);

  const renderTodoItem = useCallback((todo: ProjectTodo, index: number) => (
    <TodoItem
      todo={todo}
      variant="default"
      searchTerm={search.query}
      onFileClick={handleFileClick}
      onCopyContent={handleCopyContent}
    />
  ), [search.query, handleFileClick, handleCopyContent]);

  // Если нет TODO комментариев
  if (todos.length === 0) {
    return (
      <Card className={`todos-section ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            TODO/FIXME комментарии
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CheckSquare className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Отличная работа!
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              В коде проекта не найдено TODO, FIXME или HACK комментариев. 
              Это указывает на высокое качество кода и отсутствие технического долга.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`todos-section ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            TODO/FIXME комментарии
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          {Object.entries(TODO_TYPES).map(([type, config]) => {
            const count = todos.filter(t => t.type === type).length;
            if (count === 0) return null;
            
            return (
              <div 
                key={type}
                className={`${config.bgColor} p-4 rounded-lg flex flex-col items-center justify-center`}
              >
                <config.icon className={`h-6 w-6 ${config.color} mb-2`} />
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{config.label}</div>
              </div>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Поиск и фильтры */}
        <SearchFilter
          searchPlaceholder="Поиск по содержимому комментариев и файлам..."
          searchValue={search.query}
          onSearchChange={quickSearch}
          filterGroups={filterGroups}
          activeFilters={filters}
          onFilterChange={updateFilters}
          totalItems={todos.length}
          filteredItems={stats.filteredItems}
          onClearAll={resetFilters}
          variant="minimal"
        />

        {/* Вкладки с различными представлениями */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="list">Список</TabsTrigger>
            <TabsTrigger value="priority">По приоритету</TabsTrigger>
            <TabsTrigger value="files">По файлам</TabsTrigger>
            <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <VirtualList
              items={filteredTodos}
              renderItem={renderTodoItem}
              height={600}
              itemHeight={120}
              emptyMessage="TODO комментарии не найдены. Попробуйте изменить критерии поиска."
              showScrollIndicator={filteredTodos.length > 20}
              animateItems={filteredTodos.length < 20}
              ariaLabel="Список TODO комментариев"
            />
          </TabsContent>

          <TabsContent value="priority" className="space-y-4">
            <PriorityQueue 
              todos={filteredTodos}
              onFileClick={handleFileClick}
            />
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <TodosByFiles 
              todos={filteredTodos}
              onFileClick={handleFileClick}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      const count = filteredTodos.filter(t => t.type === type).length;
                      const percentage = (count / filteredTodos.length) * 100;
                      
                      if (count === 0) return null;
                      
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <config.icon className={`h-4 w-4 ${config.color}`} />
                            <span className="text-sm">{config.label}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded">
                              <div 
                                className="h-full bg-blue-500 rounded"
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
                    {Object.entries(
                      filteredTodos.reduce((acc, todo) => {
                        const fileName = todo.file_path.split('/').pop() || todo.file_path;
                        acc[fileName] = (acc[fileName] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([fileName, count]) => (
                        <div key={fileName} className="flex items-center justify-between">
                          <span className="text-sm truncate">{fileName}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TodosSection;
