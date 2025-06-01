/**
 * Конфигурация типов TODO с их параметрами отображения
 */

import { 
  AlertCircle, 
  Lightbulb, 
  Wrench, 
  Calendar 
} from 'lucide-react';
import { TodoTypeConfig } from '@/types/todos.types';

export const TODO_TYPES: Record<string, TodoTypeConfig> = {
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
 * Цветовые темы для различных состояний TODO
 */
export const TODO_THEMES = {
  priority: {
    high: 'border-red-200 bg-red-50 dark:bg-red-900/20',
    medium: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20',
    low: 'border-green-200 bg-green-50 dark:bg-green-900/20'
  },
  status: {
    new: 'border-blue-200 bg-blue-50 dark:bg-blue-900/20',
    inProgress: 'border-orange-200 bg-orange-50 dark:bg-orange-900/20',
    completed: 'border-green-200 bg-green-50 dark:bg-green-900/20'
  }
} as const;

/**
 * Настройки для различных режимов отображения
 */
export const VIEW_CONFIGS = {
  list: {
    itemHeight: 120,
    showDetails: true,
    enableVirtualization: true
  },
  compact: {
    itemHeight: 80,
    showDetails: false,
    enableVirtualization: true
  },
  detailed: {
    itemHeight: 160,
    showDetails: true,
    enableVirtualization: false
  }
} as const;

/**
 * Настройки экспорта TODO в различные форматы
 */
export const EXPORT_FORMATS = {
  csv: {
    headers: ['Title', 'Description', 'File', 'Line', 'Type', 'Priority'],
    delimiter: ',',
    extension: '.csv'
  },
  json: {
    pretty: true,
    extension: '.json'
  },
  markdown: {
    template: '## {type}: {title}\n\n**File:** {file}:{line}\n**Description:** {description}\n\n',
    extension: '.md'
  }
} as const;
