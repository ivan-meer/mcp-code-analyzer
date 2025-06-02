/**
 * ContentArea - Главная область контента с умным рендерингом вкладок
 * 
 * Динамически загружает компоненты только при необходимости для оптимизации производительности
 */

import React, { Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertTriangle } from 'lucide-react';
import { ProjectAnalysis, AnalysisTab } from '@/types/analysis.types';
import { AnalysisFilters } from '../hooks/useAnalysisState';

// Ленивая загрузка секций для оптимизации
const VisualizationSectionV2 = React.lazy(() => import('../sections/VisualizationSectionV2'));
const FilesSectionV2 = React.lazy(() => import('../sections/FilesSectionV2'));
const DependenciesSectionV2 = React.lazy(() => import('../sections/DependenciesSectionV2'));
const TodosSectionV2 = React.lazy(() => import('../sections/TodosSectionV2'));
const DocumentationSectionV2 = React.lazy(() => import('../sections/DocumentationSectionV2'));
const DuplicatesSectionV2 = React.lazy(() => import('../sections/DuplicatesSectionV2'));

interface ContentAreaProps {
  activeTab: AnalysisTab;
  analysisResult: ProjectAnalysis;
  onFileNavigate: (filePath: string, line?: number) => void;
  filters: AnalysisFilters;
  onFiltersChange: (filters: Partial<AnalysisFilters>) => void;
  searchQuery: string;
  viewMode: 'grid' | 'list' | 'detail';
  onViewModeChange: (mode: 'grid' | 'list' | 'detail') => void;
}

// Компонент загрузки
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Загрузка...' }) => (
  <div className="flex items-center justify-center h-96">
    <div className="glass-morphism rounded-2xl p-8 border border-white/20">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
        <p className="text-white/80 text-sm">{message}</p>
      </div>
    </div>
  </div>
);

// Компонент ошибки
const ErrorBoundary: React.FC<{ error: Error; reset: () => void }> = ({ error, reset }) => (
  <div className="flex items-center justify-center h-96">
    <div className="glass-morphism rounded-2xl p-8 border border-red-500/30 bg-red-500/10">
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="h-8 w-8 text-red-400" />
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Ошибка загрузки</h3>
          <p className="text-white/70 text-sm mb-4">{error.message}</p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 
                     rounded-lg text-red-300 hover:text-red-200 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Обертка для секций с обработкой ошибок
class SectionErrorBoundary extends React.Component<
  { children: React.ReactNode; sectionName: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; sectionName: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in ${this.props.sectionName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundary
          error={this.state.error || new Error('Неизвестная ошибка')}
          reset={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

export const ContentArea: React.FC<ContentAreaProps> = ({
  activeTab,
  analysisResult,
  onFileNavigate,
  filters,
  onFiltersChange,
  searchQuery,
  viewMode,
  onViewModeChange
}) => {
  // Проверяем наличие данных для каждой секции
  const hasData = useMemo(() => {
    switch (activeTab) {
      case AnalysisTab.FILES:
        return analysisResult.files.length > 0;
      case AnalysisTab.DEPENDENCIES:
        return analysisResult.dependencies.length > 0;
      case AnalysisTab.TODOS:
        return (analysisResult.all_todos?.length || 0) > 0;
      case AnalysisTab.DOCUMENTATION:
        return (analysisResult.project_documentation?.length || 0) > 0;
      case AnalysisTab.DUPLICATES:
        return (analysisResult.file_duplicates?.length || 0) > 0;
      case AnalysisTab.VISUALIZATION:
      default:
        return true; // Визуализация всегда доступна
    }
  }, [activeTab, analysisResult]);

  // Сообщения для пустых состояний
  const getEmptyStateMessage = () => {
    switch (activeTab) {
      case AnalysisTab.FILES:
        return {
          title: 'Файлы не найдены',
          description: 'В анализируемом проекте не обнаружено файлов исходного кода.',
          icon: '📁'
        };
      case AnalysisTab.DEPENDENCIES:
        return {
          title: 'Зависимости не найдены',
          description: 'В проекте не обнаружено связей между файлами и модулями.',
          icon: '🔗'
        };
      case AnalysisTab.TODOS:
        return {
          title: 'Отличная работа!',
          description: 'В коде не найдено TODO, FIXME или HACK комментариев.',
          icon: '✅'
        };
      case AnalysisTab.DOCUMENTATION:
        return {
          title: 'Документация не найдена',
          description: 'В файлах проекта не обнаружено JSDoc или docstring документации.',
          icon: '📚'
        };
      case AnalysisTab.DUPLICATES:
        return {
          title: 'Дубликаты не найдены',
          description: 'Отлично! В проекте нет дублирующихся файлов.',
          icon: '🎯'
        };
      default:
        return {
          title: 'Нет данных',
          description: 'Данные для отображения отсутствуют.',
          icon: '❓'
        };
    }
  };

  // Компонент пустого состояния
  const EmptyState: React.FC = () => {
    const emptyState = getEmptyStateMessage();
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center h-96"
      >
        <div className="glass-morphism rounded-2xl p-12 border border-white/20 text-center max-w-md">
          <div className="text-6xl mb-4">{emptyState.icon}</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {emptyState.title}
          </h3>
          <p className="text-white/70">
            {emptyState.description}
          </p>
        </div>
      </motion.div>
    );
  };

  // Рендер активной секции
  const renderActiveSection = () => {
    if (!hasData) {
      return <EmptyState />;
    }

    const commonProps = {
      analysisResult,
      onFileNavigate,
      filters,
      onFiltersChange,
      searchQuery,
      viewMode,
      onViewModeChange
    };

    switch (activeTab) {
      case AnalysisTab.VISUALIZATION:
        return (
          <SectionErrorBoundary sectionName="Visualization">
            <Suspense fallback={<LoadingSpinner message="Загрузка визуализации..." />}>
              <VisualizationSectionV2 {...commonProps} />
            </Suspense>
          </SectionErrorBoundary>
        );

      case AnalysisTab.FILES:
        return (
          <SectionErrorBoundary sectionName="Files">
            <Suspense fallback={<LoadingSpinner message="Загрузка файлов..." />}>
              <FilesSectionV2 {...commonProps} />
            </Suspense>
          </SectionErrorBoundary>
        );

      case AnalysisTab.DEPENDENCIES:
        return (
          <SectionErrorBoundary sectionName="Dependencies">
            <Suspense fallback={<LoadingSpinner message="Загрузка зависимостей..." />}>
              <DependenciesSectionV2 {...commonProps} />
            </Suspense>
          </SectionErrorBoundary>
        );

      case AnalysisTab.TODOS:
        return (
          <SectionErrorBoundary sectionName="Todos">
            <Suspense fallback={<LoadingSpinner message="Загрузка задач..." />}>
              <TodosSectionV2 {...commonProps} />
            </Suspense>
          </SectionErrorBoundary>
        );

      case AnalysisTab.DOCUMENTATION:
        return (
          <SectionErrorBoundary sectionName="Documentation">
            <Suspense fallback={<LoadingSpinner message="Загрузка документации..." />}>
              <DocumentationSectionV2 {...commonProps} />
            </Suspense>
          </SectionErrorBoundary>
        );

      case AnalysisTab.DUPLICATES:
        return (
          <SectionErrorBoundary sectionName="Duplicates">
            <Suspense fallback={<LoadingSpinner message="Загрузка дубликатов..." />}>
              <DuplicatesSectionV2 {...commonProps} />
            </Suspense>
          </SectionErrorBoundary>
        );

      default:
        return <EmptyState />;
    }
  };

  return (
    <div className="flex-1 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ 
            duration: 0.3, 
            ease: 'easeInOut',
            layout: { duration: 0.2 }
          }}
          className="h-full overflow-y-auto custom-scrollbar p-6"
        >
          {renderActiveSection()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ContentArea;
