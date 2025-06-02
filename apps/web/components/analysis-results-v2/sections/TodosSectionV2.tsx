import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare, AlertCircle, Lightbulb, Wrench } from 'lucide-react';
import { TodoItem } from '@/components/shared/DependencyAndTodoItems';

interface TodosSectionV2Props {
  todos: Array<{
    content: string;
    file_path: string;
    line: number;
    type: 'TODO' | 'FIXME' | 'HACK' | 'NOTE';
  }>;
  onFileClick?: (filePath: string, line?: number) => void;
}

const TODO_ICONS = {
  FIXME: AlertCircle,
  TODO: Lightbulb,
  HACK: Wrench,
  NOTE: CheckSquare
};

export const TodosSectionV2: React.FC<TodosSectionV2Props> = ({ todos, onFileClick }) => {
  const todoGroups = todos.reduce((acc, todo) => {
    const type = todo.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(todo);
    return acc;
  }, {} as Record<string, typeof todos>);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            TODO/FIXME Comments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(todoGroups).map(([type, items]) => {
            const Icon = TODO_ICONS[type as keyof typeof TODO_ICONS];
            return (
              <div key={type} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{type}</span>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.slice(0, 5).map((todo) => (
                    <TodoItem
                      key={`${todo.file_path}-${todo.line}`}
                      todo={todo}
                      variant="compact"
                      onFileClick={onFileClick}
                    />
                  ))}
                  {items.length > 5 && (
                    <Button variant="ghost" size="sm" className="w-full">
                      Show {items.length - 5} more
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};
