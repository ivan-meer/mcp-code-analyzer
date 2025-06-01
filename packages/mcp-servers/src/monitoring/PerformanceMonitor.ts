/**
 * Система мониторинга производительности
 */

export interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private activeOperations: Map<string, PerformanceMetric> = new Map();

  /**
   * Начинает отслеживание операции
   */
  startOperation(operationId: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      operation: operationId,
      startTime: Date.now(),
      memoryUsage: process.memoryUsage(),
      metadata
    };

    this.activeOperations.set(operationId, metric);
  }

  /**
   * Завершает отслеживание операции
   */
  endOperation(operationId: string): PerformanceMetric | null {
    const metric = this.activeOperations.get(operationId);
    if (!metric) {
      console.warn(`Operation ${operationId} not found`);
      return null;
    }

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;

    this.activeOperations.delete(operationId);
    this.metrics.push(metric);

    return metric;
  }

  /**
   * Обертка для автоматического отслеживания async функций
   */
  async trackOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const operationId = `${operationName}-${Date.now()}-${Math.random()}`;
    
    this.startOperation(operationId, metadata);
    
    try {
      const result = await operation();
      this.endOperation(operationId);
      return result;
    } catch (error) {
      const metric = this.endOperation(operationId);
      if (metric) {
        metric.metadata = { ...metric.metadata, error: String(error) };
      }
      throw error;
    }
  }

  /**
   * Получает статистику по операциям
   */
  getStats(): {
    totalOperations: number;
    averageDuration: number;
    slowestOperation: PerformanceMetric | null;
    fastestOperation: PerformanceMetric | null;
    operationsByType: Record<string, number>;
    memoryTrends: Array<{ time: number; memory: number }>;
  } {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowestOperation: null,
        fastestOperation: null,
        operationsByType: {},
        memoryTrends: []
      };
    }

    const completedMetrics = this.metrics.filter(m => m.duration !== undefined);
    const durations = completedMetrics.map(m => m.duration!);
    
    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    const slowestOperation = completedMetrics.reduce((slowest, current) => 
      (current.duration! > slowest.duration!) ? current : slowest
    );
    
    const fastestOperation = completedMetrics.reduce((fastest, current) => 
      (current.duration! < fastest.duration!) ? current : fastest
    );

    const operationsByType: Record<string, number> = {};
    completedMetrics.forEach(metric => {
      const operationType = metric.operation.split('-')[0];
      operationsByType[operationType] = (operationsByType[operationType] || 0) + 1;
    });

    const memoryTrends = this.metrics
      .filter(m => m.memoryUsage)
      .map(m => ({
        time: m.startTime,
        memory: m.memoryUsage!.heapUsed
      }));

    return {
      totalOperations: completedMetrics.length,
      averageDuration: Math.round(averageDuration),
      slowestOperation,
      fastestOperation,
      operationsByType,
      memoryTrends
    };
  }

  /**
   * Очищает старые метрики (старше указанного времени)
   */
  cleanup(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - maxAgeMs;
    this.metrics = this.metrics.filter(metric => metric.startTime > cutoffTime);
  }

  /**
   * Получает отчет по производительности
   */
  getPerformanceReport(): string {
    const stats = this.getStats();
    
    if (stats.totalOperations === 0) {
      return 'Нет данных о производительности';
    }

    return `📊 **Отчет по производительности**

🔢 **Общая статистика:**
- Всего операций: ${stats.totalOperations}
- Среднее время: ${stats.averageDuration}ms
- Самая медленная: ${stats.slowestOperation?.operation} (${stats.slowestOperation?.duration}ms)
- Самая быстрая: ${stats.fastestOperation?.operation} (${stats.fastestOperation?.duration}ms)

📈 **Операции по типам:**
${Object.entries(stats.operationsByType)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}

💾 **Память:**
- Текущее использование: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
- Максимум за сессию: ${Math.round(Math.max(...stats.memoryTrends.map(t => t.memory)) / 1024 / 1024)}MB`;
  }

  /**
   * Экспортирует метрики в JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      stats: this.getStats(),
      exportTime: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Проверяет, есть ли проблемы с производительностью
   */
  detectPerformanceIssues(): {
    issues: string[];
    severity: 'low' | 'medium' | 'high';
  } {
    const stats = this.getStats();
    const issues: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    // Проверяем среднее время выполнения
    if (stats.averageDuration > 5000) {
      issues.push('Высокое среднее время выполнения операций');
      severity = 'high';
    } else if (stats.averageDuration > 2000) {
      issues.push('Повышенное время выполнения операций');
      severity = 'medium';
    }

    // Проверяем использование памяти
    const currentMemoryMB = process.memoryUsage().heapUsed / 1024 / 1024;
    if (currentMemoryMB > 500) {
      issues.push('Высокое потребление памяти');
      severity = 'high';
    } else if (currentMemoryMB > 200) {
      issues.push('Повышенное потребление памяти');
      if (severity === 'low') severity = 'medium';
    }

    // Проверяем наличие очень медленных операций
    if (stats.slowestOperation && stats.slowestOperation.duration! > 10000) {
      issues.push(`Обнаружена очень медленная операция: ${stats.slowestOperation.operation}`);
      severity = 'high';
    }

    return { issues, severity };
  }
}

/**
 * Глобальный экземпляр монитора производительности
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Декоратор для автоматического отслеживания методов класса
 */
export function trackPerformance(operationName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const name = operationName || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.trackOperation(
        name,
        () => method.apply(this, args),
        { args: args.length }
      );
    };
  };
}
