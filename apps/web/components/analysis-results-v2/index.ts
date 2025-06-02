/**
 * MCP Code Analyzer V2 - Экспорт компонентов
 * 
 * Централизованный экспорт всех компонентов новой версии анализа результатов
 */

// Основной компонент
export { AnalysisResultsV2 as default } from './AnalysisResultsV2';
export { AnalysisResultsV2 } from './AnalysisResultsV2';

// Хуки
export { useAnalysisState } from './hooks/useAnalysisState';
export { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
export { usePerformanceMonitor } from './hooks/usePerformanceMonitor';
export { useAnalyticsTracking } from './hooks/useAnalyticsTracking';

// Основные компоненты
export { ProjectHeader } from './components/ProjectHeader';
export { ProjectOverview } from './components/ProjectOverview';
export { NavigationSidebar } from './components/NavigationSidebar';
export { ContentArea } from './components/ContentArea';

// Утилиты
export { generateAIInsights } from './utils/aiInsights';

// Типы (если нужны для внешнего использования)
export type { AIInsights } from './utils/aiInsights';
export type { PerformanceMetrics } from './hooks/usePerformanceMonitor';
export type { AnalysisUIState, AnalysisFilters } from './hooks/useAnalysisState';
