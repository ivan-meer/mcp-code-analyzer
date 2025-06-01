#!/usr/bin/env python3
# 🧪 Тест оптимизированной системы мониторинга
# Файл: tests/test_monitoring_optimization.py

"""
Тестирование и валидация оптимизированной системы мониторинга.
Сравнение производительности старой и новой системы.
"""

import asyncio
import time
import os
import sys
from pathlib import Path
import statistics
import psutil

# Добавляем корневую директорию в путь
sys.path.append(str(Path(__file__).parent.parent))

from infrastructure.monitoring.core import (
    OptimizedMonitoringSystem, 
    MonitoringConfig, 
    EventType, 
    LogLevel,
    MonitoringEvent
)
from infrastructure.monitoring.migration_adapter import HybridMonitoringSystem
from config.monitoring import get_monitoring_config, ensure_log_directory

class MonitoringPerformanceTest:
    """Класс для тестирования производительности мониторинга"""
    
    def __init__(self):
        self.results = {}
        ensure_log_directory()
    
    def _get_memory_usage(self):
        """Получение текущего потребления памяти в MB"""
        process = psutil.Process()
        return process.memory_info().rss / (1024 * 1024)
    
    async def test_new_system_performance(self, event_count: int = 1000):
        """Тест производительности новой системы"""
        print(f"🚀 Тестирование новой системы ({event_count} событий)...")
        
        config = get_monitoring_config()
        config.enable_console_output = False  # Отключаем консольный вывод для чистого теста
        monitoring = OptimizedMonitoringSystem(config)
        
        # Измеряем время
        start_time = time.time()
        memory_start = self._get_memory_usage()
        
        # Генерируем события
        tasks = []
        for i in range(event_count):
            event = MonitoringEvent(
                event_id=monitoring.generate_event_id(),
                event_type=EventType.PERFORMANCE_SAMPLE,
                timestamp=time.time(),
                metadata={'test_event': i, 'batch': i // 100}
            )
            tasks.append(monitoring.log_event(event))
        
        await asyncio.gather(*tasks)
        
        # Финальная очистка буферов
        await monitoring._flush_events_batch()
        
        end_time = time.time()
        memory_end = self._get_memory_usage()
        
        await monitoring.shutdown()
        
        return {
            'system': 'new',
            'events': event_count,
            'duration': end_time - start_time,
            'events_per_second': event_count / (end_time - start_time),
            'memory_used_mb': memory_end - memory_start,
            'avg_event_time_ms': ((end_time - start_time) / event_count) * 1000
        }
    
    async def test_hybrid_system_performance(self, event_count: int = 1000):
        """Тест производительности гибридной системы"""
        print(f"🔄 Тестирование гибридной системы ({event_count} событий)...")
        
        # Создаем гибридную систему с сравнением
        monitoring = HybridMonitoringSystem(
            use_new_system=True,
            use_old_system=False,  # Отключаем старую для чистого теста
            compare_systems=True,
            environment="testing"
        )
        
        start_time = time.time()
        memory_start = self._get_memory_usage()
        
        # Генерируем события
        for i in range(event_count):
            await monitoring.log_event(
                EventType.FILE_ANALYSIS_COMPLETE,
                file_path=f"/test/file_{i}.py",
                duration_ms=50.0 + (i % 10),
                metadata={'test_iteration': i}
            )
        
        end_time = time.time()
        memory_end = self._get_memory_usage()
        
        # Получаем отчет сравнения
        analytics = monitoring.get_analytics_summary()
        
        await monitoring.shutdown()
        
        return {
            'system': 'hybrid',
            'events': event_count,
            'duration': end_time - start_time,
            'events_per_second': event_count / (end_time - start_time),
            'memory_used_mb': memory_end - memory_start,
            'avg_event_time_ms': ((end_time - start_time) / event_count) * 1000,
            'analytics': analytics
        }
    
    async def run_stress_test(self, concurrent_operations: int = 10, events_per_operation: int = 100):
        """Стресс-тест с параллельными операциями"""
        print(f"💪 Стресс-тест: {concurrent_operations} операций x {events_per_operation} событий...")
        
        monitoring = HybridMonitoringSystem(
            use_new_system=True,
            use_old_system=False,
            environment="testing"
        )
        
        start_time = time.time()
        memory_start = self._get_memory_usage()
        
        # Создаем параллельные операции
        async def simulate_analysis_operation(operation_id: int):
            async with monitoring.track_operation(
                EventType.ANALYSIS_START,
                project_path=f"/test/project_{operation_id}",
                session_id=f"stress_test_{operation_id}"
            ):
                # Симулируем анализ файлов
                for i in range(events_per_operation):
                    await monitoring.log_event(
                        EventType.FILE_ANALYSIS_COMPLETE,
                        file_path=f"/test/project_{operation_id}/file_{i}.py",
                        duration_ms=25.0 + (i % 5),
                        level=LogLevel.DETAILED
                    )
                    
                    # Небольшая задержка для реалистичности
                    await asyncio.sleep(0.001)
        
        # Запускаем все операции параллельно
        tasks = [simulate_analysis_operation(i) for i in range(concurrent_operations)]
        await asyncio.gather(*tasks)
        
        end_time = time.time()
        memory_end = self._get_memory_usage()
        
        total_events = concurrent_operations * events_per_operation
        analytics = monitoring.get_analytics_summary()
        
        await monitoring.shutdown()
        
        return {
            'system': 'stress_test',
            'concurrent_operations': concurrent_operations,
            'events_per_operation': events_per_operation,
            'total_events': total_events,
            'duration': end_time - start_time,
            'events_per_second': total_events / (end_time - start_time),
            'memory_used_mb': memory_end - memory_start,
            'avg_event_time_ms': ((end_time - start_time) / total_events) * 1000,
            'analytics': analytics
        }
    
    def print_results(self, results: dict):
        """Красивый вывод результатов"""
        print(f"\n📊 Результаты теста '{results['system']}':")
        print(f"   ├─ События: {results['events']:,}")
        print(f"   ├─ Время выполнения: {results['duration']:.3f}s")
        print(f"   ├─ События/сек: {results['events_per_second']:.1f}")
        print(f"   ├─ Среднее время события: {results['avg_event_time_ms']:.3f}ms")
        print(f"   └─ Потребление памяти: {results['memory_used_mb']:.2f}MB")
        
        if 'analytics' in results:
            analytics = results['analytics']
            if analytics.get('new_system'):
                new_sys = analytics['new_system']
                print(f"   📈 Буфер событий: {new_sys.get('events_in_buffer', 0)}")
                print(f"   📊 Метрики в буфере: {new_sys.get('metrics_in_buffer', 0)}")

async def main():
    """Главная функция тестирования"""
    print("🧪 Запуск тестов оптимизированной системы мониторинга")
    print("=" * 60)
    
    tester = MonitoringPerformanceTest()
    
    try:
        # Тест 1: Производительность новой системы
        result1 = await tester.test_new_system_performance(1000)
        tester.print_results(result1)
        
        print("\n" + "-" * 40)
        
        # Тест 2: Гибридная система
        result2 = await tester.test_hybrid_system_performance(1000)
        tester.print_results(result2)
        
        print("\n" + "-" * 40)
        
        # Тест 3: Стресс-тест
        result3 = await tester.run_stress_test(5, 200)
        tester.print_results(result3)
        
        # Сравнительный анализ
        print("\n🎯 Сравнительный анализ:")
        print(f"   ├─ Новая система: {result1['events_per_second']:.1f} событий/сек")
        print(f"   ├─ Гибридная система: {result2['events_per_second']:.1f} событий/сек")
        print(f"   └─ Стресс-тест: {result3['events_per_second']:.1f} событий/сек")
        
        performance_improvement = ((result1['events_per_second'] - result2['events_per_second']) / result2['events_per_second']) * 100
        print(f"\n✨ Улучшение производительности: {performance_improvement:+.1f}%")
        
    except Exception as e:
        print(f"❌ Ошибка при тестировании: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
