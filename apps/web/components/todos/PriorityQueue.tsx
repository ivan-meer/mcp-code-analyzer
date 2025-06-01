/**
 * Компонент приоритетной очереди TODO
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ProjectTodo } from '@/types/todos.types';
import { usePrioritizedTodos } from '@/hooks/useTodos';
import { TodoItem } from '@/components/shared/DependencyAndTodoItems';

interface PriorityQueueProps {
  todos: ProjectTodo[];
  maxDisplayItems?: number;
  onFileClick?: (filePath: string, line?: number) => void;
  className?: string;
}

export const PriorityQueue: React.FC<PriorityQueueProps> = React.memo(({
  todos,
  maxDisplayItems = 20,
  onFileClick,
  className = ''
}) => {
  const prioritizedTodos = usePrioritizedTodos(todos);
  const displayTodos = prioritizedTodos.slice(0, maxDisplayItems);
  const hasMore = prioritizedTodos.length > maxDisplayItems;

  return (
    <div className={`priority-queue space-y-3 ${className}`}>
      <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Сортировка по приоритету: FIXME → TODO → HACK → NOTE
      </div>
      
      {displayTodos.map((todo, index) => (
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
      
      {hasMore && (
        <div className="text-center p-4">
          <Button variant="outline" size="sm">
            Показать все {prioritizedTodos.length} элементов
          </Button>
        </div>
      )}
    </div>
  );
});

PriorityQueue.displayName = 'PriorityQueue';
