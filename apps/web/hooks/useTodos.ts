/**
 * Кастомный хук для работы со статистикой TODO
 */

import { useMemo } from 'react';
import { ProjectTodo, TodoStats } from '@/types/todos.types';
import { TODO_TYPES } from '@/config/todos.config';

export const useTodoStatistics = (todos: ProjectTodo[]): TodoStats => {
  return useMemo(() => {
    const byType = todos.reduce((acc, todo) => {
      acc[todo.type] = (acc[todo.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byFile = todos.reduce((acc, todo) => {
      const fileName = todo.file_path.split('/').pop() || todo.file_path;
      acc[fileName] = (acc[fileName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalCritical = byType.FIXME || 0;
    const totalTasks = byType.TODO || 0;
    const totalHacks = byType.HACK || 0;
    const totalNotes = byType.NOTE || 0;

    // Расчет "индекса технического долга"
    const debtIndex = todos.length > 0 
      ? (totalCritical * 3 + totalTasks * 2 + totalHacks * 1) / todos.length
      : 0;

    const mostProblematicFiles = Object.entries(byFile)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      byType,
      byFile,
      totalCritical,
      totalTasks,
      totalHacks,
      totalNotes,
      debtIndex,
      mostProblematicFiles
    };
  }, [todos]);
};

/**
 * Хук для группировки TODO по файлам
 */
export const useTodoFileGroups = (todos: ProjectTodo[]) => {
  return useMemo(() => {
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
};

/**
 * Хук для приоритизации TODO
 */
export const usePrioritizedTodos = (todos: ProjectTodo[]) => {
  return useMemo(() => {
    return [...todos].sort((a, b) => {
      const aPriority = TODO_TYPES[a.type]?.priority || 999;
      const bPriority = TODO_TYPES[b.type]?.priority || 999;
      return aPriority - bPriority;
    });
  }, [todos]);
};

/**
 * Хук для экспорта TODO в различные форматы
 */
export const useTodoExport = () => {
  const exportToCSV = (todos: ProjectTodo[], projectPath: string) => {
    const exportData = todos.map(todo => ({
      title: `[${todo.type}] ${todo.content.substring(0, 50)}${todo.content.length > 50 ? '...' : ''}`,
      description: todo.content,
      file: todo.file_path,
      line: todo.line,
      type: todo.type,
      priority: TODO_TYPES[todo.type]?.label || 'Normal'
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
  };

  const exportToJSON = (todos: ProjectTodo[], projectPath: string) => {
    const exportData = {
      project: projectPath,
      exportedAt: new Date().toISOString(),
      todos: todos.map(todo => ({
        ...todo,
        priority: TODO_TYPES[todo.type]?.priority || 999,
        label: TODO_TYPES[todo.type]?.label || 'Unknown'
      }))
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectPath.split('/').pop()}-todos.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    exportToCSV,
    exportToJSON
  };
};
