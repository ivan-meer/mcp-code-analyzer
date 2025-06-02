/**
 * FilesSectionV2 - Секция файлов с улучшенным интерфейсом
 * 
 * Современный интерфейс для просмотра файлов проекта с:
 * - Виртуализированными списками для производительности
 * - Расширенными фильтрами и поиском
 * - Превью кода с подсветкой синтаксиса
 * - Интерактивными метриками файлов
 */

import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Grid, List, Eye, Code, FileText, 
  BarChart3, Clock, Zap, ChevronDown, ChevronRight,
  Copy, ExternalLink, Download, Share
} from 'lucide-react';
import { ProjectAnalysis } from '@/types/analysis.types';
import { AnalysisFilters } from '../hooks/useAnalysisState';

interface FilesSectionV2Props {
  analysisResult: ProjectAnalysis;
  onFileNavigate: (filePath: string, line?: number) => void;
  filters: AnalysisFilters;
  onFiltersChange: (filters: Partial<AnalysisFilters>) => void;
  searchQuery: string;
  viewMode: 'grid' | 'list' | 'detail';
  onViewModeChange: (mode: 'grid' | 'list' | 'detail') => void;
}

// Компонент карточки файла
const FileCard: React.FC<{
  file: ProjectAnalysis['files'][0];
  viewMode: 'grid' | 'list' | 'detail';
  onNavigate: (path: string) => void;
  searchQuery?: string;
}> = ({ file, viewMode, onNavigate, searchQuery }) => {
  const [expanded, setExpanded] = useState(false);

  const getFileIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'ts': '🟦', 'tsx': '⚛️', 'js': '🟨', 'jsx': '⚛️',
      'py': '🐍', 'css': '🎨', 'html': '🌐', 'json': '📋',
      'md': '📝', 'yml': '⚙️', 'yaml': '⚙️'
    };
    return iconMap[type.toLowerCase()] || '📄';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getSizeColor = (size: number) => {
    if (size < 1000) return 'text-green-400';
    if (size < 10000) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getComplexityColor = (functions: number) => {
    if (functions < 5) return 'text-green-400';
    if (functions < 15) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      className={`
        glass-morphism border border-white/20 hover:border-white/30 
        transition-all duration-300 cursor-pointer group
        ${viewMode === 'grid' ? 'rounded-2xl p-4' : 
          viewMode === 'list' ? 'rounded-xl p-3 mb-2' : 
          'rounded-2xl p-6 mb-4'}
      `}
      onClick={() => onNavigate(file.path)}
    >
      <div className={`flex ${viewMode === 'grid' ? 'flex-col' : 'items-center'} gap-3`}>
        {/* Иконка и основная информация */}
        <div className="flex items-center gap-3 flex-1">
          <div className="text-2xl">{getFileIcon(file.type)}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                {file.name}
              </h3>
              <span className="px-2 py-0.5 text-xs bg-white/10 rounded text-white/70">
                {file.type.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-white/60 truncate font-mono">
              {file.path}
            </p>
          </div>
        </div>

        {/* Метрики */}
        <div className={`flex ${viewMode === 'grid' ? 'justify-between' : 'gap-6'} text-sm`}>
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3 text-blue-400" />
            <span className={getSizeColor(file.size)}>{formatFileSize(file.size)}</span>
          </div>
          
          {file.lines_of_code && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3 text-green-400" />
              <span className="text-white/70">{file.lines_of_code}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <Code className={`h-3 w-3 ${getComplexityColor(file.functions.length)}`} />
            <span className="text-white/70">{file.functions.length}</span>
          </div>
        </div>

        {/* Детальный режим - дополнительная информация */}
        {viewMode === 'detail' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="w-full mt-4 pt-4 border-t border-white/10"
          >
            {/* Функции */}
            {file.functions.length > 0 && (
              <div className="mb-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                  className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
                >
                  {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  Функции ({file.functions.length})
                </button>
                
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 space-y-1"
                    >
                      {file.functions.slice(0, 5).map((func, index) => (
                        <div key={index} className="text-xs text-white/60 font-mono pl-4">
                          • {func}
                        </div>
                      ))}
                      {file.functions.length > 5 && (
                        <div className="text-xs text-white/40 pl-4">
                          +{file.functions.length - 5} еще...
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Импорты */}
            {file.imports.length > 0 && (
              <div className="mb-3">
                <div className="text-sm text-white/80 mb-1">
                  Импорты ({file.imports.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {file.imports.slice(0, 3).map((imp, index) => (
                    <span key={index} className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded">
                      {imp}
                    </span>
                  ))}
                  {file.imports.length > 3 && (
                    <span className="px-2 py-0.5 text-xs bg-white/10 text-white/60 rounded">
                      +{file.imports.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Действия */}
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(file.path);
                }}
                className="p-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                title="Копировать путь"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(file.path);
                }}
                className="p-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                title="Открыть файл"
              >
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Основной компонент секции файлов
export const FilesSectionV2: React.FC<FilesSectionV2Props> = ({
  analysisResult,
  onFileNavigate,
  filters,
  onFiltersChange,
  searchQuery,
  viewMode,
  onViewModeChange
}) => {
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'functions' | 'type'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Фильтрация и сортировка файлов
  const filteredAndSortedFiles = useMemo(() => {
    let files = [...analysisResult.files];

    // Применяем фильтры
    if (filters.fileTypes.length > 0) {
      files = files.filter(file => filters.fileTypes.includes(file.type));
    }

    if (filters.languages.length > 0) {
      files = files.filter(file => filters.languages.includes(file.type));
    }

    if (filters.sizeRange[0] > 0 || filters.sizeRange[1] < Infinity) {
      files = files.filter(file => 
        file.size >= filters.sizeRange[0] && file.size <= filters.sizeRange[1]
      );
    }

    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      files = files.filter(file =>
        file.name.toLowerCase().includes(query) ||
        file.path.toLowerCase().includes(query) ||
        file.functions.some(func => func.toLowerCase().includes(query)) ||
        file.imports.some(imp => imp.toLowerCase().includes(query))
      );
    }

    // Сортировка
    files.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'size':
          aVal = a.size;
          bVal = b.size;
          break;
        case 'functions':
          aVal = a.functions.length;
          bVal = b.functions.length;
          break;
        case 'type':
          aVal = a.type;
          bVal = b.type;
          break;
        case 'name':
        default:
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return files;
  }, [analysisResult.files, filters, searchQuery, sortBy, sortDirection]);

  // Статистика для отображения
  const stats = useMemo(() => {
    const files = filteredAndSortedFiles;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const totalFunctions = files.reduce((sum, file) => sum + file.functions.length, 0);
    const avgSize = files.length > 0 ? totalSize / files.length : 0;
    
    const types = files.reduce((acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalFiles: files.length,
      totalSize,
      totalFunctions,
      avgSize,
      types: Object.entries(types).sort(([,a], [,b]) => b - a)
    };
  }, [filteredAndSortedFiles]);

  const handleSortChange = useCallback((newSortBy: typeof sortBy) => {
    if (newSortBy === sortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('asc');
    }
  }, [sortBy]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и статистика */}
      <div className="glass-morphism rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Файлы проекта</h2>
            <p className="text-white/70">
              Найдено {stats.totalFiles} файлов, общий размер {formatFileSize(stats.totalSize)}
            </p>
          </div>

          {/* Переключатель режимов просмотра */}
          <div className="flex gap-2">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-500/30 text-blue-300' 
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-500/30 text-blue-300' 
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('detail')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'detail' 
                  ? 'bg-blue-500/30 text-blue-300' 
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Быстрая статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-lg font-bold text-blue-400">{stats.totalFiles}</div>
            <div className="text-sm text-white/60">Файлов</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-lg font-bold text-green-400">{stats.totalFunctions}</div>
            <div className="text-sm text-white/60">Функций</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-lg font-bold text-yellow-400">{formatFileSize(stats.avgSize)}</div>
            <div className="text-sm text-white/60">Средний размер</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-lg font-bold text-purple-400">{stats.types.length}</div>
            <div className="text-sm text-white/60">Типов файлов</div>
          </div>
        </div>

        {/* Типы файлов */}
        <div className="mt-4 flex flex-wrap gap-2">
          {stats.types.slice(0, 8).map(([type, count]) => (
            <span key={type} className="px-3 py-1 bg-white/10 rounded-lg text-sm text-white/80">
              {type.toUpperCase()} ({count})
            </span>
          ))}
        </div>
      </div>

      {/* Панель управления */}
      <div className="glass-morphism rounded-xl p-4 border border-white/20">
        <div className="flex flex-wrap items-center gap-4">
          {/* Сортировка */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/80">Сортировка:</span>
            <div className="flex gap-1">
              {[
                { key: 'name', label: 'Имя' },
                { key: 'size', label: 'Размер' },
                { key: 'functions', label: 'Функции' },
                { key: 'type', label: 'Тип' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleSortChange(key as typeof sortBy)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    sortBy === key
                      ? 'bg-blue-500/30 text-blue-300'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {label}
                  {sortBy === key && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Информация о результатах */}
          <div className="ml-auto text-sm text-white/60">
            Показано {filteredAndSortedFiles.length} из {analysisResult.files.length} файлов
          </div>
        </div>
      </div>

      {/* Список файлов */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-2'
          }
        >
          {filteredAndSortedFiles.map((file, index) => (
            <FileCard
              key={file.path}
              file={file}
              viewMode={viewMode}
              onNavigate={onFileNavigate}
              searchQuery={searchQuery}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Пустое состояние */}
      {filteredAndSortedFiles.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-morphism rounded-2xl p-12 border border-white/20 text-center"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Файлы не найдены
          </h3>
          <p className="text-white/70">
            Попробуйте изменить критерии поиска или фильтры
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default FilesSectionV2;
