/**
 * Типы и интерфейсы для работы с TODO комментариями
 */

export interface ProjectTodo {
  file_path: string;
  line: number;
  type: 'TODO' | 'FIXME' | 'HACK' | 'NOTE';
  content: string;
  author?: string;
  created_at?: string;
}

export interface TodoTypeConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  priority: number;
  label: string;
  description: string;
}

export interface TodoStats {
  byType: Record<string, number>;
  byFile: Record<string, number>;
  totalCritical: number;
  totalTasks: number;
  totalHacks: number;
  totalNotes: number;
  debtIndex: number;
  mostProblematicFiles: Array<[string, number]>;
}

export interface TodoFilters {
  todoTypes: string[];
  files: string[];
  authors: string[];
}

export interface TodoSearchState {
  query: string;
  filters: TodoFilters;
  sortBy: 'priority' | 'file' | 'type' | 'date';
  sortOrder: 'asc' | 'desc';
}

export interface FileGroup {
  fullPath: string;
  todos: ProjectTodo[];
  criticalCount: number;
  totalCount: number;
}

export type TodoVariant = 'default' | 'compact' | 'detailed';
export type TodoViewMode = 'list' | 'priority' | 'files' | 'analytics';
