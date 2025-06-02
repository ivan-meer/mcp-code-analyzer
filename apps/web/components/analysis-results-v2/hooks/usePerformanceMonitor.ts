/**
 * usePerformanceMonitor - Мониторинг производительности анализа
 * 
 * Отслеживает метрики производительности интерфейса и анализа,
 * предоставляя insights для оптимизации и debugging.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ProjectAnalysis } from '@/types/analysis.types';

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  analysisTime: number;
  totalFiles: number;
  totalSize: number;
  averageFileSize: number;
  loadTime: number;
  interactionLatency: number;
  cacheHitRate: number;
  errorRate: number;
  uiResponsiveness: 'excellent' | 'good' | 'fair' | 'poor';
  analysisComplexity: 'low' | 'medium' | 'high' | 'extreme';
  recommendations: string[];
}

export function usePerformanceMonitor(analysisResult: ProjectAnalysis | null) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    analysisTime: 0,
    totalFiles: 0,
    totalSize: 0,
    averageFileSize: 0,
    loadTime: 0,
    interactionLatency: 0,
    cacheHitRate: 0,
    errorRate: 0,
    uiResponsiveness: 'excellent',
    analysisComplexity: 'low',
    recommendations: []
  });

  const startTime = useRef<number>(Date.now());
  const renderStartTime = useRef<number>(0);
  const interactionTimes = useRef<number[]>([]);
  const errorCount = useRef<number>(0);
  const totalInteractions = useRef<number>(0);

  // Измерение времени рендеринга
  useEffect(() => {
    renderStartTime.current = performance.now();
    
    const measureRender = () => {
      const renderTime = performance.now() - renderStartTime.current;
      setMetrics(prev => ({ ...prev, renderTime }));
    };

    // Измеряем после завершения рендеринга
    const timeoutId = setTimeout(measureRender, 0);
    return () => clearTimeout(timeoutId);
  }, [analysisResult]);

  // Мониторинг памяти (если доступно)
  useEffect(() => {
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
        setMetrics(prev => ({ ...prev, memoryUsage }));
      }
    };

    measureMemory();
    const interval = setInterval(measureMemory, 5000); // Каждые 5 секунд
    return () => clearInterval(interval);
  }, []);

  // Анализ данных проекта
  useEffect(() => {
    if (!analysisResult) return;

    const totalFiles = analysisResult.files.length;
    const totalSize = analysisResult.files.reduce((sum, file) => sum + file.size, 0);
    const averageFileSize = totalSize / totalFiles;
    const analysisTime = Date.now() - startTime.current;

    // Определение сложности анализа
    let analysisComplexity: PerformanceMetrics['analysisComplexity'] = 'low';
    if (totalFiles > 1000 || totalSize > 50 * 1024 * 1024) {
      analysisComplexity = 'extreme';
    } else if (totalFiles > 500 || totalSize > 20 * 1024 * 1024) {
      analysisComplexity = 'high';
    } else if (totalFiles > 100 || totalSize > 5 * 1024 * 1024) {
      analysisComplexity = 'medium';
    }

    // Определение отзывчивости UI
    const avgInteractionTime = interactionTimes.current.length > 0 
      ? interactionTimes.current.reduce((a, b) => a + b, 0) / interactionTimes.current.length 
      : 0;

    let uiResponsiveness: PerformanceMetrics['uiResponsiveness'] = 'excellent';
    if (avgInteractionTime > 500) {
      uiResponsiveness = 'poor';
    } else if (avgInteractionTime > 200) {
      uiResponsiveness = 'fair';
    } else if (avgInteractionTime > 100) {
      uiResponsiveness = 'good';
    }

    // Генерация рекомендаций
    const recommendations: string[] = [];
    
    if (analysisComplexity === 'extreme') {
      recommendations.push('Рассмотрите фильтрацию файлов для улучшения производительности');
    }
    
    if (uiResponsiveness === 'poor') {
      recommendations.push('UI медленно отвечает - включите виртуализацию списков');
    }
    
    if (metrics.memoryUsage > 100) {
      recommendations.push('Высокое потребление памяти - очистите кэш или перезагрузите страницу');
    }

    if (metrics.errorRate > 0.1) {
      recommendations.push('Высокий уровень ошибок - проверьте данные анализа');
    }

    setMetrics(prev => ({
      ...prev,
      totalFiles,
      totalSize,
      averageFileSize,
      analysisTime,
      analysisComplexity,
      uiResponsiveness,
      interactionLatency: avgInteractionTime,
      errorRate: totalInteractions.current > 0 ? errorCount.current / totalInteractions.current : 0,
      recommendations
    }));

  }, [analysisResult, metrics.memoryUsage, metrics.errorRate]);

  // Функции для отслеживания взаимодействий
  const trackInteraction = useCallback((startTime: number) => {
    const interactionTime = performance.now() - startTime;
    interactionTimes.current.push(interactionTime);
    totalInteractions.current++;
    
    // Храним только последние 50 взаимодействий
    if (interactionTimes.current.length > 50) {
      interactionTimes.current.shift();
    }
  }, []);

  const trackError = useCallback(() => {
    errorCount.current++;
  }, []);

  const resetMetrics = useCallback(() => {
    startTime.current = Date.now();
    interactionTimes.current = [];
    errorCount.current = 0;
    totalInteractions.current = 0;
    setMetrics({
      renderTime: 0,
      memoryUsage: 0,
      analysisTime: 0,
      totalFiles: 0,
      totalSize: 0,
      averageFileSize: 0,
      loadTime: 0,
      interactionLatency: 0,
      cacheHitRate: 0,
      errorRate: 0,
      uiResponsiveness: 'excellent',
      analysisComplexity: 'low',
      recommendations: []
    });
  }, []);

  // Функция для создания отчета о производительности
  const generatePerformanceReport = useCallback(() => {
    return {
      timestamp: new Date().toISOString(),
      metrics,
      browser: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt
      } : null
    };
  }, [metrics]);

  // Performance Observer для более точных измерений
  useEffect(() => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            // Обработка пользовательских измерений
            console.log(`Performance measure: ${entry.name} took ${entry.duration}ms`);
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }

      return () => observer.disconnect();
    }
  }, []);

  return {
    metrics,
    trackInteraction,
    trackError,
    resetMetrics,
    generatePerformanceReport
  };
}

export default usePerformanceMonitor;
