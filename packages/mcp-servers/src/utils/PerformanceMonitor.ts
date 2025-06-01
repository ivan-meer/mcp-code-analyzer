/**
 * Система мониторинга производительности
 */

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  memoryUsage?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  totalOperations: number;
  averageDuration: number;
  slowestOperation: PerformanceMetric;
  fastestOperation: PerformanceMetric;
  memoryPeak: number;
  recommendations: string[];
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private activeOperations = new Map<string, { startTime: number; startMemory: number }>();

  /**
   * Начинает отслеживание операции
   */
  startOperation(operationName: string): string {
    const operationId = `${operationName}_${Date.now()}_${Math.random()}`;
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    this.activeOperations.set(operationId, { startTime, startMemory });
    return operationId;
  }

  /**
   * Завершает отслеживание операции
   */
  endOperation(operationId: string, metadata?: Record<string, any>): PerformanceMetric | null {
    const operation = this.activeOperations.get(operationId);
    if (!operation) return null;

    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();
    const duration = endTime - operation.startTime;
    const memoryUsage = endMemory - operation.startMemory;

    const metric: PerformanceMetric = {
      operation: operationId.split('_')[0],
      duration,
      timestamp: Date.now(),
      memoryUsage,
      metadata
    };

    this.metrics.push(metric);
    this.activeOperations.delete(operationId);

    // Предупреждение о медленных операциях
    if (duration > 5000) { // > 5 секунд
      console.warn(`⚠️  Медленная операция: ${metric.operation} заняла ${duration.toFixed(2)}ms`);
    }

    return metric;
  }

  /**
   * Декоратор для автоматического мониторинга методов
   */
  static monitor(operationName?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
      const opName = operationName || `${target.constructor.name}.${propertyKey}`;

      descriptor.value = async function (...args: any[]) {
        const monitor = this.performanceMonitor || new PerformanceMonitor();
        const operationId = monitor.startOperation(opName);

        try {
          const result = await originalMethod.apply(this, args);
          monitor.endOperation(operationId, { argsCount: args.length });
          return result;
        } catch (error) {
          monitor.endOperation(operationId, { error: error.message });
          throw error;
        }
      };

      return descriptor;
    };
  }

  /**
   * Создает отчет о производительности
   */
  generateReport(): PerformanceReport {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowestOperation: null as any,
        fastestOperation: null as any,
        memoryPeak: 0,
        recommendations: ['Нет данных для анализа']
      };
    }

    const durations = this.metrics.map(m => m.duration);
    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    const slowestOperation = this.metrics.reduce((prev, current) => 
      (prev.duration > current.duration) ? prev : current
    );
    
    const fastestOperation = this.metrics.reduce((prev, current) => 
      (prev.duration < current.duration) ? prev : current
    );

    const memoryPeak = Math.max(...this.metrics.map(m => m.memoryUsage || 0));

    const recommendations = this.generateRecommendations();

    return {
      totalOperations: this.metrics.length,
      averageDuration,
      slowestOperation,
      fastestOperation,
      memoryPeak,
      recommendations
    };
  }

  /**
   * Генерирует рекомендации по оптимизации
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Анализ медленных операций
    const slowOperations = this.metrics.filter(m => m.duration > 1000);
    if (slowOperations.length > 0) {
      recommendations.push(`🐌 Найдено ${slowOperations.length} медленных операций (>1с). Рассмотрите оптимизацию.`);
    }

    // Анализ потребления памяти
    const highMemoryOps = this.metrics.filter(m => (m.memoryUsage || 0) > 100 * 1024 * 1024); // >100MB
    if (highMemoryOps.length > 0) {
      recommendations.push(`🧠 ${highMemoryOps.length} операций потребляют много памяти. Проверьте утечки.`);
    }

    // Частые операции
    const operationCounts = this.metrics.reduce((acc, m) => {
      acc[m.operation] = (acc[m.operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const frequentOps = Object.entries(operationCounts)
      .filter(([, count]) => count > 10)
      .sort(([, a], [, b]) => b - a);

    if (frequentOps.length > 0) {
      recommendations.push(`🔄 Частые операции: ${frequentOps[0][0]} (${frequentOps[0][1]} раз). Рассмотрите кеширование.`);
    }

    // Общие рекомендации
    if (this.metrics.length > 100) {
      recommendations.push('📊 Большое количество операций. Рассмотрите батчинг и пагинацию.');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Производительность в норме!');
    }

    return recommendations;
  }

  /**
   * Экспортирует метрики в CSV
   */
  exportToCSV(): string {
    const headers = ['Operation', 'Duration (ms)', 'Timestamp', 'Memory Usage (bytes)', 'Metadata'];
    const rows = this.metrics.map(m => [
      m.operation,
      m.duration.toFixed(2),
      new Date(m.timestamp).toISOString(),
      m.memoryUsage?.toString() || '0',
      JSON.stringify(m.metadata || {})
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Очищает старые метрики (старше указанного времени)
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void { // 24 часа по умолчанию
    const cutoff = Date.now() - maxAge;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }

  /**
   * Получает текущее использование памяти
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  /**
   * Получает метрики по типам операций
   */
  getOperationStats(): Record<string, {
    count: number;
    totalDuration: number;
    averageDuration: number;
    maxDuration: number;
    minDuration: number;
  }> {
    const stats: Record<string, any> = {};

    this.metrics.forEach(metric => {
      if (!stats[metric.operation]) {
        stats[metric.operation] = {
          count: 0,
          totalDuration: 0,
          maxDuration: 0,
          minDuration: Infinity
        };
      }

      const stat = stats[metric.operation];
      stat.count++;
      stat.totalDuration += metric.duration;
      stat.maxDuration = Math.max(stat.maxDuration, metric.duration);
      stat.minDuration = Math.min(stat.minDuration, metric.duration);
    });

    // Вычисляем средние значения
    Object.keys(stats).forEach(operation => {
      const stat = stats[operation];
      stat.averageDuration = stat.totalDuration / stat.count;
      if (stat.minDuration === Infinity) stat.minDuration = 0;
    });

    return stats;
  }
}
