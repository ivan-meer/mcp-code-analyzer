/**
 * 📊 Performance Monitor для MCP Code Analyzer
 * 
 * Система мониторинга производительности с автоматическим отслеживанием
 * операций и генерацией детальных отчетов.
 */

export interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsed?: number;
  filesProcessed?: number;
  status: 'running' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  summary: {
    totalOperations: number;
    completedOperations: number;
    failedOperations: number;
    averageDuration: number;
    totalDuration: number;
    peakMemoryUsage: number;
  };
  operations: PerformanceMetrics[];
  recommendations: string[];
  bottlenecks: Array<{
    operation: string;
    issue: string;
    impact: 'low' | 'medium' | 'high';
    suggestion: string;
  }>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private completed: PerformanceMetrics[] = [];

  /**
   * Начать отслеживание операции
   */
  startOperation(operation: string, metadata?: Record<string, any>): string {
    const operationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metric: PerformanceMetrics = {
      operation,
      startTime: performance.now(),
      status: 'running',
      metadata
    };

    this.metrics.set(operationId, metric);
    console.log(`📊 [PERF] Started: ${operation} (ID: ${operationId})`);
    
    return operationId;
  }

  /**
   * Завершить отслеживание операции
   */
  endOperation(operationId: string, filesProcessed?: number): void {
    const metric = this.metrics.get(operationId);
    if (!metric) {
      console.warn(`⚠️ [PERF] Operation not found: ${operationId}`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    const memoryUsed = this.getCurrentMemoryUsage();

    const completedMetric: PerformanceMetrics = {
      ...metric,
      endTime,
      duration,
      memoryUsed,
      filesProcessed,
      status: 'completed'
    };

    this.completed.push(completedMetric);
    this.metrics.delete(operationId);

    console.log(`✅ [PERF] Completed: ${metric.operation} in ${duration.toFixed(2)}ms`);
  }

  /**
   * Отметить операцию как неудачную
   */
  failOperation(operationId: string, error?: string): void {
    const metric = this.metrics.get(operationId);
    if (!metric) {
      console.warn(`⚠️ [PERF] Operation not found: ${operationId}`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    const failedMetric: PerformanceMetrics = {
      ...metric,
      endTime,
      duration,
      status: 'failed',
      metadata: { ...metric.metadata, error }
    };

    this.completed.push(failedMetric);
    this.metrics.delete(operationId);

    console.log(`❌ [PERF] Failed: ${metric.operation} after ${duration.toFixed(2)}ms`);
  }

  /**
   * Получить текущее использование памяти
   */
  private getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    // Для browser environment
    if (typeof window !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory?.usedJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * Генерация детального отчета о производительности
   */
  getPerformanceReport(): PerformanceReport {
    const totalOperations = this.completed.length;
    const completedOps = this.completed.filter(m => m.status === 'completed');
    const failedOps = this.completed.filter(m => m.status === 'failed');

    const durations = completedOps.map(m => m.duration || 0);
    const averageDuration = durations.length > 0 ? 
      durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);

    const memoryUsages = this.completed.map(m => m.memoryUsed || 0);
    const peakMemoryUsage = Math.max(...memoryUsages, 0);

    // Анализ узких мест
    const bottlenecks = this.detectBottlenecks(completedOps);
    
    // Рекомендации по оптимизации
    const recommendations = this.generateRecommendations(completedOps, bottlenecks);

    return {
      summary: {
        totalOperations,
        completedOperations: completedOps.length,
        failedOperations: failedOps.length,
        averageDuration,
        totalDuration,
        peakMemoryUsage
      },
      operations: this.completed,
      recommendations,
      bottlenecks
    };
  }

  /**
   * Обнаружение узких мест в производительности
   */
  private detectBottlenecks(operations: PerformanceMetrics[]): Array<{
    operation: string;
    issue: string;
    impact: 'low' | 'medium' | 'high';
    suggestion: string;
  }> {
    const bottlenecks = [];

    // Группировка по типам операций
    const operationGroups = this.groupByOperation(operations);

    for (const [operationType, ops] of operationGroups) {
      const durations = ops.map(op => op.duration || 0);
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);

      // Долгие операции
      if (avgDuration > 5000) { // 5 секунд
        bottlenecks.push({
          operation: operationType,
          issue: `Средняя длительность ${avgDuration.toFixed(0)}ms`,
          impact: avgDuration > 10000 ? 'high' : 'medium',
          suggestion: 'Рассмотрите кеширование или оптимизацию алгоритма'
        });
      }

      // Большой разброс в производительности
      if (maxDuration > avgDuration * 3) {
        bottlenecks.push({
          operation: operationType,
          issue: `Неконсистентная производительность (макс: ${maxDuration.toFixed(0)}ms, среднее: ${avgDuration.toFixed(0)}ms)`,
          impact: 'medium',
          suggestion: 'Проверьте условия выполнения и размер входных данных'
        });
      }

      // Высокое потребление памяти
      const memoryUsages = ops.map(op => op.memoryUsed || 0);
      const avgMemory = memoryUsages.reduce((sum, m) => sum + m, 0) / memoryUsages.length;
      if (avgMemory > 100 * 1024 * 1024) { // 100MB
        bottlenecks.push({
          operation: operationType,
          issue: `Высокое потребление памяти: ${(avgMemory / 1024 / 1024).toFixed(1)}MB`,
          impact: 'high',
          suggestion: 'Оптимизируйте использование памяти, используйте streaming'
        });
      }
    }

    return bottlenecks;
  }

  /**
   * Группировка операций по типу
   */
  private groupByOperation(operations: PerformanceMetrics[]): Map<string, PerformanceMetrics[]> {
    const groups = new Map<string, PerformanceMetrics[]>();

    for (const op of operations) {
      const group = groups.get(op.operation) || [];
      group.push(op);
      groups.set(op.operation, group);
    }

    return groups;
  }

  /**
   * Генерация рекомендаций по оптимизации
   */
  private generateRecommendations(
    operations: PerformanceMetrics[], 
    bottlenecks: any[]
  ): string[] {
    const recommendations = [];

    if (operations.length === 0) {
      return ['Недостаточно данных для анализа. Проведите больше операций.'];
    }

    // Общие рекомендации
    const avgDuration = operations.reduce((sum, op) => sum + (op.duration || 0), 0) / operations.length;
    
    if (avgDuration > 2000) {
      recommendations.push('⚡ Рассмотрите добавление кеширования для часто используемых операций');
    }

    if (bottlenecks.length > 0) {
      recommendations.push('🔍 Обнаружены узкие места в производительности - см. секцию "Bottlenecks"');
    }

    // Рекомендации по памяти
    const memoryUsages = operations.map(op => op.memoryUsed || 0);
    const maxMemory = Math.max(...memoryUsages);
    if (maxMemory > 200 * 1024 * 1024) { // 200MB
      recommendations.push('💾 Высокое потребление памяти - рассмотрите streaming обработку файлов');
    }

    // Рекомендации по количеству файлов
    const fileProcessingOps = operations.filter(op => op.filesProcessed && op.filesProcessed > 0);
    if (fileProcessingOps.length > 0) {
      const avgFilesPerSec = fileProcessingOps.reduce((sum, op) => {
        const duration = (op.duration || 1) / 1000; // в секундах
        return sum + ((op.filesProcessed || 0) / duration);
      }, 0) / fileProcessingOps.length;

      if (avgFilesPerSec < 10) {
        recommendations.push('📁 Низкая скорость обработки файлов - добавьте параллельную обработку');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Производительность в норме! Продолжайте мониторинг.');
    }

    return recommendations;
  }

  /**
   * Очистить собранные метрики
   */
  clear(): void {
    this.metrics.clear();
    this.completed.length = 0;
    console.log('🧹 [PERF] Metrics cleared');
  }

  /**
   * Экспорт метрик в JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      running: Array.from(this.metrics.values()),
      completed: this.completed,
      report: this.getPerformanceReport()
    }, null, 2);
  }
}

// Декоратор для автоматического мониторинга функций
export function trackPerformance(operationName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const operationId = performanceMonitor.startOperation(
        `${operationName || propertyKey}`,
        { 
          className: target.constructor.name,
          method: propertyKey,
          args: args.length 
        }
      );

      try {
        const result = await originalMethod.apply(this, args);
        performanceMonitor.endOperation(operationId);
        return result;
      } catch (error) {
        performanceMonitor.failOperation(operationId, error.message);
        throw error;
      }
    };

    return descriptor;
  };
}

// Глобальный экземпляр монитора
export const performanceMonitor = new PerformanceMonitor();

// Автоматический вывод статистики каждые 30 секунд в dev режиме
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const report = performanceMonitor.getPerformanceReport();
    if (report.summary.totalOperations > 0) {
      console.log('📊 [PERF] Periodic Report:', report.summary);
    }
  }, 30000);
}

export default PerformanceMonitor;
