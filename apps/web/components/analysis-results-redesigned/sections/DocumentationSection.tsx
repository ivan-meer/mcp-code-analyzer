/**
 * Секция для работы с автоматически извлеченной документацией
 * 
 * Этот компонент предоставляет интерфейс для просмотра и анализа
 * документации, автоматически извлеченной из комментариев в коде.
 * Он помогает оценить качество документирования и найти недокументированные части.
 * 
 * Особенности:
 * 1. Анализ покрытия документацией
 * 2. Поиск по документации
 * 3. Экспорт в различные форматы
 * 4. Генерация отчетов о качестве документации
 * 5. Навигация по коду из документации
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, FileText, Download, Search, BarChart3, 
  CheckCircle, XCircle, AlertCircle, Code, ExternalLink,
  Copy, Eye, Filter, Grid, List, Bookmark, Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { DocFile, DocFunction } from '@/types/analysis.types';
import { useFiltering } from '@/hooks/useFiltering';
import { SearchFilter } from '@/components/shared/SearchFilter';
import { VirtualList } from '@/components/shared/VirtualList';
import { exportToMarkdown, exportToJson, generateExportFilename } from '@/utils/export.utils';

interface DocumentationSectionProps {
  documentation: DocFile[];
  projectPath: string;
  onFileNavigate?: (filePath: string, line?: number) => void;
  className?: string;
}

/**
 * Компонент статистики документации
 */
const DocumentationStatistics: React.FC<{ documentation: DocFile[] }> = ({ documentation }) => {
  const stats = useMemo(() => {
    const totalFiles = documentation.length;
    const totalFunctions = documentation.reduce((sum, file) => sum + file.functions.length, 0);
    const documentedFunctions = documentation.reduce((sum, file) => 
      sum + file.functions.filter(fn => fn.description).length, 0
    );
    const functionsWithParams = documentation.reduce((sum, file) => 
      sum + file.functions.filter(fn => fn.params.length > 0).length, 0
    );
    const functionsWithReturns = documentation.reduce((sum, file) => 
      sum + file.functions.filter(fn => fn.returns).length, 0
    );

    const coveragePercentage = totalFunctions > 0 ? (documentedFunctions / totalFunctions) * 100 : 0;
    const paramsDocumentationRate = functionsWithParams > 0 ? 
      (documentation.reduce((sum, file) => 
        sum + file.functions.filter(fn => 
          fn.params.length > 0 && fn.params.every(p => p.description)
        ).length, 0) / functionsWithParams) * 100 : 0;

    // Анализ качества документации
    const qualityScore = (
      (coveragePercentage * 0.4) + 
      (paramsDocumentationRate * 0.3) + 
      ((functionsWithReturns / Math.max(totalFunctions, 1)) * 100 * 0.3)
    );

    return {
      totalFiles,
      totalFunctions,
      documentedFunctions,
      coveragePercentage,
      paramsDocumentationRate,
      qualityScore,
      undocumentedFunctions: totalFunctions - documentedFunctions
    };
  }, [documentation]);

  return (
    <div className="space-y-4">
      {/* Основная статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalFiles}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Файлов</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.documentedFunctions}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Документировано</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.undocumentedFunctions}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Без документации</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.coveragePercentage.toFixed(0)}%
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Покрытие</div>
        </div>
      </div>

      {/* Качество документации */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Качество документации
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Общая оценка: {stats.qualityScore.toFixed(0)}/100
              </span>
              <Badge 
                variant={stats.qualityScore > 80 ? 'default' : stats.qualityScore > 50 ? 'secondary' : 'destructive'}
              >
                {stats.qualityScore > 80 ? 'Отлично' : stats.qualityScore > 50 ? 'Хорошо' : 'Требует улучшения'}
              </Badge>
            </div>
            <Progress 
              value={stats.qualityScore} 
              className="h-2"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex justify-between">
                  <span>Покрытие функций:</span>
                  <span>{stats.coveragePercentage.toFixed(1)}%</span>
                </div>
                <Progress value={stats.coveragePercentage} className="h-1 mt-1" />
              </div>
              <div>
                <div className="flex justify-between">
                  <span>Документация параметров:</span>
                  <span>{stats.paramsDocumentationRate.toFixed(1)}%</span>
                </div>
                <Progress value={stats.paramsDocumentationRate} className="h-1 mt-1" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Рекомендации */}
      {stats.qualityScore < 70 && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            {stats.coveragePercentage < 50 
              ? 'Низкое покрытие документацией. Рекомендуется добавить описания к функциям.'
              : 'Хорошее покрытие, но стоит улучшить качество документации параметров и возвращаемых значений.'
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

/**
 * Компонент отображения функции
 */
const FunctionDocumentationItem: React.FC<{
  func: DocFunction;
  filePath: string;
  searchTerm?: string;
  onNavigate?: (filePath: string, line?: number) => void;
  onCopy?: (content: string) => void;
}> = ({ func, filePath, searchTerm, onNavigate, onCopy }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const highlightText = (text: string) => {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 rounded px-1">
          {part}
        </mark>
      ) : part
    );
  };

  const copyFunctionSignature = () => {
    const signature = `${func.name}(${func.params.map(p => 
      `${p.name}${p.type ? `: ${p.type}` : ''}`
    ).join(', ')})${func.returns?.type ? `: ${func.returns.type}` : ''}`;
    onCopy?.(signature);
  };

  return (
    <Card className="function-doc-item">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Code className="h-4 w-4 text-blue-500" />
              <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                {highlightText(func.name)}
              </span>
              {func.line_start && (
                <Badge variant="outline" className="text-xs">
                  L{func.line_start}-{func.line_end || func.line_start}
                </Badge>
              )}
            </div>
            {func.description ? (
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {highlightText(func.description)}
              </p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                Описание отсутствует
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate?.(filePath, func.line_start || undefined)}
              className="h-8 w-8 p-0"
              title="Перейти к коду"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyFunctionSignature}
              className="h-8 w-8 p-0"
              title="Копировать сигнатуру"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
              title={isExpanded ? "Свернуть" : "Развернуть"}
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (func.params.length > 0 || func.returns) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Параметры */}
                {func.params.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Параметры:
                    </h4>
                    <div className="space-y-2">
                      {func.params.map((param, index) => (
                        <div key={index} className="flex items-start space-x-3 text-sm">
                          <Badge variant="outline" className="text-xs font-mono">
                            {param.name}
                          </Badge>
                          <div className="flex-1">
                            {param.type && (
                              <span className="text-blue-600 dark:text-blue-400 text-xs mr-2">
                                {param.type}
                              </span>
                            )}
                            <span className="text-slate-600 dark:text-slate-400">
                              {param.description || 'Описание отсутствует'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Возвращаемое значение */}
                {func.returns && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Возвращает:
                    </h4>
                    <div className="text-sm">
                      {func.returns.type && (
                        <span className="text-blue-600 dark:text-blue-400 text-xs mr-2">
                          {func.returns.type}
                        </span>
                      )}
                      <span className="text-slate-600 dark:text-slate-400">
                        {func.returns.description || 'Описание отсутствует'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

/**
 * Компонент группировки по файлам
 */
const DocumentationByFiles: React.FC<{
  documentation: DocFile[];
  searchTerm?: string;
  onNavigate?: (filePath: string, line?: number) => void;
  onCopy?: (content: string) => void;
}> = ({ documentation, searchTerm, onNavigate, onCopy }) => {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const toggleFile = (filePath: string) => {
    setExpandedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filePath)) {
        newSet.delete(filePath);
      } else {
        newSet.add(filePath);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      {documentation.map((file) => {
        const fileName = file.file_path.split('/').pop() || file.file_path;
        const isExpanded = expandedFiles.has(file.file_path);
        const documentedCount = file.functions.filter(f => f.description).length;
        const totalCount = file.functions.length;

        return (
          <Card key={file.file_path} className="file-doc-group">
            <CardHeader className="pb-3">
              <button
                onClick={() => toggleFile(file.file_path)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">
                      {fileName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {file.file_path}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={documentedCount === totalCount ? 'default' : 'secondary'}>
                    {documentedCount}/{totalCount}
                  </Badge>
                  {documentedCount === totalCount ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : documentedCount === 0 ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </button>
            </CardHeader>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <CardContent className="pt-0 space-y-3">
                    {file.functions.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                        В этом файле не найдено документированных функций
                      </p>
                    ) : (
                      file.functions.map((func, index) => (
                        <FunctionDocumentationItem
                          key={index}
                          func={func}
                          filePath={file.file_path}
                          searchTerm={searchTerm}
                          onNavigate={onNavigate}
                          onCopy={onCopy}
                        />
                      ))
                    )}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
};

/**
 * Основной компонент DocumentationSection
 */
export const DocumentationSection: React.FC<DocumentationSectionProps> = ({
  documentation,
  projectPath,
  onFileNavigate,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'list' | 'files'>('files');

  // Создаем плоский список всех функций для фильтрации
  const allFunctions = useMemo(() => {
    return documentation.flatMap(file => 
      file.functions.map(func => ({
        ...func,
        file_path: file.file_path
      }))
    );
  }, [documentation]);

  // Используем хук фильтрации
  const {
    filteredData: filteredFunctions,
    search,
    quickSearch,
    resetFilters,
    stats
  } = useFiltering(allFunctions, {}, {
    searchFields: ['name', 'description', 'file_path']
  });

  // Обработчики событий
  const handleNavigate = useCallback((filePath: string, line?: number) => {
    onFileNavigate?.(filePath, line);
  }, [onFileNavigate]);

  const handleCopy = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
  }, []);

  const handleExportMarkdown = useCallback(() => {
    const exportData = {
      project_path: projectPath,
      project_documentation: documentation,
      files: [],
      dependencies: [],
      metrics: { total_files: 0, total_lines: 0, total_functions: 0, avg_lines_per_file: 0, languages: [] },
      architecture_patterns: []
    };

    const markdown = exportToMarkdown(exportData, {
      format: 'markdown',
      includeMetrics: false,
      includeDependencies: false,
      includeTodos: false,
      includeDocumentation: true
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateExportFilename(projectPath, 'markdown');
    link.click();
    URL.revokeObjectURL(url);
  }, [documentation, projectPath]);

  // Если нет документации
  if (documentation.length === 0) {
    return (
      <Card className={`documentation-section ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Документация проекта
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Документация не найдена
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              В проекте не найдено комментариев в формате JSDoc, DocString или аналогичных.
              Рекомендуется добавить документацию к функциям для улучшения читаемости кода.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`documentation-section ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Документация проекта
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {/* Переключатель режимов просмотра */}
            <div className="flex border border-slate-200 dark:border-slate-700 rounded-md">
              <Button
                variant={viewMode === 'files' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('files')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>

        {/* Статистика */}
        <DocumentationStatistics documentation={documentation} />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Поиск */}
        <SearchFilter
          searchPlaceholder="Поиск по названиям функций, описаниям или файлам..."
          searchValue={search.query}
          onSearchChange={quickSearch}
          totalItems={allFunctions.length}
          filteredItems={stats.filteredItems}
          onClearAll={resetFilters}
          variant="minimal"
        />

        {/* Вкладки */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="browse">Просмотр</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Файлы с лучшей документацией */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Лучше всего документированы
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documentation
                      .filter(file => file.functions.length > 0)
                      .map(file => ({
                        ...file,
                        coverage: file.functions.filter(f => f.description).length / file.functions.length
                      }))
                      .sort((a, b) => b.coverage - a.coverage)
                      .slice(0, 5)
                      .map(file => {
                        const fileName = file.file_path.split('/').pop() || file.file_path;
                        return (
                          <div key={file.file_path} className="flex items-center justify-between">
                            <span className="text-sm truncate">{fileName}</span>
                            <Badge variant={file.coverage === 1 ? 'default' : 'secondary'}>
                              {(file.coverage * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Файлы, требующие внимания */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Требуют документирования
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documentation
                      .filter(file => file.functions.length > 0)
                      .map(file => ({
                        ...file,
                        coverage: file.functions.filter(f => f.description).length / file.functions.length,
                        undocumented: file.functions.length - file.functions.filter(f => f.description).length
                      }))
                      .filter(file => file.undocumented > 0)
                      .sort((a, b) => b.undocumented - a.undocumented)
                      .slice(0, 5)
                      .map(file => {
                        const fileName = file.file_path.split('/').pop() || file.file_path;
                        return (
                          <div key={file.file_path} className="flex items-center justify-between">
                            <span className="text-sm truncate">{fileName}</span>
                            <Badge variant="destructive">
                              {file.undocumented} без документации
                            </Badge>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="browse" className="space-y-4">
            {viewMode === 'files' ? (
              <DocumentationByFiles
                documentation={documentation.filter(file => 
                  file.functions.some(func => 
                    search.query === '' || 
                    func.name.toLowerCase().includes(search.query.toLowerCase()) ||
                    (func.description && func.description.toLowerCase().includes(search.query.toLowerCase()))
                  )
                )}
                searchTerm={search.query}
                onNavigate={handleNavigate}
                onCopy={handleCopy}
              />
            ) : (
              <VirtualList
                items={filteredFunctions}
                renderItem={(func: any, index) => (
                  <FunctionDocumentationItem
                    func={func}
                    filePath={func.file_path}
                    searchTerm={search.query}
                    onNavigate={handleNavigate}
                    onCopy={handleCopy}
                  />
                )}
                height={600}
                itemHeight={150}
                emptyMessage="Функции не найдены. Попробуйте изменить критерии поиска."
                showScrollIndicator={filteredFunctions.length > 20}
                ariaLabel="Список документированных функций"
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DocumentationSection;
