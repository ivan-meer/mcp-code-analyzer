# 🚀 Оптимизированная система мониторинга и аналитики
# Файл: infrastructure/monitoring/core.py

"""
Модульная система мониторинга с продвинутой архитектурой.

Ключевые улучшения:
1. Конфигурируемые уровни логирования
2. Оптимизированное управление памятью  
3. Модульная архитектура с возможностью расширения
4. Батчинг событий для производительности
5. Метрики с автоматической ротацией
6. Настраиваемые форматтеры и экспортеры
"""

import asyncio
import json
import time
import logging
from abc import ABC, abstractmethod
from collections import deque, defaultdict
from contextlib import asynccontextmanager
from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone, timedelta
from enum import Enum, auto
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable, Union, Protocol
from threading import Lock
import psutil
import weakref

# 📊 Расширенная система типов событий
class EventType(Enum):
    """Типы событий с автоматической нумерацией"""
    # Системные события
    SYSTEM_START = auto()
    SYSTEM_SHUTDOWN = auto()
    HEALTH_CHECK = auto()
    
    # События анализа
    ANALYSIS_START = auto()
    ANALYSIS_COMPLETE = auto()
    ANALYSIS_ERROR = auto()
    
    # События файлов
    FILE_SCAN_START = auto()
    FILE_SCAN_COMPLETE = auto()
    FILE_ANALYSIS_START = auto()
    FILE_ANALYSIS_COMPLETE = auto()
    
    # AI события
    AI_REQUEST_START = auto()
    AI_REQUEST_COMPLETE = auto()
    AI_REQUEST_ERROR = auto()
    
    # Метрики производительности
    PERFORMANCE_SAMPLE = auto()
    MEMORY_WARNING = auto()
    CPU_WARNING = auto()

class LogLevel(Enum):
    """Уровни детализации логирования"""
    MINIMAL = "minimal"      # Только критичные события
    STANDARD = "standard"    # Стандартные операции
    DETAILED = "detailed"    # Детальная информация
    VERBOSE = "verbose"      # Максимальная детализация
    DEBUG = "debug"          # Отладочная информация

@dataclass
class MonitoringConfig:
    """Конфигурация системы мониторинга"""
    log_level: LogLevel = LogLevel.STANDARD
    max_events_in_memory: int = 1000
    event_batch_size: int = 50
    metrics_retention_hours: int = 24
    performance_sample_interval: float = 30.0
    auto_cleanup_enabled: bool = True
    export_format: str = "json"  # json, csv, prometheus
    log_file_path: Optional[str] = None
    enable_console_output: bool = True
    memory_warning_threshold: float = 85.0
    cpu_warning_threshold: float = 80.0

@dataclass
class PerformanceMetrics:
    """Оптимизированные метрики производительности"""
    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    disk_usage_percent: float
    active_connections: int
    response_time_ms: Optional[float] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Сериализация с оптимизацией памяти"""
        return {
            'ts': self.timestamp.timestamp(),  # Компактный timestamp
            'cpu': round(self.cpu_percent, 2),
            'mem': round(self.memory_percent, 2),
            'mem_mb': round(self.memory_used_mb, 2),
            'disk': round(self.disk_usage_percent, 2),
            'conn': self.active_connections,
            'rt': round(self.response_time_ms, 2) if self.response_time_ms else None
        }

@dataclass
class MonitoringEvent:
    """Легковесное событие мониторинга"""
    event_id: str
    event_type: EventType
    timestamp: datetime
    level: LogLevel = LogLevel.STANDARD
    project_path: Optional[str] = None
    file_path: Optional[str] = None
    duration_ms: Optional[float] = None
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    session_id: Optional[str] = None
    
    def should_log(self, configured_level: LogLevel) -> bool:
        """Определяет, нужно ли логировать событие на заданном уровне"""
        level_hierarchy = {
            LogLevel.MINIMAL: 0,
            LogLevel.STANDARD: 1, 
            LogLevel.DETAILED: 2,
            LogLevel.VERBOSE: 3,
            LogLevel.DEBUG: 4
        }
        return level_hierarchy[self.level] <= level_hierarchy[configured_level]
    
    def to_compact_dict(self) -> Dict[str, Any]:
        """Компактная сериализация для экономии памяти"""
        data = {
            'id': self.event_id,
            'type': self.event_type.name,
            'ts': self.timestamp.timestamp(),
        }
        
        # Добавляем только не-None поля
        if self.project_path:
            data['project'] = self.project_path
        if self.file_path:
            data['file'] = self.file_path
        if self.duration_ms:
            data['duration'] = round(self.duration_ms, 2)
        if self.error_message:
            data['error'] = self.error_message
        if self.metadata:
            data['meta'] = self.metadata
        if self.session_id:
            data['session'] = self.session_id
            
        return data

# 🏭 Абстракции для расширяемости

class EventExporter(Protocol):
    """Протокол для экспорта событий"""
    
    def export_events(self, events: List[MonitoringEvent]) -> bool:
        """Экспорт списка событий"""
        ...
    
    def export_metrics(self, metrics: List[PerformanceMetrics]) -> bool:
        """Экспорт метрик производительности"""
        ...

class EventFormatter(ABC):
    """Базовый класс для форматирования событий"""
    
    @abstractmethod
    def format_event(self, event: MonitoringEvent) -> str:
        """Форматирование одного события"""
        pass
    
    @abstractmethod
    def format_batch(self, events: List[MonitoringEvent]) -> str:
        """Форматирование пакета событий"""
        pass

class JSONFormatter(EventFormatter):
    """JSON форматтер для событий"""
    
    def format_event(self, event: MonitoringEvent) -> str:
        return json.dumps(event.to_compact_dict(), ensure_ascii=False)
    
    def format_batch(self, events: List[MonitoringEvent]) -> str:
        return json.dumps([e.to_compact_dict() for e in events], ensure_ascii=False)

class FileExporter:
    """Экспорт событий в файл с ротацией"""
    
    def __init__(self, log_file_path: str, max_file_size_mb: int = 100):
        self.log_file_path = Path(log_file_path)
        self.max_file_size_bytes = max_file_size_mb * 1024 * 1024
        self.formatter = JSONFormatter()
        
        # Создаем директорию если не существует
        self.log_file_path.parent.mkdir(parents=True, exist_ok=True)
    
    def export_events(self, events: List[MonitoringEvent]) -> bool:
        """Экспорт событий с автоматической ротацией файлов"""
        try:
            # Проверяем размер файла и выполняем ротацию при необходимости
            if self.log_file_path.exists() and self.log_file_path.stat().st_size > self.max_file_size_bytes:
                self._rotate_log_file()
            
            # Записываем события
            with open(self.log_file_path, 'a', encoding='utf-8') as f:
                for event in events:
                    f.write(f"{self.formatter.format_event(event)}\n")
            
            return True
        except Exception as e:
            logging.error(f"Failed to export events to file: {e}")
            return False
    
    def _rotate_log_file(self):
        """Ротация лог файла"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        rotated_name = f"{self.log_file_path.stem}_{timestamp}.log"
        rotated_path = self.log_file_path.parent / rotated_name
        self.log_file_path.rename(rotated_path)

class OptimizedMonitoringSystem:
    """
    Оптимизированная система мониторинга с управлением памятью.
    
    Ключевые особенности:
    - Батчинг событий для снижения нагрузки на I/O
    - Автоматическая очистка старых данных
    - Конфигурируемые уровни детализации
    - Ленивая загрузка метрик
    - Слабые ссылки для предотвращения утечек памяти
    """
    
    def __init__(self, config: MonitoringConfig):
        self.config = config
        self._events_buffer: deque = deque(maxlen=config.max_events_in_memory)
        self._metrics_buffer: deque = deque(maxlen=config.max_events_in_memory // 10)
        self._session_stats: Dict[str, Dict] = {}
        self._active_operations: Dict[str, float] = {}
        self._buffer_lock = Lock()
        self._last_cleanup = time.time()
        self._event_counter = 0
        
        # Настройка экспортеров
        self._exporters: List[EventExporter] = []
        if config.log_file_path:
            self._exporters.append(FileExporter(config.log_file_path))
        
        # Настройка логирования
        self._setup_logging()
        
        # Запуск фонового задания для сбора метрик
        self._metrics_task = None
        if config.performance_sample_interval > 0:
            self._start_metrics_collection()
    
    def _setup_logging(self):
        """Настройка системы логирования"""
        self.logger = logging.getLogger("optimized_monitoring")
        self.logger.setLevel(logging.INFO)
        
        if not self.logger.handlers and self.config.enable_console_output:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s | MONITOR | %(levelname)s | %(message)s',
                datefmt='%H:%M:%S'
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
    
    def _start_metrics_collection(self):
        """Запуск фонового сбора метрик"""
        async def metrics_collector():
            while True:
                try:
                    await asyncio.sleep(self.config.performance_sample_interval)
                    await self._collect_performance_metrics()
                except Exception as e:
                    self.logger.error(f"Error in metrics collection: {e}")
        
        self._metrics_task = asyncio.create_task(metrics_collector())
    
    async def _collect_performance_metrics(self):
        """Сбор метрик производительности"""
        try:
            cpu_percent = psutil.cpu_percent(interval=None)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            metrics = PerformanceMetrics(
                timestamp=datetime.now(timezone.utc),
                cpu_percent=cpu_percent,
                memory_percent=memory.percent,
                memory_used_mb=memory.used / (1024 * 1024),
                disk_usage_percent=disk.percent,
                active_connections=len(psutil.net_connections())
            )
            
            # Проверяем пороговые значения
            if cpu_percent > self.config.cpu_warning_threshold:
                await self.log_event(MonitoringEvent(
                    event_id=self.generate_event_id(),
                    event_type=EventType.CPU_WARNING,
                    timestamp=metrics.timestamp,
                    level=LogLevel.STANDARD,
                    metadata={'cpu_percent': cpu_percent}
                ))
            
            if memory.percent > self.config.memory_warning_threshold:
                await self.log_event(MonitoringEvent(
                    event_id=self.generate_event_id(),
                    event_type=EventType.MEMORY_WARNING,
                    timestamp=metrics.timestamp,
                    level=LogLevel.STANDARD,
                    metadata={'memory_percent': memory.percent}
                ))
            
            # Сохраняем метрики
            with self._buffer_lock:
                self._metrics_buffer.append(metrics)
            
            # Периодическая очистка
            if self.config.auto_cleanup_enabled:
                await self._cleanup_old_data()
                
        except Exception as e:
            self.logger.error(f"Error collecting performance metrics: {e}")
    
    def generate_event_id(self) -> str:
        """Генерация компактного ID события"""
        self._event_counter += 1
        return f"evt_{int(time.time())}{self._event_counter:04d}"
    
    async def log_event(self, event: MonitoringEvent):
        """Асинхронное логирование события с батчингом"""
        # Проверяем уровень логирования
        if not event.should_log(self.config.log_level):
            return
        
        with self._buffer_lock:
            self._events_buffer.append(event)
            
            # Отправляем батч при достижении лимита
            if len(self._events_buffer) >= self.config.event_batch_size:
                await self._flush_events_batch()
    
    async def _flush_events_batch(self):
        """Отправка батча событий экспортерам"""
        if not self._events_buffer:
            return
        
        # Копируем события для экспорта
        events_to_export = list(self._events_buffer)
        self._events_buffer.clear()
        
        # Асинхронный экспорт
        for exporter in self._exporters:
            try:
                exporter.export_events(events_to_export)
            except Exception as e:
                self.logger.error(f"Error exporting events: {e}")
    
    @asynccontextmanager
    async def track_operation(self, 
                            operation_type: EventType,
                            level: LogLevel = LogLevel.STANDARD,
                            **kwargs):
        """Отслеживание операции с измерением времени"""
        
        event_id = self.generate_event_id()
        start_time = time.time()
        
        # Событие начала
        start_event = MonitoringEvent(
            event_id=f"{event_id}_start",
            event_type=operation_type,
            timestamp=datetime.now(timezone.utc),
            level=level,
            **kwargs
        )
        await self.log_event(start_event)
        
        error_occurred = None
        try:
            yield event_id
        except Exception as e:
            error_occurred = e
            # Событие ошибки
            error_event = MonitoringEvent(
                event_id=f"{event_id}_error",
                event_type=EventType.ANALYSIS_ERROR,
                timestamp=datetime.now(timezone.utc),
                level=LogLevel.STANDARD,
                error_message=str(e),
                **kwargs
            )
            await self.log_event(error_event)
            raise
        finally:
            # Событие завершения
            duration_ms = (time.time() - start_time) * 1000
            complete_event = MonitoringEvent(
                event_id=f"{event_id}_complete",
                event_type=EventType.ANALYSIS_COMPLETE,
                timestamp=datetime.now(timezone.utc),
                level=level,
                duration_ms=duration_ms,
                metadata={'success': error_occurred is None},
                **kwargs
            )
            await self.log_event(complete_event)
    
    async def _cleanup_old_data(self):
        """Очистка устаревших данных"""
        current_time = time.time()
        
        # Очищаем только раз в час
        if current_time - self._last_cleanup < 3600:
            return
        
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=self.config.metrics_retention_hours)
        
        with self._buffer_lock:
            # Очищаем старые метрики
            while (self._metrics_buffer and 
                   self._metrics_buffer[0].timestamp < cutoff_time):
                self._metrics_buffer.popleft()
        
        self._last_cleanup = current_time
        self.logger.info(f"Cleanup completed. Metrics retained: {len(self._metrics_buffer)}")
    
    def get_analytics_summary(self, session_id: Optional[str] = None) -> Dict[str, Any]:
        """Быстрое получение аналитической сводки"""
        with self._buffer_lock:
            total_events = len(self._events_buffer)
            total_metrics = len(self._metrics_buffer)
        
        # Последние метрики
        latest_metrics = None
        if self._metrics_buffer:
            latest_metrics = self._metrics_buffer[-1].to_dict()
        
        return {
            'events_in_buffer': total_events,
            'metrics_in_buffer': total_metrics,
            'latest_metrics': latest_metrics,
            'config': {
                'log_level': self.config.log_level.value,
                'max_events': self.config.max_events_in_memory,
                'retention_hours': self.config.metrics_retention_hours
            },
            'system_info': {
                'active_exporters': len(self._exporters),
                'metrics_collection_active': self._metrics_task is not None and not self._metrics_task.done()
            }
        }
    
    async def shutdown(self):
        """Корректное завершение работы системы"""
        self.logger.info("Shutting down monitoring system...")
        
        # Останавливаем сбор метрик
        if self._metrics_task:
            self._metrics_task.cancel()
            try:
                await self._metrics_task
            except asyncio.CancelledError:
                pass
        
        # Сбрасываем оставшиеся события
        await self._flush_events_batch()
        
        self.logger.info("Monitoring system shutdown complete")

# 🎛️ Фабрика для создания настроенной системы мониторинга
class MonitoringFactory:
    """Фабрика для создания предустановленных конфигураций мониторинга"""
    
    @staticmethod
    def create_development_monitoring(log_file: Optional[str] = None) -> OptimizedMonitoringSystem:
        """Конфигурация для разработки"""
        config = MonitoringConfig(
            log_level=LogLevel.VERBOSE,
            max_events_in_memory=500,
            event_batch_size=25,
            performance_sample_interval=60.0,
            log_file_path=log_file,
            enable_console_output=True
        )
        return OptimizedMonitoringSystem(config)
    
    @staticmethod
    def create_production_monitoring(log_file: str) -> OptimizedMonitoringSystem:
        """Конфигурация для продакшена"""
        config = MonitoringConfig(
            log_level=LogLevel.STANDARD,
            max_events_in_memory=2000,
            event_batch_size=100,
            performance_sample_interval=30.0,
            log_file_path=log_file,
            enable_console_output=False,
            auto_cleanup_enabled=True
        )
        return OptimizedMonitoringSystem(config)
    
    @staticmethod
    def create_minimal_monitoring() -> OptimizedMonitoringSystem:
        """Минимальная конфигурация"""
        config = MonitoringConfig(
            log_level=LogLevel.MINIMAL,
            max_events_in_memory=100,
            event_batch_size=50,
            performance_sample_interval=0,  # Отключаем автоматический сбор
            enable_console_output=False
        )
        return OptimizedMonitoringSystem(config)

# 🌟 Интеграция с существующим кодом
def create_monitoring_system(environment: str = "development") -> OptimizedMonitoringSystem:
    """
    Главная функция для создания системы мониторинга.
    
    Args:
        environment: development, production, minimal
    
    Returns:
        Настроенная система мониторинга
    """
    if environment == "production":
        return MonitoringFactory.create_production_monitoring("logs/mcp_analyzer.log")
    elif environment == "minimal":
        return MonitoringFactory.create_minimal_monitoring()
    else:
        return MonitoringFactory.create_development_monitoring("logs/mcp_analyzer_dev.log")
