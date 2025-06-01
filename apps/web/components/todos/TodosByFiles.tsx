/**
 * Компонент анализа TODO по файлам
 */

import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectTodo } from '@/types/todos.types';
import { useTodoFileGroups } from '@/hooks/useTodos';
import { TodoItem } from '@/components/shared/DependencyAndTodoItems';

interface TodosByFilesProps {
  todos: ProjectTodo[];
  maxItemsPerFile?: number;
  onFileClick?: (filePath: string, line?: number) => void;
  className?: string;
}

export const TodosByFiles: React.FC<TodosByFilesProps> = React.memo(({
  todos,
  maxItemsPerFile = 3,
  onFileClick,
  className = ''
}) => {
  const fileGroups = useTodoFileGroups(todos);

  if (fileGroups.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        Нет TODO комментариев для отображения
      </div>
    );
  }

  return (
    <div className={`todos-by-files space-y-3 ${className}`}>
      {fileGroups.map(([fileName, group]) => (
        <Card 
          key={fileName} 
          className="hover:shadow-md transition-shadow"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => onFileClick?.(group.fullPath)}
                className="flex items-center space-x-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span className="font-medium truncate">{fileName}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
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
              {group.todos.slice(0, maxItemsPerFile).map((todo, index) => (
                <TodoItem
                  key={`${todo.file_path}-${todo.line}`}
                  todo={todo}
                  variant="compact"
                  onFileClick={onFileClick}
                />
              ))}
              
              {group.todos.length > maxItemsPerFile && (
                <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">
                  ... и еще {group.todos.length - maxItemsPerFile} элементов
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

TodosByFiles.displayName = 'TodosByFiles';
