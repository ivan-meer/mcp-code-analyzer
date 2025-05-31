/**
 * Компоненты для отображения зависимостей и TODO элементов
 * 
 * Эти компоненты предоставляют единообразный способ отображения
 * различных типов данных анализа проекта. Каждый компонент
 * оптимизирован для своего типа контента, но следует общим
 * принципам дизайна приложения.
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  GitBranch, ArrowUp, ExternalLink, Copy, AlertCircle, 
  Lightbulb, Wrench, Calendar, MapPin, MoreHorizontal 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ProjectDependency, ProjectTodo } from '@/types/analysis.types';

/**
 * Компонент для подсветки найденного текста (переиспользуем из FileItem)
 */
const HighlightedText: React.FC<{
  text: string;
  searchTerm?: string;
  className?: string;
}> = ({ text, searchTerm, className = '' }) => {
  if (!searchTerm || !text) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${searchTerm})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 rounded px-1">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

/**
 * Компонент для отображения зависимости между файлами
 */
interface DependencyItemProps {
  dependency: ProjectDependency;
  variant?: 'default' | 'compact' | 'detailed';
  searchTerm?: string;
  onFromClick?: (path: string) => void;
  onToClick?: (path: string) => void;
  className?: string;
}

const DependencyItem: React.FC<DependencyItemProps> = memo(({
  dependency,
  variant = 'default',
  searchTerm,
  onFromClick,
  onToClick,
  className = ''
}) => {
  // Извлекаем имена файлов из путей для более компактного отображения
  const fromFileName = dependency.from.split('/').pop() || dependency.from;
  const toFileName = dependency.to.includes('/') 
    ? dependency.to.split('/').pop() 
    : dependency.to;

  // Определяем тип зависимости и соответствующий цвет
  const getTypeConfig = (type: string) => {
    const configs = {
      'import': { color: 'bg-blue-500', label: 'Import', icon: '📥' },
      'require': { color: 'bg-green-500', label: 'Require', icon: '📦' },
      'include': { color: 'bg-purple-500', label: 'Include', icon: '📋' },
      'extends': { color: 'bg-orange-500', label: 'Extends', icon: '🔗' },
      'implements': { color: 'bg-red-500', label: 'Implements', icon: '⚙️' },
    };
    return configs[type as keyof typeof configs] || { 
      color: 'bg-slate-500', 
      label: type, 
      icon: '📄' 
    };
  };

  const typeConfig = getTypeConfig(dependency.type);

  const baseClasses = [
    'dependency-item group transition-all duration-200',
    'border border-slate-200 dark:border-slate-700',
    'hover:border-slate-300 dark:hover:border-slate-600',
    'hover:shadow-md',
    'bg-white dark:bg-slate-800',
    className
  ].filter(Boolean).join(' ');

  if (variant === 'compact') {
    return (
      <motion.div
        className={`${baseClasses} flex items-center px-3 py-2 rounded-md`}
        whileHover={{ scale: 1.01 }}
      >
        {/* Иконка типа зависимости */}
        <div className={`w-6 h-6 rounded-full ${typeConfig.color} flex items-center justify-center text-white text-xs mr-3`}>
          {typeConfig.icon}
        </div>

        {/* Источник */}
        <button
          onClick={() => onFromClick?.(dependency.from)}
          className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 truncate"
          title={dependency.from}
        >
          <HighlightedText text={fromFileName} searchTerm={searchTerm} />
        </button>

        {/* Стрелка */}
        <ArrowUp className="h-4 w-4 text-slate-400 mx-2" />

        {/* Цель */}
        <button
          onClick={() => onToClick?.(dependency.to)}
          className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 truncate flex-1"
          title={dependency.to}
        >
          <HighlightedText text={toFileName || dependency.to} searchTerm={searchTerm} />
        </button>

        {/* Тип */}
        <Badge variant="outline" className="ml-2 text-xs">
          {typeConfig.label}
        </Badge>
      </motion.div>
    );
  }

  if (variant === 'detailed') {
    return (
      <motion.div
        className={`${baseClasses} p-4 rounded-lg`}
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg ${typeConfig.color} flex items-center justify-center text-white`}>
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Зависимость типа "{typeConfig.label}"
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {dependency.type}
              </div>
            </div>
          </div>
          <Badge variant="secondary">{typeConfig.label}</Badge>
        </div>

        <div className="space-y-3">
          {/* Источник */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Источник:
            </label>
            <button
              onClick={() => onFromClick?.(dependency.from)}
              className="text-sm text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 block w-full text-left truncate"
              title={dependency.from}
            >
              <HighlightedText text={dependency.from} searchTerm={searchTerm} />
            </button>
          </div>

          {/* Стрелка */}
          <div className="flex justify-center">
            <ArrowUp className="h-6 w-6 text-slate-400" />
          </div>

          {/* Цель */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
              Импортирует:
            </label>
            <button
              onClick={() => onToClick?.(dependency.to)}
              className="text-sm text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 block w-full text-left truncate"
              title={dependency.to}
            >
              <HighlightedText text={dependency.to} searchTerm={searchTerm} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Стандартный вариант
  return (
    <motion.div
      className={`${baseClasses} flex items-center px-4 py-3 rounded-lg`}
      whileHover={{ scale: 1.01 }}
    >
      {/* Иконка типа зависимости */}
      <div className={`w-8 h-8 rounded-lg ${typeConfig.color} flex items-center justify-center text-white mr-4`}>
        <GitBranch className="h-4 w-4" />
      </div>

      {/* Основная информация */}
      <div className="flex-1 min-w-0 flex items-center">
        <button
          onClick={() => onFromClick?.(dependency.from)}
          className="font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 truncate"
          title={dependency.from}
        >
          <HighlightedText text={fromFileName} searchTerm={searchTerm} />
        </button>

        <ArrowUp className="h-4 w-4 text-slate-400 mx-3" />

        <button
          onClick={() => onToClick?.(dependency.to)}
          className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 truncate"
          title={dependency.to}
        >
          <HighlightedText text={toFileName || dependency.to} searchTerm={searchTerm} />
        </button>
      </div>

      {/* Тип зависимости */}
      <Badge variant="outline" className="ml-4">
        {typeConfig.label}
      </Badge>
    </motion.div>
  );
});

DependencyItem.displayName = 'DependencyItem';

/**
 * Компонент для отображения TODO/FIXME комментария
 */
interface TodoItemProps {
  todo: ProjectTodo;
  variant?: 'default' | 'compact' | 'detailed' | 'card';
  searchTerm?: string;
  onFileClick?: (path: string, line?: number) => void;
  onCopyContent?: (content: string) => void;
  className?: string;
}

export const TodoItem: React.FC<TodoItemProps> = memo(({
  todo,
  variant = 'default',
  searchTerm,
  onFileClick,
  onCopyContent,
  className = ''
}) => {
  // Конфигурация для разных типов TODO
  const getTypeConfig = (type: string) => {
    const configs = {
      'TODO': { 
        icon: Lightbulb, 
        color: 'text-blue-500 dark:text-blue-400', 
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        label: 'К выполнению',
        priority: 'medium'
      },
      'FIXME': { 
        icon: AlertCircle, 
        color: 'text-red-500 dark:text-red-400', 
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        label: 'Требует исправления',
        priority: 'high'
      },
      'HACK': { 
        icon: Wrench, 
        color: 'text-orange-500 dark:text-orange-400', 
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        label: 'Временное решение',
        priority: 'medium'
      },
      'NOTE': { 
        icon: Calendar, 
        color: 'text-green-500 dark:text-green-400', 
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        label: 'Заметка',
        priority: 'low'
      }
    };
    return configs[type as keyof typeof configs] || configs.TODO;
  };

  const typeConfig = getTypeConfig(todo.type);
  const IconComponent = typeConfig.icon;
  const fileName = todo.file_path.split('/').pop() || todo.file_path;

  // Меню действий для TODO
  const TodoActionsMenu: React.FC = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`Действия для ${todo.type}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onFileClick?.(todo.file_path, todo.line)}>
          <MapPin className="mr-2 h-4 w-4" />
          Перейти к строке
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onCopyContent?.(todo.content)}>
          <Copy className="mr-2 h-4 w-4" />
          Копировать текст
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(`vscode://file/${todo.file_path}:${todo.line}`, '_blank')}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Открыть в редакторе
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const baseClasses = [
    'todo-item group transition-all duration-200',
    'border',
    typeConfig.borderColor,
    typeConfig.bgColor,
    'hover:shadow-md',
    className
  ].filter(Boolean).join(' ');

  if (variant === 'compact') {
    return (
      <motion.div
        className={`${baseClasses} flex items-center px-3 py-2 rounded-md`}
        whileHover={{ scale: 1.01 }}
      >
        <IconComponent className={`h-4 w-4 ${typeConfig.color} mr-3 flex-shrink-0`} />
        
        <div className="flex-1 min-w-0">
          <HighlightedText
            text={todo.content}
            searchTerm={searchTerm}
            className="text-sm text-slate-900 dark:text-slate-100 truncate"
          />
        </div>

        <div className="flex items-center space-x-2 ml-3">
          <Badge 
            variant={todo.type === 'FIXME' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {todo.type}
          </Badge>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            :{todo.line}
          </span>
        </div>
      </motion.div>
    );
  }

  if (variant === 'card') {
    return (
      <motion.div
        className={`${baseClasses} p-4 rounded-lg`}
        whileHover={{ y: -2, shadow: '0 10px 25px rgba(0,0,0,0.1)' }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <IconComponent className={`h-6 w-6 ${typeConfig.color}`} />
            <div>
              <Badge 
                variant={todo.type === 'FIXME' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {todo.type}
              </Badge>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {typeConfig.label}
              </div>
            </div>
          </div>
          <TodoActionsMenu />
        </div>

        <HighlightedText
          text={todo.content}
          searchTerm={searchTerm}
          className="text-sm text-slate-800 dark:text-slate-200 mb-3 leading-relaxed"
        />

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <button
            onClick={() => onFileClick?.(todo.file_path, todo.line)}
            className="hover:text-blue-600 dark:hover:text-blue-400 truncate"
            title={todo.file_path}
          >
            {fileName}
          </button>
          <span>строка {todo.line}</span>
        </div>
      </motion.div>
    );
  }

  if (variant === 'detailed') {
    return (
      <motion.div
        className={`${baseClasses} p-4 rounded-lg`}
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <IconComponent className={`h-8 w-8 ${typeConfig.color}`} />
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Badge 
                  variant={todo.type === 'FIXME' ? 'destructive' : 'secondary'}
                >
                  {todo.type}
                </Badge>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {typeConfig.label}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Приоритет: {typeConfig.priority === 'high' ? 'Высокий' : 
                           typeConfig.priority === 'medium' ? 'Средний' : 'Низкий'}
              </div>
            </div>
          </div>
          <TodoActionsMenu />
        </div>

        <div className="mb-4">
          <HighlightedText
            text={todo.content}
            searchTerm={searchTerm}
            className="text-slate-800 dark:text-slate-200 leading-relaxed"
          />
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Файл:</span>
              <button
                onClick={() => onFileClick?.(todo.file_path, todo.line)}
                className="ml-2 text-blue-600 dark:text-blue-400 hover:underline truncate"
                title={todo.file_path}
              >
                {fileName}
              </button>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Строка:</span>
              <span className="ml-2 font-mono text-slate-800 dark:text-slate-200">
                {todo.line}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Стандартный вариант
  return (
    <motion.div
      className={`${baseClasses} flex items-start px-4 py-3 rounded-lg`}
      whileHover={{ scale: 1.01 }}
    >
      <IconComponent className={`h-5 w-5 ${typeConfig.color} mr-4 mt-0.5 flex-shrink-0`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <Badge 
            variant={todo.type === 'FIXME' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {todo.type}
          </Badge>
          <TodoActionsMenu />
        </div>

        <HighlightedText
          text={todo.content}
          searchTerm={searchTerm}
          className="text-sm text-slate-800 dark:text-slate-200 mb-2 leading-relaxed"
        />

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <button
            onClick={() => onFileClick?.(todo.file_path, todo.line)}
            className="hover:text-blue-600 dark:hover:text-blue-400 truncate"
            title={todo.file_path}
          >
            {fileName}
          </button>
          <span>строка {todo.line}</span>
        </div>
      </div>
    </motion.div>
  );
});

TodoItem.displayName = 'TodoItem';
