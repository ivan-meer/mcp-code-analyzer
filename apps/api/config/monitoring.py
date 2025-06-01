# 🎛️ Конфигурация мониторинга
# Файл: config/monitoring.py

"""
Централизованная конфигурация системы мониторинга MCP Code Analyzer.
Поддерживает различные окружения и гибкую настройку.
"""

import os
from pathlib import Path
from infrastructure.monitoring.core import MonitoringConfig, LogLevel

def get_environment() -> str:
    """Определение текущего окружения"""
    return os.getenv('ENVIRONMENT', 'development').lower()

def get_base_config() -> MonitoringConfig:
    """Базовая конфигурация мониторинга"""
    return MonitoringConfig(
        log_level=LogLevel[os.getenv('MONITORING_LOG_LEVEL', 'STANDARD')],
        max_events_in_memory=int(os.getenv('MONITORING_MAX_EVENTS', '1000')),
        event_batch_size=int(os.getenv('MONITORING_BATCH_SIZE', '50')),
        metrics_retention_hours=int(os.getenv('MONITORING_RETENTION_HOURS', '24')),
        performance_sample_interval=float(os.getenv('MONITORING_SAMPLE_INTERVAL', '30.0')),
        auto_cleanup_enabled=os.getenv('MONITORING_AUTO_CLEANUP', 'true').lower() == 'true',
        log_file_path=os.getenv('MONITORING_LOG_FILE'),
        enable_console_output=os.getenv('MONITORING_CONSOLE', 'true').lower() == 'true',
        memory_warning_threshold=float(os.getenv('MONITORING_MEMORY_THRESHOLD', '85.0')),
        cpu_warning_threshold=float(os.getenv('MONITORING_CPU_THRESHOLD', '80.0'))
    )

def get_development_config() -> MonitoringConfig:
    """Конфигурация для разработки"""
    config = get_base_config()
    
    # Переопределяем для разработки
    config.log_level = LogLevel.VERBOSE
    config.max_events_in_memory = 500
    config.event_batch_size = 25
    config.performance_sample_interval = 60.0
    config.log_file_path = "logs/mcp_analyzer_dev.log"
    config.enable_console_output = True
    
    return config

def get_production_config() -> MonitoringConfig:
    """Конфигурация для продакшена"""
    config = get_base_config()
    
    # Переопределяем для продакшена
    config.log_level = LogLevel.STANDARD
    config.max_events_in_memory = 2000
    config.event_batch_size = 100
    config.performance_sample_interval = 30.0
    config.log_file_path = "logs/mcp_analyzer_production.log"
    config.enable_console_output = False
    config.auto_cleanup_enabled = True
    
    return config

def get_testing_config() -> MonitoringConfig:
    """Конфигурация для тестирования"""
    config = get_base_config()
    
    # Переопределяем для тестирования
    config.log_level = LogLevel.MINIMAL
    config.max_events_in_memory = 100
    config.event_batch_size = 10
    config.performance_sample_interval = 0  # Отключаем автоматический сбор
    config.log_file_path = None  # Без файлового логирования
    config.enable_console_output = False
    
    return config

def get_monitoring_config() -> MonitoringConfig:
    """Получение конфигурации для текущего окружения"""
    environment = get_environment()
    
    if environment == 'production':
        return get_production_config()
    elif environment == 'testing':
        return get_testing_config()
    else:
        return get_development_config()

def ensure_log_directory():
    """Создание директории для логов если не существует"""
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

# Настройки для гибридной системы
def get_hybrid_monitoring_config() -> dict:
    """Конфигурация для гибридной системы мониторинга"""
    return {
        'use_new_system': os.getenv('MONITORING_USE_NEW', 'true').lower() == 'true',
        'use_old_system': os.getenv('MONITORING_USE_OLD', 'false').lower() == 'true',
        'compare_systems': os.getenv('MONITORING_COMPARE', 'false').lower() == 'true',
        'environment': get_environment()
    }

# Валидация конфигурации
def validate_monitoring_config(config: MonitoringConfig) -> bool:
    """Валидация конфигурации мониторинга"""
    try:
        # Проверяем базовые параметры
        assert config.max_events_in_memory > 0, "max_events_in_memory должно быть больше 0"
        assert config.event_batch_size > 0, "event_batch_size должно быть больше 0"
        assert config.metrics_retention_hours > 0, "metrics_retention_hours должно быть больше 0"
        assert 0 <= config.memory_warning_threshold <= 100, "memory_warning_threshold должно быть 0-100"
        assert 0 <= config.cpu_warning_threshold <= 100, "cpu_warning_threshold должно быть 0-100"
        
        # Проверяем файл логирования
        if config.log_file_path:
            log_path = Path(config.log_file_path)
            log_path.parent.mkdir(parents=True, exist_ok=True)
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка валидации конфигурации мониторинга: {e}")
        return False

# Экспорт основных функций
__all__ = [
    'get_monitoring_config',
    'get_hybrid_monitoring_config', 
    'validate_monitoring_config',
    'ensure_log_directory'
]
