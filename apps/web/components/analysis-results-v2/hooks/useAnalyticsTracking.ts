/**
 * useAnalyticsTracking - Аналитика пользовательского поведения
 * 
 * Отслеживает взаимодействия пользователей с интерфейсом анализа
 * для понимания паттернов использования и оптимизации UX.
 */

import { useEffect, useCallback, useRef } from 'react';
import { ProjectAnalysis, AnalysisTab } from '@/types/analysis.types';

interface AnalyticsEvent {
  event: string;
  timestamp: number;
  tab: AnalysisTab;
  metadata?: Record<string, any>;
}

interface AnalyticsSession {
  sessionId: string;
  startTime: number;
  events: AnalyticsEvent[];
  projectInfo?: {
    totalFiles: number;
    totalLines: number;
    languages: string[];
    size: number;
  };
}

export function useAnalyticsTracking(
  analysisResult: ProjectAnalysis | null,
  activeTab: AnalysisTab
) {
  const sessionRef = useRef<AnalyticsSession | null>(null);
  const lastActiveTab = useRef<AnalysisTab>(activeTab);

  // Инициализация сессии
  useEffect(() => {
    if (!sessionRef.current) {
      sessionRef.current = {
        sessionId: generateSessionId(),
        startTime: Date.now(),
        events: [],
        projectInfo: analysisResult ? {
          totalFiles: analysisResult.files.length,
          totalLines: analysisResult.metrics.total_lines,
          languages: analysisResult.metrics.languages,
          size: analysisResult.files.reduce((sum, file) => sum + file.size, 0)
        } : undefined
      };

      trackEvent('session_start', {
        projectPath: analysisResult?.project_path,
        hasResult: !!analysisResult
      });
    }
  }, [analysisResult]);

  // Отслеживание смены вкладок
  useEffect(() => {
    if (lastActiveTab.current !== activeTab) {
      const timeSpent = Date.now() - (sessionRef.current?.events[sessionRef.current.events.length - 1]?.timestamp || Date.now());
      
      trackEvent('tab_change', {
        fromTab: lastActiveTab.current,
        toTab: activeTab,
        timeSpentOnPreviousTab: timeSpent
      });

      lastActiveTab.current = activeTab;
    }
  }, [activeTab]);

  // Функция отслеживания событий
  const trackEvent = useCallback((event: string, metadata?: Record<string, any>) => {
    if (!sessionRef.current) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      timestamp: Date.now(),
      tab: activeTab,
      metadata
    };

    sessionRef.current.events.push(analyticsEvent);

    // Отправка в аналитику (в реальном проекте)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, {
        custom_parameter_1: activeTab,
        custom_parameter_2: metadata ? JSON.stringify(metadata) : undefined
      });
    }

    // Логирование для разработки
    console.log('Analytics Event:', analyticsEvent);
  }, [activeTab]);

  // Специализированные функции отслеживания
  const trackFileOpen = useCallback((filePath: string, source: 'search' | 'list' | 'dependency') => {
    trackEvent('file_open', {
      filePath: filePath.split('/').pop(), // Только имя файла для приватности
      source,
      fileExtension: filePath.split('.').pop()
    });
  }, [trackEvent]);

  const trackSearch = useCallback((query: string, resultsCount: number, source: AnalysisTab) => {
    trackEvent('search', {
      queryLength: query.length,
      resultsCount,
      source,
      hasQuery: query.length > 0
    });
  }, [trackEvent]);

  const trackFilter = useCallback((filterType: string, filterValue: any) => {
    trackEvent('filter_applied', {
      filterType,
      filterValue: Array.isArray(filterValue) ? filterValue.length : typeof filterValue,
      hasValue: Array.isArray(filterValue) ? filterValue.length > 0 : !!filterValue
    });
  }, [trackEvent]);

  const trackExport = useCallback((format: string, itemCount: number) => {
    trackEvent('export_data', {
      format,
      itemCount,
      source: activeTab
    });
  }, [trackEvent, activeTab]);

  const trackVisualizationInteraction = useCallback((interactionType: string, details?: any) => {
    trackEvent('visualization_interaction', {
      interactionType,
      ...details
    });
  }, [trackEvent]);

  const trackCodeNavigation = useCallback((navigationType: 'click' | 'keyboard' | 'search', target: string) => {
    trackEvent('code_navigation', {
      navigationType,
      target,
      source: activeTab
    });
  }, [trackEvent, activeTab]);

  const trackUIInteraction = useCallback((component: string, action: string, details?: any) => {
    trackEvent('ui_interaction', {
      component,
      action,
      ...details
    });
  }, [trackEvent]);

  const trackPerformanceMetric = useCallback((metric: string, value: number, context?: string) => {
    trackEvent('performance_metric', {
      metric,
      value,
      context,
      timestamp: Date.now()
    });
  }, [trackEvent]);

  // Отслеживание ошибок
  const trackError = useCallback((error: Error, context?: string) => {
    trackEvent('error', {
      errorMessage: error.message,
      errorStack: error.stack?.substring(0, 500), // Ограничиваем размер
      context,
      userAgent: navigator.userAgent
    });
  }, [trackEvent]);

  // Завершение сессии
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionRef.current) {
        const sessionDuration = Date.now() - sessionRef.current.startTime;
        trackEvent('session_end', {
          sessionDuration,
          totalEvents: sessionRef.current.events.length,
          finalTab: activeTab
        });

        // Отправка данных сессии
        sendSessionData(sessionRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeTab, trackEvent]);

  // Генерация отчета о сессии
  const generateSessionReport = useCallback(() => {
    if (!sessionRef.current) return null;

    const events = sessionRef.current.events;
    const sessionDuration = Date.now() - sessionRef.current.startTime;
    
    // Анализ использования вкладок
    const tabUsage = events
      .filter(e => e.event === 'tab_change')
      .reduce((acc, event) => {
        const tab = event.metadata?.toTab;
        if (tab) {
          acc[tab] = (acc[tab] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

    // Самая используемая функция
    const interactions = events
      .filter(e => e.event === 'ui_interaction')
      .reduce((acc, event) => {
        const component = event.metadata?.component;
        if (component) {
          acc[component] = (acc[component] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

    const mostUsedTab = Object.entries(tabUsage).sort(([,a], [,b]) => b - a)[0]?.[0];
    const mostUsedFeature = Object.entries(interactions).sort(([,a], [,b]) => b - a)[0]?.[0];

    return {
      sessionId: sessionRef.current.sessionId,
      duration: sessionDuration,
      totalEvents: events.length,
      uniqueEvents: [...new Set(events.map(e => e.event))].length,
      tabUsage,
      mostUsedTab,
      mostUsedFeature,
      searchCount: events.filter(e => e.event === 'search').length,
      exportCount: events.filter(e => e.event === 'export_data').length,
      errorCount: events.filter(e => e.event === 'error').length,
      projectInfo: sessionRef.current.projectInfo
    };
  }, []);

  return {
    trackEvent,
    trackFileOpen,
    trackSearch,
    trackFilter,
    trackExport,
    trackVisualizationInteraction,
    trackCodeNavigation,
    trackUIInteraction,
    trackPerformanceMetric,
    trackError,
    generateSessionReport,
    sessionId: sessionRef.current?.sessionId
  };
}

// Вспомогательные функции
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function sendSessionData(session: AnalyticsSession) {
  // В реальном проекте здесь была бы отправка на аналитический сервер
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const data = JSON.stringify({
        sessionId: session.sessionId,
        duration: Date.now() - session.startTime,
        eventsCount: session.events.length,
        projectInfo: session.projectInfo
      });
      
      navigator.sendBeacon('/api/analytics', data);
    }
  } catch (error) {
    console.warn('Failed to send analytics data:', error);
  }
}

export default useAnalyticsTracking;
