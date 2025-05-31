/**
 * Основной компонент результатов анализа (рефакторированная версия)
 * 
 * Этот компонент является главным контейнером для всех секций анализа проекта.
 * Он организует и координирует работу всех подкомпонентов, управляет общим
 * состоянием и предоставляет единообразный интерфейс для пользователя.
 * 
 * Принципы архитектуры:
 * 1. Композиция - компонент строится из независимых секций
 * 2. Единственная ответственность - каждая секция отвечает за свою область
 * 3. Управляемое состояние - централизованное управление активными вкладками
 * 4. Прогрессивное раскрытие - пользователь видит только нужную информацию
 * 5. Доступность - полная поддержка клавиатурной навигации и скринридеров
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Download, Settings, Share2, Bookmark,
  BarChart3, Files, GitBranch, CheckSquare, BookOpen,
  HelpCircle, Zap, Target, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

import { ProjectAnalysis, AnalysisTab } from '@/types/analysis.types';
import { ProjectVisualization } from '@/components/visualization/project-visualization';
import { FilesSection } from './sections/FilesSection';
import { DependenciesSection } from './sections/DependenciesSection';
import { TodosSection } from './sections/TodosSection';
import { DocumentationSection } from './sections/DocumentationSection';
import { exportAnalysisData, createDefaultExportOptions } from '@/utils/export.utils';

interface AnalysisResultsProps {
  analysisResult: ProjectAnalysis | null;
  setAnalysisResult: (result: ProjectAnalysis | null) => void;
  className?: string;
}

/**
 * Компонент обзора проекта с ключевыми метриками
 */
const ProjectOverview: React.FC<{ data: ProjectAnalysis }> = ({ data }) => {
  // Вычисляем дополнительные метрики
  const enhancedMetrics = useMemo(() => {
    const filesWithTodos = data.all_todos ? 
      new Set(data.all_todos.map(todo => todo.file_path)).size : 0;
    
    const criticalTodos = data.all_todos?.filter(todo => todo.type === 'FIXME').length || 0;
    
    const documentationCoverage = data.project_documentation ? 
      (data.project_documentation.reduce((sum, file) => 
        sum + file.functions.filter(f => f.description).length, 0) / 
       Math.max(data.project_documentation.reduce((sum, file) => 
        sum + file.functions.length, 0), 1)) * 100 : 0;

    const codeHealth = Math.round(
      (85 - (criticalTodos * 5) + (documentationCoverage * 0.15)) * 
      (data.architecture_patterns.length > 0 ? 1.1 : 1)
    );

    return {
      filesWithTodos,
      criticalTodos,
      documentationCoverage,
      codeHealth: Math.min(100, Math.max(0, codeHealth))
    };
  }, [data]);

  return (
    <Card className="project-overview">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Обзор проекта
          </CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {data.project_path.split('/').pop()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Основные метрики */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div 
            className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.metrics.total_files}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Файлов</div>
          </motion.div>
          
          <motion.div 
            className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.metrics.total_lines.toLocaleString()}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">Строк кода</div>
          </motion.div>
          
          <motion.div 
            className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {data.metrics.total_functions}
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300">Функций</div>
          </motion.div>
          
          <motion.div 
            className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {Math.round(data.metrics.avg_lines_per_file)}
            </div>
            <div className="text-sm text-orange-700 dark:text-orange-300">Строк/файл</div>
          </motion.div>
        </div>

        {/* Индикатор здоровья кода */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Здоровье кода
            </span>
            <Badge variant={enhancedMetrics.codeHealth > 80 ? 'default' : 
                          enhancedMetrics.codeHealth > 60 ? 'secondary' : 'destructive'}>
              {enhancedMetrics.codeHealth}/100
            </Badge>
          </div>
          <Progress value={enhancedMetrics.codeHealth} className="h-2" />
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Основано на качестве кода, документации и архитектурных паттернах
          </div>
        </div>

        {/* Технологии и паттерны */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3 text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Технологии
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.metrics.languages.map((lang) => (
                <Badge key={lang} variant="secondary" className="text-xs">
                  {lang.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>

          {data.architecture_patterns.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Архитектурные паттерны
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.architecture_patterns.map((pattern) => (
                  <Badge key={pattern} variant="outline" className="text-xs">
                    {pattern}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Быстрая статистика по другим секциям */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {data.dependencies.length}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Зависимостей</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {data.all_todos?.length || 0}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">TODO/FIXME</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {enhancedMetrics.documentationCoverage.toFixed(0)}%
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Документировано</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Конфигурация вкладок с их метаданными
 */
const TAB_CONFIGS = {
  [AnalysisTab.VISUALIZATION]: {
    id: AnalysisTab.VISUALIZATION,
    label: 'Визуализация',
    icon: BarChart3,
    description: 'Интерактивные графики и диаграммы',
    shortcut: '1'
  },
  [AnalysisTab.FILES]: {
    id: AnalysisTab.FILES,
    label: 'Файлы',
    icon: Files,
    description: 'Структура и содержимое файлов проекта',
    shortcut: '2'
  },
  [AnalysisTab.DEPENDENCIES]: {
    id: AnalysisTab.DEPENDENCIES,
    label: 'Зависимости',
    icon: GitBranch,
    description: 'Связи между файлами и модулями',
    shortcut: '3'
  },
  [AnalysisTab.TODOS]: {
    id: AnalysisTab.TODOS,
    label: 'TODO/FIXME',
    icon: CheckSquare,
    description: 'Задачи и исправления в коде',
    shortcut: '4'
  },
  [AnalysisTab.DOCUMENTATION]: {
    id: AnalysisTab.DOCUMENTATION,
    label: 'Документация',
    icon: BookOpen,
    description: 'Автоматически извлеченная документация',
    shortcut: '5'
  }
} as const;

/**
 * Основной компонент AnalysisResults
 */
export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  analysisResult,
  setAnalysisResult,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>(AnalysisTab.VISUALIZATION);

  // Обработчики навигации
  const handleBack = useCallback(() => {
    setAnalysisResult(null);
  }, [setAnalysisResult]);

  const handleFileNavigation = useCallback((filePath: string, line?: number) => {
    // В реальном приложении здесь была бы логика открытия файла в редакторе
    const url = line ? `vscode://file/${filePath}:${line}` : `vscode://file/${filePath}`;
    window.open(url, '_blank');
  }, []);

  // Обработчики экспорта
  const handleExportAll = useCallback(() => {
    if (!analysisResult) return;
    exportAnalysisData(analysisResult, createDefaultExportOptions('json'));
  }, [analysisResult]);

  const handleExportMarkdown = useCallback(() => {
    if (!analysisResult) return;
    exportAnalysisData(analysisResult, createDefaultExportOptions('markdown'));
  }, [analysisResult]);

  const handleExportCSV = useCallback(() => {
    if (!analysisResult) return;
    exportAnalysisData(analysisResult, createDefaultExportOptions('csv'));
  }, [analysisResult]);

  // Клавиатурная навигация
  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.altKey) {
        const tabConfigs = Object.values(TAB_CONFIGS);
        const tabConfig = tabConfigs.find(config => config.shortcut === event.key);
        if (tabConfig) {
          event.preventDefault();
          setActiveTab(tabConfig.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!analysisResult) {
    return null;
  }

  return (
    <div className={`analysis-results-redesigned space-y-6 ${className}`}>
      {/* Заголовок с навигацией */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад к анализу
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Результаты анализа
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {analysisResult.project_path}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Меню экспорта */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Экспорт
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportAll}>
                <Download className="mr-2 h-4 w-4" />
                Полный отчет (JSON)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportMarkdown}>
                <BookOpen className="mr-2 h-4 w-4" />
                Документация (Markdown)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV}>
                <Files className="mr-2 h-4 w-4" />
                Данные файлов (CSV)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Поделиться ссылкой
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm">
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Обзор проекта */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ProjectOverview data={analysisResult} />
      </motion.div>

      {/* Основные секции */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AnalysisTab)}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            {Object.values(TAB_CONFIGS).map(config => {
              const IconComponent = config.icon;
              const hasData = (() => {
                switch (config.id) {
                  case AnalysisTab.FILES:
                    return analysisResult.files.length > 0;
                  case AnalysisTab.DEPENDENCIES:
                    return analysisResult.dependencies.length > 0;
                  case AnalysisTab.TODOS:
                    return (analysisResult.all_todos?.length || 0) > 0;
                  case AnalysisTab.DOCUMENTATION:
                    return (analysisResult.project_documentation?.length || 0) > 0;
                  default:
                    return true;
                }
              })();

              return (
                <TabsTrigger 
                  key={config.id} 
                  value={config.id}
                  className="relative group flex items-center gap-2"
                  title={`${config.description} (Alt+${config.shortcut})`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden sm:inline">{config.label}</span>
                  {!hasData && (
                    <div className="w-2 h-2 bg-slate-400 rounded-full opacity-50" 
                         title="Нет данных" />
                  )}
                  
                  {/* Подсказка для клавиатурных сочетаний */}
                  <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                    {config.description}
                    <br />
                    <span className="text-slate-300">Alt+{config.shortcut}</span>
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value={AnalysisTab.VISUALIZATION} className="mt-0">
                <ProjectVisualization data={analysisResult} />
              </TabsContent>

              <TabsContent value={AnalysisTab.FILES} className="mt-0">
                <FilesSection
                  files={analysisResult.files}
                  projectPath={analysisResult.project_path}
                  onFileNavigate={handleFileNavigation}
                />
              </TabsContent>

              <TabsContent value={AnalysisTab.DEPENDENCIES} className="mt-0">
                <DependenciesSection
                  dependencies={analysisResult.dependencies}
                  projectPath={analysisResult.project_path}
                  onFileNavigate={handleFileNavigation}
                />
              </TabsContent>

              <TabsContent value={AnalysisTab.TODOS} className="mt-0">
                <TodosSection
                  todos={analysisResult.all_todos || []}
                  projectPath={analysisResult.project_path}
                  onFileNavigate={handleFileNavigation}
                />
              </TabsContent>

              <TabsContent value={AnalysisTab.DOCUMENTATION} className="mt-0">
                <DocumentationSection
                  documentation={analysisResult.project_documentation || []}
                  projectPath={analysisResult.project_path}
                  onFileNavigate={handleFileNavigation}
                />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>

      {/* Подсказки для пользователя */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-xs text-slate-500 dark:text-slate-400"
      >
        <div className="flex items-center justify-center gap-4">
          <span className="flex items-center gap-1">
            <HelpCircle className="h-3 w-3" />
            Используйте Alt+1-5 для быстрой навигации
          </span>
          <span>•</span>
          <span>Наведите курсор на элементы для дополнительной информации</span>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalysisResults;
