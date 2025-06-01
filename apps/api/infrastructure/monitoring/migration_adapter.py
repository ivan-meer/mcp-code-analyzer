# 🔄 Система миграции мониторинга
# Файл: infrastructure/monitoring/migration_adapter.py

"""
Адаптер для плавной миграции от старой системы мониторинга к новой.

Этот модуль обеспечивает:
1. Обратную совместимость с существующим кодом
2. Постепенный переход к новой архитектуре
3. Сравнение производительности двух систем
4. Feature flags для контролируемого внедрения
"""

import os
import asyncio
import logging
from typing import Optional, Dict, Any, Union
from contextlib import asynccontextmanager
from datetime import datetime, timezone

# Импорты из старой системы
try:
    from monitoring_system import (
        analytics_logger as old_logger,
        EventType as OldEventType,
        AnalysisEvent as OldAnalysisEvent,
        track_analysis_operation,
        log_analysis_event,
        get_system_health,
        get_analytics_summary
    )
    OLD_SYSTEM_AVAILABLE = True
except ImportError:
    OLD_SYSTEM_AVAILABLE = False

# Импорты из новой системы
from .core import (
    OptimizedMonitoringSystem,
    MonitoringConfig,
    EventType,
    LogLevel,
    MonitoringEvent,
    create_monitoring_system
)

class EventTypeMapper:
    """Маппинг типов событий между старой и новой системой"""
    
    @staticmethod
    def old_to_new(old_event_type) -> EventType:
        """Преобразование старых типов событий в новые"""
        if not OLD_SYSTEM_AVAILABLE:
            return EventType.ANALYSIS_START
        
        mapping = {
            OldEventType.ANALYSIS_START: EventType.ANALYSIS_START,
            OldEventType.ANALYSIS_COMPLETE: EventType.ANALYSIS_COMPLETE,
            OldEventType.ANALYSIS_ERROR: EventType.ANALYSIS_ERROR,
            OldEventType.FILE_SCAN_START: EventType.FILE_SCAN_START,
            OldEventType.FILE_SCAN_COMPLETE: EventType.FILE_SCAN_COMPLETE,
            OldEventType.FILE_ANALYSIS_START: EventType.FILE_ANALYSIS_START,
            OldEventType.FILE_ANALYSIS_COMPLETE: EventType.FILE_ANALYSIS_COMPLETE,
            OldEventType.AI_REQUEST_START: EventType.AI_REQUEST_START,
            OldEventType.AI_REQUEST_COMPLETE: EventType.AI_REQUEST_COMPLETE,
            OldEventType.AI_REQUEST_ERROR: EventType.AI_REQUEST_ERROR,
            OldEventType.SYSTEM_HEALTH_CHECK: EventType.HEALTH_CHECK,
            OldEventType.PERFORMANCE_METRIC: EventType.PERFORMANCE_SAMPLE,
        }
        
        return mapping.get(old_event_type, EventType.ANALYSIS_START)
    
    @staticmethod
    def new_to_old(new_event_type: EventType):
        """Преобразование новых типов событий в старые"""
        if not OLD_SYSTEM_AVAILABLE:
            return None
        
        reverse_mapping = {
            EventType.ANALYSIS_START: OldEventType.ANALYSIS_START,
            EventType.ANALYSIS_COMPLETE: OldEventType.ANALYSIS_COMPLETE,
            EventType.ANALYSIS_ERROR: OldEventType.ANALYSIS_ERROR,
            EventType.FILE_SCAN_START: OldEventType.FILE_SCAN_START,
            EventType.FILE_SCAN_COMPLETE: OldEventType.FILE_SCAN_COMPLETE,
            EventType.FILE_ANALYSIS_START: OldEventType.FILE_ANALYSIS_START,
            EventType.FILE_ANALYSIS_COMPLETE: OldEventType.FILE_ANALYSIS_COMPLETE,
            EventType.AI_REQUEST_START: OldEventType.AI_REQUEST_START,
            EventType.AI_REQUEST_COMPLETE: OldEventType.AI_REQUEST_COMPLETE,
            EventType.AI_REQUEST_ERROR: OldEventType.AI_REQUEST_ERROR,
            EventType.HEALTH_CHECK: OldEventType.SYSTEM_HEALTH_CHECK,
            EventType.PERFORMANCE_SAMPLE: OldEventType.PERFORMANCE_METRIC,
        }
        
        return reverse_mapping.get(new_event_type)

class HybridMonitoringSystem:
    """
    Гибридная система мониторинга для плавной миграции.
    
    Позволяет:
    - Использовать обе системы параллельно
    - Сравнивать производительность
    - Постепенно переключать функциональность
    - Обеспечивать обратную совместимость
    """
    
    def __init__(self, 
                 use_new_system: bool = True,
                 use_old_system: bool = True,
                 compare_systems: bool = False,
                 environment: str = "development"):
        
        self.use_new_system = use_new_system
        self.use_old_system = use_old_system and OLD_SYSTEM_AVAILABLE
        self.compare_systems = compare_systems
        self.logger = logging.getLogger("hybrid_monitoring")
        
        # Инициализация новой системы
        self.new_system: Optional[OptimizedMonitoringSystem] = None
        if self.use_new_system:
            self.new_system = create_monitoring_system(environment)
            self.logger.info("✅ Новая система мониторинга инициализирована")
        
        # Статистика сравнения
        self.comparison_stats = {
            'events_logged_new': 0,
            'events_logged_old': 0,
            'errors_new': 0,
            'errors_old': 0,
            'performance_new': [],
            'performance_old': []
        }
    
    async def log_event(self, 
                       event_type: Union[EventType, 'OldEventType'],
                       level: LogLevel = LogLevel.STANDARD,
                       **kwargs):
        """Универсальное логирование события в обеих системах"""
        
        # Логируем в новую систему
        if self.use_new_system and self.new_system:
            try:
                start_time = asyncio.get_event_loop().time()
                
                # Преобразуем тип события если нужно
                if OLD_SYSTEM_AVAILABLE and hasattr(event_type, 'value'):
                    new_event_type = EventTypeMapper.old_to_new(event_type)
                else:
                    new_event_type = event_type
                
                # Создаем событие для новой системы
                event = MonitoringEvent(
                    event_id=self.new_system.generate_event_id(),
                    event_type=new_event_type,
                    timestamp=datetime.now(timezone.utc),
                    level=level,
                    **kwargs
                )
                
                await self.new_system.log_event(event)
                
                # Метрики производительности
                if self.compare_systems:
                    duration = asyncio.get_event_loop().time() - start_time
                    self.comparison_stats['performance_new'].append(duration)
                    self.comparison_stats['events_logged_new'] += 1
                    
            except Exception as e:
                self.logger.error(f"Ошибка в новой системе мониторинга: {e}")
                if self.compare_systems:
                    self.comparison_stats['errors_new'] += 1
        
        # Логируем в старую систему
        if self.use_old_system and OLD_SYSTEM_AVAILABLE:
            try:
                start_time = asyncio.get_event_loop().time()
                
                # Преобразуем тип события если нужно
                if isinstance(event_type, EventType):
                    old_event_type = EventTypeMapper.new_to_old(event_type)
                    if old_event_type is None:
                        return  # Событие не поддерживается старой системой
                else:
                    old_event_type = event_type
                
                # Логируем в старую систему
                log_analysis_event(old_event_type, **kwargs)
                
                # Метрики производительности
                if self.compare_systems:
                    duration = asyncio.get_event_loop().time() - start_time
                    self.comparison_stats['performance_old'].append(duration)
                    self.comparison_stats['events_logged_old'] += 1
                    
            except Exception as e:
                self.logger.error(f"Ошибка в старой системе мониторинга: {e}")
                if self.compare_systems:
                    self.comparison_stats['errors_old'] += 1
    
    @asynccontextmanager
    async def track_operation(self, 
                            operation_type: Union[EventType, 'OldEventType'],
                            level: LogLevel = LogLevel.STANDARD,
                            **kwargs):
        """Отслеживание операции в обеих системах"""
        
        # Контекстные менеджеры для обеих систем
        new_context = None
        old_context = None
        
        # Новая система
        if self.use_new_system and self.new_system:
            if isinstance(operation_type, EventType):
                new_event_type = operation_type
            else:
                new_event_type = EventTypeMapper.old_to_new(operation_type)
            
            new_context = self.new_system.track_operation(
                new_event_type, level=level, **kwargs
            )
        
        # Старая система
        if self.use_old_system and OLD_SYSTEM_AVAILABLE:
            if isinstance(operation_type, EventType):
                old_event_type = EventTypeMapper.new_to_old(operation_type)
            else:
                old_event_type = operation_type
            
            if old_event_type:
                old_context = track_analysis_operation(old_event_type, **kwargs)
        
        # Выполняем операцию с обеими системами
        try:
            contexts = []
            if new_context:
                contexts.append(new_context.__aenter__())
            if old_context:
                contexts.append(old_context.__aenter__())
            
            if contexts:
                results = await asyncio.gather(*contexts, return_exceptions=True)
                yield results[0] if results else None
            else:
                yield None
                
        finally:
            # Закрываем контексты
            cleanup_tasks = []
            if new_context:
                cleanup_tasks.append(new_context.__aexit__(None, None, None))
            if old_context:
                cleanup_tasks.append(old_context.__aexit__(None, None, None))
            
            if cleanup_tasks:
                await asyncio.gather(*cleanup_tasks, return_exceptions=True)
    
    def get_analytics_summary(self, session_id: Optional[str] = None) -> Dict[str, Any]:
        """Получение аналитики из обеих систем"""
        summary = {
            'new_system': None,
            'old_system': None,
            'comparison': None
        }
        
        # Аналитика новой системы
        if self.use_new_system and self.new_system:
            try:
                summary['new_system'] = self.new_system.get_analytics_summary(session_id)
            except Exception as e:
                self.logger.error(f"Ошибка получения аналитики новой системы: {e}")
        
        # Аналитика старой системы
        if self.use_old_system and OLD_SYSTEM_AVAILABLE:
            try:
                summary['old_system'] = get_analytics_summary(session_id)
            except Exception as e:
                self.logger.error(f"Ошибка получения аналитики старой системы: {e}")
        
        # Сравнительная аналитика
        if self.compare_systems:
            summary['comparison'] = self._generate_comparison_report()
        
        return summary
    
    def _generate_comparison_report(self) -> Dict[str, Any]:
        """Генерация отчета сравнения систем"""
        stats = self.comparison_stats
        
        # Средняя производительность
        avg_perf_new = (sum(stats['performance_new']) / len(stats['performance_new']) 
                       if stats['performance_new'] else 0)
        avg_perf_old = (sum(stats['performance_old']) / len(stats['performance_old']) 
                       if stats['performance_old'] else 0)
        
        return {
            'events_comparison': {
                'new_system': stats['events_logged_new'],
                'old_system': stats['events_logged_old']
            },
            'error_rates': {
                'new_system': (stats['errors_new'] / max(stats['events_logged_new'], 1)) * 100,
                'old_system': (stats['errors_old'] / max(stats['events_logged_old'], 1)) * 100
            },
            'average_performance_ms': {
                'new_system': avg_perf_new * 1000,
                'old_system': avg_perf_old * 1000
            },
            'performance_improvement': {
                'percentage': ((avg_perf_old - avg_perf_new) / max(avg_perf_old, 0.001)) * 100,
                'faster_system': 'new' if avg_perf_new < avg_perf_old else 'old'
            }
        }
    
    def health_check(self) -> Dict[str, Any]:
        """Проверка здоровья обеих систем"""
        health = {
            'new_system': None,
            'old_system': None,
            'overall_status': 'unknown'
        }
        
        statuses = []
        
        # Здоровье новой системы
        if self.use_new_system and self.new_system:
            try:
                health['new_system'] = {
                    'status': 'healthy',
                    'events_in_buffer': len(self.new_system._events_buffer),
                    'metrics_collection_active': (
                        self.new_system._metrics_task is not None and 
                        not self.new_system._metrics_task.done()
                    )
                }
                statuses.append('healthy')
            except Exception as e:
                health['new_system'] = {'status': 'error', 'error': str(e)}
                statuses.append('error')
        
        # Здоровье старой системы
        if self.use_old_system and OLD_SYSTEM_AVAILABLE:
            try:
                health['old_system'] = get_system_health()
                statuses.append(health['old_system'].get('status', 'unknown'))
            except Exception as e:
                health['old_system'] = {'status': 'error', 'error': str(e)}
                statuses.append('error')
        
        # Общий статус
        if 'error' in statuses:
            health['overall_status'] = 'error'
        elif 'warning' in statuses:
            health['overall_status'] = 'warning'
        elif 'healthy' in statuses:
            health['overall_status'] = 'healthy'
        
        return health
    
    async def shutdown(self):
        """Корректное завершение работы обеих систем"""
        self.logger.info("Завершение работы гибридной системы мониторинга...")
        
        # Завершаем новую систему
        if self.use_new_system and self.new_system:
            await self.new_system.shutdown()
        
        # Генерируем финальный отчет сравнения
        if self.compare_systems:
            final_report = self._generate_comparison_report()
            self.logger.info(f"Финальный отчет сравнения систем: {final_report}")
        
        self.logger.info("Гибридная система мониторинга завершена")

# 🎛️ Конфигурация через переменные окружения
class MonitoringConfigManager:
    """Менеджер конфигурации мониторинга через переменные окружения"""
    
    @staticmethod
    def get_monitoring_config() -> Dict[str, Any]:
        """Получение конфигурации из переменных окружения"""
        return {
            'use_new_system': os.getenv('MONITORING_USE_NEW', 'true').lower() == 'true',
            'use_old_system': os.getenv('MONITORING_USE_OLD', 'true').lower() == 'true',
            'compare_systems': os.getenv('MONITORING_COMPARE', 'false').lower() == 'true',
            'environment': os.getenv('MONITORING_ENV', 'development'),
            'log_level': os.getenv('MONITORING_LOG_LEVEL', 'standard'),
        }
    
    @staticmethod
    def create_monitoring_system() -> HybridMonitoringSystem:
        """Создание системы мониторинга на основе конфигурации"""
        config = MonitoringConfigManager.get_monitoring_config()
        return HybridMonitoringSystem(**config)

# 🔄 Адаптер для обратной совместимости
class CompatibilityAdapter:
    """Адаптер для полной обратной совместимости с существующим кодом"""
    
    def __init__(self, hybrid_system: HybridMonitoringSystem):
        self.hybrid_system = hybrid_system
    
    # Эмуляция старого API
    async def track_operation(self, event_type, **kwargs):
        """Совместимость с track_analysis_operation"""
        return self.hybrid_system.track_operation(event_type, **kwargs)
    
    async def log_event(self, event_type, **kwargs):
        """Совместимость с log_analysis_event"""
        return await self.hybrid_system.log_event(event_type, **kwargs)
    
    def get_system_health(self):
        """Совместимость с get_system_health"""
        health = self.hybrid_system.health_check()
        # Возвращаем в формате старой системы
        return health.get('old_system', health.get('new_system', {'status': 'unknown'}))
    
    def get_analytics_summary(self, session_id=None):
        """Совместимость с get_analytics_summary"""
        summary = self.hybrid_system.get_analytics_summary(session_id)
        # Возвращаем в формате старой системы
        return summary.get('old_system', summary.get('new_system', {}))

# 🌟 Глобальный экземпляр для простоты использования
_global_monitoring_system = None

def get_monitoring_system() -> HybridMonitoringSystem:
    """Получение глобального экземпляра системы мониторинга"""
    global _global_monitoring_system
    if _global_monitoring_system is None:
        _global_monitoring_system = MonitoringConfigManager.create_monitoring_system()
    return _global_monitoring_system

# 🔄 Функции для обратной совместимости (drop-in replacement)
async def track_analysis_operation(event_type, **kwargs):
    """Drop-in replacement для старой функции"""
    system = get_monitoring_system()
    return system.track_operation(event_type, **kwargs)

async def log_analysis_event(event_type, **kwargs):
    """Drop-in replacement для старой функции"""
    system = get_monitoring_system()
    await system.log_event(event_type, **kwargs)

def get_system_health():
    """Drop-in replacement для старой функции"""
    system = get_monitoring_system()
    adapter = CompatibilityAdapter(system)
    return adapter.get_system_health()

def get_analytics_summary(session_id=None):
    """Drop-in replacement для старой функции"""
    system = get_monitoring_system()
    adapter = CompatibilityAdapter(system)
    return adapter.get_analytics_summary(session_id)
