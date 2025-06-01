/**
 * Секция для работы с файлами проекта
 * 
 * Этот компонент объединяет поиск, фильтрацию и отображение файлов
 * в единый, мощный интерфейс. Он работает как "файловый менеджер"
 * для результатов анализа проекта.
 * 
 * Особенности:
 * 1. Интеллектуальная фильтрация по типам, размерам и содержимому
 * 2. Быстрый поиск с подсветкой результатов
 * 3. Виртуализация для работы с большими проектами
 * 4. Множественные режимы отображения
 * 5. Сортировка и группировка
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid, List, Download, Filter, SortAsc, SortDesc, 
  Eye, BarChart3, Folder, FolderOpen 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

import { ProjectFile, FilterState, SortConfig } from '@/types/analysis.types';
import { useFileFiltering } from '@/hooks/useFiltering';
import { SearchFilter } from '@/components/shared/SearchFilter';
import { VirtualList } from '@/components/shared/VirtualList';
import { FileItem } from '@/components/shared/FileItem';
import { getPopularFileTypes, groupFilesByType } from '@/utils/file-icons.utils';
import { exportAnalysisData, createDefaultExportOptions } from '@/utils/export.utils';

interface FilesSectionProps {
  files: ProjectFile[];
  projectPath: string;
  onFileSelect?: (file: ProjectFile) => void;
  onFileView?: (file: ProjectFile) => void;
  onFileNavigate: (filePath: string, line?: number) => void;
  className?: string;
}

/**
 * Компонент статистики файлов
 */
const FilesStatistics: React.FC<{ files: ProjectFile[] }> = ({ files }) => {
  const stats = useMemo(() => {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const totalLines = files.reduce((sum, file) => sum + (file.lines_of_code || 0), 0);
    const totalFunctions = files.reduce((sum, file) => sum + file.functions.length, 0);
    const fileTypes = groupFilesByType(files);
    const popularTypes = getPopularFileTypes(files).slice(0, 5);

    return {
      totalSize,
      totalLines,
      totalFunctions,
      averageSize: totalSize / files.length,
      averageLines: totalLines / files.length,
      fileTypes,
      popularTypes
    };
  }, [files]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {files.length}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Файлов</div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
          {stats.totalLines.toLocaleString()}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Строк кода</div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {stats.totalFunctions}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Функций</div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
          {(stats.totalSize / 1024 / 1024).toFixed(1)}MB
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Общий размер</div>
      </div>
    </div>
  );
};

/**
 * Компонент группировки файлов по директориям
 */
const DirectoryTree: React.FC<{
  files: ProjectFile[];
  onFileSelect?: (file: ProjectFile) => void;
  onFileNavigate: (filePath: string, line?: number) => void;
  searchTerm?: string;
}> = ({ files, onFileSelect, onFileNavigate, searchTerm }) => {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  // Группируем файлы по директориям
  const directoryTree = useMemo(() => {
    const tree: { [key: string]: ProjectFile[] } = {};
    
    files.forEach(file => {
      const dir = file.path.substring(0, file.path.lastIndexOf('/')) || '/';
      if (!tree[dir]) tree[dir] = [];
      tree[dir].push(file);
    });

    return Object.entries(tree).sort(([a], [b]) => a.localeCompare(b));
  }, [files]);

  const toggleDirectory = useCallback((dir: string) => {
    setExpandedDirs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dir)) {
        newSet.delete(dir);
      } else {
        newSet.add(dir);
      }
      return newSet;
    });
  }, []);

  return (
    <div className="space-y-2">
      {directoryTree.map(([dir, dirFiles]) => {
        const isExpanded = expandedDirs.has(dir);
        const displayDir = dir === '/' ? 'Корневая директория' : dir;

        return (
          <div key={dir} className="border border-slate-200 dark:border-slate-700 rounded-lg">
            <button
              onClick={() => toggleDirectory(dir)}
              className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-lg"
            >
              <div className="flex items-center space-x-2">
                {isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-blue-500" />
                ) : (
                  <Folder className="h-4 w-4 text-slate-500" />
                )}
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {displayDir}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {dirFiles.length}
                </Badge>
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-2 space-y-1">
                    {dirFiles.map(file => (
<FileItem
  key={file.path}
  file={file}
  variant="compact"
  showPath={false}
  searchTerm={searchTerm}
  onSelect={onFileSelect}
  onNavigate={onFileNavigate}
  className="border-0 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700"
/>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Основной компонент FilesSection
 */
export const FilesSection: React.FC<FilesSectionProps> = ({
  files,
  projectPath,
  onFileSelect,
  onFileView,
  onFileNavigate,
  className = ''
}) => {
  // Состояние компонента
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'tree'>('list');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'name',
    direction: 'asc'
  });
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Используем хук фильтрации
  const {
    filteredFiles,
    filters,
    search,
    updateFilters,
    quickSearch,
    resetFilters,
    availableFileTypes,
    stats
  } = useFileFiltering(files);

  // Подготавливаем опции для фильтрации
  const filterGroups = useMemo(() => [
    {
      id: 'fileTypes',
      label: 'Типы файлов',
      options: availableFileTypes.map(type => ({
        id: type,
        label: type.toUpperCase(),
        count: files.filter(f => f.type === type).length
      })),
      multiSelect: true
    },
    {
      id: 'hasComments',
      label: 'С комментариями',
      options: [
        { id: 'true', label: 'Только с комментариями' }
      ],
      type: 'toggle' as const
    }
  ], [availableFileTypes, files]);

  // Сортировка файлов
  const sortedFiles = useMemo(() => {
    const sorted = [...filteredFiles].sort((a, b) => {
      let aValue: any = a[sortConfig.field as keyof ProjectFile];
      let bValue: any = b[sortConfig.field as keyof ProjectFile];

      // Специальная обработка для массивов
      if (Array.isArray(aValue)) aValue = aValue.length;
      if (Array.isArray(bValue)) bValue = bValue.length;

      // Обработка undefined значений
      if (aValue === undefined) aValue = 0;
      if (bValue === undefined) bValue = 0;

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [filteredFiles, sortConfig]);

  // Обработчики событий
  const handleFileSelect = useCallback((file: ProjectFile) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(file.path)) {
        newSet.delete(file.path);
      } else {
        newSet.add(file.path);
      }
      return newSet;
    });
    onFileSelect?.(file);
  }, [onFileSelect]);

  const handleExport = useCallback(() => {
    const exportData = {
      project_path: projectPath,
      files: filteredFiles,
      metrics: {
        total_files: filteredFiles.length,
        total_lines: filteredFiles.reduce((sum, f) => sum + (f.lines_of_code || 0), 0),
        total_functions: filteredFiles.reduce((sum, f) => sum + f.functions.length, 0),
        avg_lines_per_file: filteredFiles.reduce((sum, f) => sum + (f.lines_of_code || 0), 0) / filteredFiles.length,
        languages: Array.from(new Set(filteredFiles.map(f => f.type)))
      },
      dependencies: [],
      architecture_patterns: []
    };

    exportAnalysisData(exportData, createDefaultExportOptions('csv'));
  }, [filteredFiles, projectPath]);

  const renderFileItem = useCallback((file: ProjectFile, index: number) => (
    <FileItem
      file={file}
      variant={viewMode === 'grid' ? 'card' : 'default'}
      searchTerm={search.query}
      isSelected={selectedFiles.has(file.path)}
      onSelect={handleFileSelect}
      onView={onFileView}
      onCopyPath={(path) => navigator.clipboard.writeText(path)}
    />
  ), [viewMode, search.query, selectedFiles, handleFileSelect, onFileView]);

  return (
    <Card className={`files-section ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Файлы проекта
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {/* Сортировка */}
            <Select
              value={`${sortConfig.field}-${sortConfig.direction}`}
              onValueChange={(value) => {
                const [field, direction] = value.split('-');
                setSortConfig({ 
                  field: field as keyof ProjectFile, 
                  direction: direction as 'asc' | 'desc' 
                });
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Имя (А-Я)</SelectItem>
                <SelectItem value="name-desc">Имя (Я-А)</SelectItem>
                <SelectItem value="size-asc">Размер (↑)</SelectItem>
                <SelectItem value="size-desc">Размер (↓)</SelectItem>
                <SelectItem value="lines_of_code-desc">Строки кода (↓)</SelectItem>
                <SelectItem value="type-asc">Тип (А-Я)</SelectItem>
              </SelectContent>
            </Select>

            {/* Режимы отображения */}
            <div className="flex border border-slate-200 dark:border-slate-700 rounded-md">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none border-x border-slate-200 dark:border-slate-700"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'tree' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('tree')}
                className="rounded-l-none"
              >
                <Folder className="h-4 w-4" />
              </Button>
            </div>

            {/* Экспорт */}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>

        {/* Статистика */}
        <FilesStatistics files={sortedFiles} />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Поиск и фильтры */}
        <SearchFilter
          searchPlaceholder="Поиск файлов по имени, пути или содержимому..."
          searchValue={search.query}
          onSearchChange={quickSearch}
          filterGroups={filterGroups}
          activeFilters={filters as unknown as { [groupId: string]: string[] }}
          onFilterChange={(groupId, values) => updateFilters({ [groupId]: values })}
          totalItems={files.length}
          filteredItems={stats.filteredItems}
          onClearAll={resetFilters}
          variant="minimal"
        />

        {/* Контент в зависимости от режима отображения */}
        <div className="files-content">
          {viewMode === 'tree' ? (
<DirectoryTree
  files={sortedFiles}
  onFileSelect={handleFileSelect}
  onFileNavigate={onFileNavigate}
  searchTerm={search.query}
/>
          ) : (
<VirtualList
  items={sortedFiles}
  renderItem={renderFileItem}
  height={600}
  itemHeight={viewMode === 'grid' ? 200 : 80}
  className={viewMode === 'grid' ? 'grid-mode' : 'list-mode'}
  emptyMessage="Файлы не найдены. Попробуйте изменить критерии поиска."
  showScrollIndicator={sortedFiles.length > 100}
  animateItems={sortedFiles.length < 50}
  ariaLabel="Список файлов проекта"
/>
          )}
        </div>

        {/* Информация о выборе */}
        {selectedFiles.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Выбрано файлов: {selectedFiles.size}
            </span>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setSelectedFiles(new Set())}
              >
                Очистить выбор
              </Button>
              <Button size="sm">
                Действия с выбранными
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default FilesSection;
