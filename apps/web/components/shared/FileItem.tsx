/**
 * Компонент для отображения элемента файла в списке
 * 
 * Этот компонент представляет единообразный способ отображения информации
 * о файле во всех частях приложения. Он работает как "визитная карточка"
 * файла, показывая всю ключевую информацию в компактном и читаемом виде.
 * 
 * Особенности:
 * 1. Адаптивный дизайн - хорошо выглядит на всех размерах экрана
 * 2. Интерактивность - hover эффекты и возможность клика
 * 3. Доступность - правильные ARIA метки и клавиатурная навигация
 * 4. Настраиваемость - различные варианты отображения
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, ExternalLink, Copy, Eye, Code } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ProjectFile } from '@/types/analysis.types';
import { getFileIcon, getFileIconColor, getFileTypeDescription } from '@/utils/file-icons.utils';

interface FileItemProps {
  file: ProjectFile;
  variant?: 'default' | 'compact' | 'detailed' | 'card';
  showPath?: boolean;
  showMetrics?: boolean;
  showActions?: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
  searchTerm?: string;
  onSelect?: (file: ProjectFile) => void;
  onView?: (file: ProjectFile) => void;
  onNavigate?: (filePath: string, line?: number) => void;
  onCopyPath?: (path: string) => void;
  className?: string;
}

/**
 * Компонент для подсветки найденного текста
 * 
 * Выделяет части текста, которые соответствуют поисковому запросу.
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
 * Компонент метрик файла
 * 
 * Отображает статистическую информацию о файле в компактном виде.
 */
const FileMetrics: React.FC<{
  file: ProjectFile;
  variant: 'inline' | 'stacked';
  className?: string;
}> = memo(({ file, variant, className = '' }) => {
  const metrics = [
    {
      label: 'Строк',
      value: file.lines_of_code?.toLocaleString() || '0',
      visible: file.lines_of_code !== undefined
    },
    {
      label: 'Функций',
      value: file.functions.length.toString(),
      visible: file.functions.length > 0
    },
    {
      label: 'Размер',
      value: file.size > 1024 
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${file.size} B`,
      visible: true
    }
  ].filter(metric => metric.visible);

  if (variant === 'inline') {
    return (
      <div className={`flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 ${className}`}>
        {metrics.map((metric, index) => (
          <span key={metric.label}>
            <span className="font-medium">{metric.value}</span> {metric.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-3 gap-2 text-xs ${className}`}>
      {metrics.map(metric => (
        <div key={metric.label} className="text-center">
          <div className="font-medium text-slate-800 dark:text-slate-200">
            {metric.value}
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            {metric.label}
          </div>
        </div>
      ))}
    </div>
  );
});

FileMetrics.displayName = 'FileMetrics';

/**
 * Компонент меню действий для файла
 */
const FileActionsMenu: React.FC<{
  file: ProjectFile;
  onView?: (file: ProjectFile) => void;
  onCopyPath?: (path: string) => void;
}> = ({ file, onView, onCopyPath }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Действия для файла ${file.name}`}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48">
      {onView && (
        <DropdownMenuItem onClick={() => onView(file)}>
          <Eye className="mr-2 h-4 w-4" />
          Просмотреть файл
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={() => onCopyPath?.(file.path)}>
        <Copy className="mr-2 h-4 w-4" />
        Копировать путь
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => window.open(`vscode://file/${file.path}`, '_blank')}>
        <Code className="mr-2 h-4 w-4" />
        Открыть в VS Code
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => window.open(`file://${file.path}`, '_blank')}>
        <ExternalLink className="mr-2 h-4 w-4" />
        Открыть в системе
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

/**
 * Основной компонент FileItem
 */
export const FileItem: React.FC<FileItemProps> = memo(({
  file,
  variant = 'default',
  showPath = true,
  showMetrics = true,
  showActions = true,
  isSelected = false,
  isHighlighted = false,
  searchTerm,
  onSelect,
  onView,
  onCopyPath,
  className = ''
}) => {
  const iconColor = getFileIconColor(file.type, file.name);
  const icon = getFileIcon(file.type, file.name);
  const typeDescription = getFileTypeDescription(file.type, file.name);

  // Обработчик клика
  const handleClick = () => {
    onSelect?.(file);
  };

  // Базовые классы для всех вариантов
  const baseClasses = [
    'file-item group relative transition-all duration-200',
    'border border-slate-200 dark:border-slate-700',
    'hover:border-slate-300 dark:hover:border-slate-600',
    'hover:shadow-md',
    isSelected && 'ring-2 ring-blue-500 ring-opacity-50 border-blue-300',
    isHighlighted && 'bg-yellow-50 dark:bg-yellow-900/20',
    onSelect && 'cursor-pointer',
    className
  ].filter(Boolean).join(' ');

  // Компактный вариант для плотных списков
  if (variant === 'compact') {
    return (
      <motion.div
        className={`${baseClasses} flex items-center px-3 py-2 rounded-md bg-white dark:bg-slate-800`}
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Иконка файла */}
        <div 
          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 mr-3"
          style={{ backgroundColor: iconColor }}
          title={typeDescription}
        >
          {icon}
        </div>

        {/* Основная информация */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
<HighlightedText
  text={file.name}
  searchTerm={searchTerm}
  className="font-medium text-slate-900 dark:text-slate-100 truncate"
/>
            <Badge variant="secondary" className="ml-2 text-xs">
              {file.type}
            </Badge>
          </div>
          {showPath && (
<HighlightedText
  text={file.path}
  searchTerm={searchTerm}
  className="text-xs text-slate-500 dark:text-slate-400 truncate"
/>
          )}
        </div>

        {/* Метрики */}
        {showMetrics && (
          <FileMetrics file={file} variant="inline" className="ml-4" />
        )}

        {/* Действия */}
        {showActions && (
          <div className="ml-2">
            <FileActionsMenu file={file} onView={onView} onCopyPath={onCopyPath} />
          </div>
        )}
      </motion.div>
    );
  }

  // Карточный вариант для галерей
  if (variant === 'card') {
    return (
      <motion.div
        className={`${baseClasses} p-4 rounded-lg bg-white dark:bg-slate-800`}
        onClick={handleClick}
        whileHover={{ y: -2, shadow: '0 10px 25px rgba(0,0,0,0.1)' }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Заголовок карточки */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: iconColor }}
              title={typeDescription}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <HighlightedText
                text={file.name}
                searchTerm={searchTerm}
                className="font-semibold text-slate-900 dark:text-slate-100 block truncate"
              />
              <Badge variant="outline" className="mt-1 text-xs">
                {file.type.toUpperCase()}
              </Badge>
            </div>
          </div>
          {showActions && (
            <FileActionsMenu file={file} onView={onView} onCopyPath={onCopyPath} />
          )}
        </div>

        {/* Путь к файлу */}
        {showPath && (
<HighlightedText
  text={file.path}
  searchTerm={searchTerm}
  className="text-sm text-slate-600 dark:text-slate-400 mb-3 block truncate"
/>
        )}

        {/* Метрики */}
        {showMetrics && (
          <FileMetrics file={file} variant="stacked" className="mb-3" />
        )}

        {/* Дополнительная информация */}
        {file.functions.length > 0 && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Функции: {file.functions.slice(0, 3).join(', ')}
              {file.functions.length > 3 && ` и еще ${file.functions.length - 3}...`}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // Подробный вариант с максимальной информацией
  if (variant === 'detailed') {
    return (
      <motion.div
        className={`${baseClasses} p-4 rounded-lg bg-white dark:bg-slate-800`}
        onClick={handleClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-start space-x-4">
          {/* Иконка файла */}
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: iconColor }}
            title={typeDescription}
          >
            {icon}
          </div>

          {/* Основная информация */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <HighlightedText
                text={file.name}
                searchTerm={searchTerm}
                className="text-lg font-semibold text-slate-900 dark:text-slate-100"
              />
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {file.type.toUpperCase()}
                </Badge>
                {showActions && (
                  <FileActionsMenu file={file} onView={onView} onCopyPath={onCopyPath} />
                )}
              </div>
            </div>

            {showPath && (
<HighlightedText
  text={file.path}
  searchTerm={searchTerm}
  className="text-sm text-slate-600 dark:text-slate-400 mb-3 block"
/>
            )}

            {showMetrics && (
              <FileMetrics file={file} variant="inline" className="mb-3" />
            )}

            {/* Функции и импорты */}
            {(file.functions.length > 0 || file.imports.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                {file.functions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Функции ({file.functions.length})
                    </h4>
                    <div className="space-y-1">
                      {file.functions.slice(0, 5).map(func => (
                        <HighlightedText
                          key={func}
                          text={func}
                          searchTerm={searchTerm}
                          className="text-xs text-slate-600 dark:text-slate-400 block truncate"
                        />
                      ))}
                      {file.functions.length > 5 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          и еще {file.functions.length - 5}...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {file.imports.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Импорты ({file.imports.length})
                    </h4>
                    <div className="space-y-1">
                      {file.imports.slice(0, 5).map(imp => (
                        <HighlightedText
                          key={imp}
                          text={imp}
                          searchTerm={searchTerm}
                          className="text-xs text-slate-600 dark:text-slate-400 block truncate"
                        />
                      ))}
                      {file.imports.length > 5 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          и еще {file.imports.length - 5}...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Стандартный вариант (по умолчанию)
  return (
    <motion.div
      className={`${baseClasses} flex items-center px-4 py-3 rounded-lg bg-white dark:bg-slate-800`}
      onClick={handleClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Иконка файла */}
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mr-4"
        style={{ backgroundColor: iconColor }}
        title={typeDescription}
      >
        {icon}
      </div>

      {/* Основная информация */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <HighlightedText
            text={file.name}
            searchTerm={searchTerm}
            className="font-medium text-slate-900 dark:text-slate-100 truncate"
          />
          <Badge variant="secondary" className="ml-2">
            {file.type}
          </Badge>
        </div>
        {showPath && (
<HighlightedText
  text={file.path}
  searchTerm={searchTerm}
  className="text-sm text-slate-600 dark:text-slate-400 truncate"
/>
        )}
        {showMetrics && (
          <FileMetrics file={file} variant="inline" className="mt-2" />
        )}
      </div>

      {/* Действия */}
      {showActions && (
        <div className="ml-4">
          <FileActionsMenu file={file} onView={onView} onCopyPath={onCopyPath} />
        </div>
      )}
    </motion.div>
  );
});

FileItem.displayName = 'FileItem';

export default FileItem;
