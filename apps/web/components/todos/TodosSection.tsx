/**
 * Рефакторинговая версия TodosSection
 * Разбит на подкомпоненты для лучшей читаемости и поддержки
 */

import React, { useState, useCallback, useMemo } from 'react';
import { CheckSquare, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ProjectTodo, TodoViewMode } from '@/types/todos.types';
import { useTodoFiltering } from '@/hooks/useFiltering';
import { useTodoExport } from '@/hooks/useTodos';
import { SearchFilter } from '@/components/shared/SearchFilter';
import { VirtualList } from '@/components/shared/VirtualList';
import { TodoItem } from '@/components/shared/DependencyAndTodoItems';

// Импорт подкомпонентов
import { TodosStatistics } from '@/components/todos/TodosStatistics';
import { PriorityQueue } from '@/components/todos/PriorityQueue';
import { TodosByFiles } from '@/components/todos/TodosByFiles';
import { TodosAnalytics } from '@/components/todos/TodosAnalytics';

interface TodosSectionProps {
  todos: ProjectTodo[];
  projectPath: string;
  onFileNavigate?: (filePath: string, line?: number) => void;
  className?: string;
}

/**
 * Компонент пустого состояния
 */
const EmptyTodosState: React.FC = React.memo(() => (
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
));

EmptyTodosState.displayName = 'EmptyTodosState';

/**
 * Основной компонент TodosSection
 */
export const TodosSection: React.FC<TodosSectionProps> = ({
  todos,
  projectPath,
  onFileNavigate,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<TodoViewMode>('list');
  const { exportToCSV, exportToJSON } = useTodoExport();

  // Хук фильтрации для TODO
  const {
    filteredTodos,
    filters,
    search,
    updateFilters,
    quickSearch,
    resetFilters,
    availableTodoTypes,
    stats
  } = useTodoFiltering(todos);

  // Мемоизированные фильтры для оптимизации
  const filterGroups = useMemo(() => [
    {
      id: 'todoTypes',
      label: 'Типы задач',
      options: availableTodoTypes.map(type => ({
        id: type,
        label: type,
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

  const handleExport = useCallback((format: 'csv' | 'json' = 'csv') => {
    if (format === 'csv') {
      exportToCSV(filteredTodos, projectPath);
    } else {
      exportToJSON(filteredTodos, projectPath);
    }
  }, [exportToCSV, exportToJSON, filteredTodos, projectPath]);

  // Функция рендера элементов списка
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
          <EmptyTodosState />
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
            <Button 
              className="outline"
              size="sm"
              onClick={() => handleExport('csv')}
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button 
              className="outline"
              size="sm" 
              onClick={() => handleExport('json')}
            >
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>

        {/* Статистика */}
        <TodosStatistics todos={todos} />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Поиск и фильтры */}
        <SearchFilter
          searchPlaceholder="Поиск по содержимому комментариев и файлам..."
          searchValue={search.query}
          onSearchChange={quickSearch}
          filterGroups={filterGroups}
          activeFilters={filters as unknown as { [groupId: string]: string[] }}
          onFilterChange={(groupId, values) => updateFilters({ [groupId]: values })}
          totalItems={todos.length}
          filteredItems={stats.filteredItems}
          onClearAll={resetFilters}
          variant="minimal"
        />

        {/* Вкладки с различными представлениями */}
        <Tabs value={activeTab} onValueChange={setActiveTab as (value: string) => void}>
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
            <TodosAnalytics todos={filteredTodos} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TodosSection;
