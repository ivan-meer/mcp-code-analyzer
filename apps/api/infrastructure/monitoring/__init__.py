"""
🚀 Оптимизированная система мониторинга MCP Code Analyzer

Модульная архитектура для высокопроизводительного мониторинга с:
- Конфигурируемыми уровнями логирования
- Батчингом событий
- Автоматическим управлением памятью
- Расширяемой системой экспорта
"""

from .core import (
    OptimizedMonitoringSystem,
    MonitoringConfig,
    EventType,
    LogLevel,
    MonitoringEvent,
    create_monitoring_system
)

from .migration_adapter import (
    HybridMonitoringSystem,
    get_monitoring_system,
    track_analysis_operation,
    log_analysis_event,
    get_system_health,
    get_analytics_summary
)

__all__ = [
    'OptimizedMonitoringSystem',
    'MonitoringConfig', 
    'EventType',
    'LogLevel',
    'MonitoringEvent',
    'create_monitoring_system',
    'HybridMonitoringSystem',
    'get_monitoring_system',
    'track_analysis_operation',
    'log_analysis_event',
    'get_system_health',
    'get_analytics_summary'
]

__version__ = "1.0.0"
