# 🔄 Патч для интеграции оптимизированного мониторинга в main.py
# Файл: patches/monitoring_integration_patch.py

"""
Патч для постепенной интеграции оптимизированной системы мониторинга.
Обеспечивает обратную совместимость и плавный переход.
"""

# =================== ДОБАВИТЬ В НАЧАЛО main.py ===================

# 🚀 Импорты для оптимизированного мониторинга
import os
from datetime import datetime, timezone

# Импорт новой системы мониторинга
try:
    from infrastructure.monitoring.migration_adapter import (
        get_monitoring_system,
        HybridMonitoringSystem,
        EventType as NewEventType,
        LogLevel
    )
    from config.monitoring import get_hybrid_monitoring_config, ensure_log_directory
    OPTIMIZED_MONITORING_AVAILABLE = True
except ImportError:
    OPTIMIZED_MONITORING_AVAILABLE = False
    print("⚠️ Оптимизированная система мониторинга недоступна, используется старая система")

# =================== ЗАМЕНИТЬ СЕКЦИЮ ИНИЦИАЛИЗАЦИИ ===================

# СТАРЫЙ КОД (закомментировать):
# from monitoring_system import (
#     analytics_logger,
#     track_analysis_operation,
#     log_analysis_event,
#     get_system_health,
#     get_analytics_summary,
#     EventType
# )

# НОВЫЙ КОД:
# Инициализация системы мониторинга с автоматическим выбором
if OPTIMIZED_MONITORING_AVAILABLE:
    # Создаем оптимизированную систему
    ensure_log_directory()
    monitoring_config = get_hybrid_monitoring_config()
    optimized_monitoring = get_monitoring_system()
    
    # Определяем, какую систему использовать
    USE_OPTIMIZED_MONITORING = monitoring_config.get('use_new_system', True)
    COMPARE_MONITORING_SYSTEMS = monitoring_config.get('compare_systems', False)
    
    print(f"🚀 Система мониторинга инициализирована:")
    print(f"   └─ Оптимизированная система: {'✅' if monitoring_config.get('use_new_system') else '❌'}")
    print(f"   └─ Старая система: {'✅' if monitoring_config.get('use_old_system') else '❌'}")
    print(f"   └─ Сравнение систем: {'✅' if COMPARE_MONITORING_SYSTEMS else '❌'}")
    
    # Алиасы для обратной совместимости
    if USE_OPTIMIZED_MONITORING:
        # Используем новую систему через адаптер
        analytics_logger = optimized_monitoring
        track_analysis_operation = optimized_monitoring.track_operation
        
        async def log_analysis_event(event_type, **kwargs):
            await optimized_monitoring.log_event(event_type, **kwargs)
        
        def get_system_health():
            health = optimized_monitoring.health_check()
            return health.get('new_system', health.get('old_system', {'status': 'unknown'}))
        
        def get_analytics_summary(session_id=None):
            summary = optimized_monitoring.get_analytics_summary(session_id)
            return summary.get('new_system', summary.get('old_system', {}))
        
        # Используем новые типы событий
        EventType = NewEventType
    else:
        # Fallback к старой системе
        from monitoring_system import (
            analytics_logger,
            track_analysis_operation,
            log_analysis_event,
            get_system_health,
            get_analytics_summary,
            EventType
        )
else:
    # Используем старую систему как fallback
    from monitoring_system import (
        analytics_logger,
        track_analysis_operation,
        log_analysis_event,
        get_system_health,
        get_analytics_summary,
        EventType
    )
    USE_OPTIMIZED_MONITORING = False
    COMPARE_MONITORING_SYSTEMS = False

# =================== МОДИФИКАЦИЯ STARTUP EVENT ===================

# ЗАМЕНИТЬ startup_event:
@app.on_event("startup")
async def startup_event():
    global ai_manager
    
    # Инициализация базы данных
    init_database()
    
    # Инициализация AI сервисов
    try:
        ai_manager = initialize_ai_services()
        if ai_manager.services:
            logger.info(f"🤖 AI сервисы инициализированы: {list(ai_manager.services.keys())}")
        else:
            logger.warning("⚠️ AI сервисы не настроены. Установите OPENAI_API_KEY или ANTHROPIC_API_KEY в переменных окружения.")
    except Exception as e:
        logger.error(f"❌ Ошибка инициализации AI сервисов: {str(e)}")
        ai_manager = None
    
    # Логирование старта системы в новую систему мониторинга
    if OPTIMIZED_MONITORING_AVAILABLE and USE_OPTIMIZED_MONITORING:
        await log_analysis_event(
            EventType.SYSTEM_START,
            metadata={
                "startup_time": datetime.now(timezone.utc).isoformat(),
                "ai_services_available": ai_manager is not None,
                "monitoring_system": "optimized" if USE_OPTIMIZED_MONITORING else "legacy"
            }
        )
    
    print("🚀 MCP Code Analyzer API с оптимизированным мониторингом запущен!")
    print("📖 Документация: http://localhost:8000/docs")
    print("🤖 AI статус: http://localhost:8000/api/ai-status")
    if OPTIMIZED_MONITORING_AVAILABLE:
        print("📊 Мониторинг: http://localhost:8000/api/monitoring/health-optimized")

# =================== ДОБАВИТЬ НОВЫЕ ENDPOINTS ===================

# Добавить в конец файла перед if __name__ == "__main__":

@app.get("/api/monitoring/health-optimized")
async def get_optimized_monitoring_health():
    """Получение статуса оптимизированной системы мониторинга"""
    if not OPTIMIZED_MONITORING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Оптимизированная система мониторинга недоступна")
    
    try:
        health = optimized_monitoring.health_check()
        
        return {
            "optimized_monitoring_available": True,
            "health": health,
            "configuration": {
                "use_optimized": USE_OPTIMIZED_MONITORING,
                "compare_systems": COMPARE_MONITORING_SYSTEMS
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения статуса мониторинга: {str(e)}")

@app.get("/api/monitoring/comparison")
async def get_monitoring_comparison():
    """Получение отчета сравнения систем мониторинга"""
    if not (OPTIMIZED_MONITORING_AVAILABLE and COMPARE_MONITORING_SYSTEMS):
        raise HTTPException(
            status_code=404, 
            detail="Сравнение систем мониторинга не активно. Установите MONITORING_COMPARE=true"
        )
    
    try:
        analytics = optimized_monitoring.get_analytics_summary()
        comparison = analytics.get('comparison')
        
        if not comparison:
            return {
                "message": "Данные сравнения еще не накоплены",
                "suggestion": "Выполните несколько операций анализа для получения статистики"
            }
        
        return {
            "comparison_report": comparison,
            "analytics": {
                "new_system": analytics.get('new_system'),
                "old_system": analytics.get('old_system')
            },
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения сравнения: {str(e)}")

@app.post("/api/monitoring/switch-system")
async def switch_monitoring_system(use_optimized: bool):
    """Переключение между системами мониторинга"""
    if not OPTIMIZED_MONITORING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Оптимизированная система мониторинга недоступна")
    
    global USE_OPTIMIZED_MONITORING
    USE_OPTIMIZED_MONITORING = use_optimized
    
    # Устанавливаем переменную окружения для постоянства
    os.environ['MONITORING_USE_NEW'] = 'true' if use_optimized else 'false'
    
    return {
        "message": f"Система мониторинга переключена на {'оптимизированную' if use_optimized else 'старую'}",
        "current_system": "optimized" if use_optimized else "legacy",
        "restart_required": False,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# =================== SHUTDOWN EVENT ===================

# Добавить shutdown event для корректного завершения:
@app.on_event("shutdown")
async def shutdown_event():
    """Корректное завершение работы системы"""
    if OPTIMIZED_MONITORING_AVAILABLE and USE_OPTIMIZED_MONITORING:
        try:
            await log_analysis_event(
                EventType.SYSTEM_SHUTDOWN,
                metadata={
                    "shutdown_time": datetime.now(timezone.utc).isoformat(),
                    "monitoring_system": "optimized"
                }
            )
            await optimized_monitoring.shutdown()
            logger.info("✅ Оптимизированная система мониторинга корректно завершена")
        except Exception as e:
            logger.error(f"❌ Ошибка при завершении мониторинга: {str(e)}")

# =================== ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ ===================

# Добавить в .env или установить переменные окружения:
"""
# Конфигурация оптимизированного мониторинга
MONITORING_USE_NEW=true
MONITORING_USE_OLD=false
MONITORING_COMPARE=true
MONITORING_ENV=development
MONITORING_LOG_LEVEL=STANDARD
MONITORING_MAX_EVENTS=1000
MONITORING_BATCH_SIZE=50
MONITORING_SAMPLE_INTERVAL=30.0
MONITORING_AUTO_CLEANUP=true
MONITORING_LOG_FILE=logs/mcp_analyzer_optimized.log
MONITORING_CONSOLE=true
MONITORING_MEMORY_THRESHOLD=85.0
MONITORING_CPU_THRESHOLD=80.0
"""

# =================== ИНСТРУКЦИИ ПО ПРИМЕНЕНИЮ ===================

"""
Пошаговое применение патча:

1. Создать резервную копию main.py:
   cp main.py main.py.backup

2. Добавить импорты в начало main.py (после существующих импортов)

3. Закомментировать старые импорты мониторинга и добавить новые

4. Заменить startup_event на новую версию

5. Добавить новые endpoints перед if __name__ == "__main__"

6. Добавить shutdown_event

7. Установить переменные окружения

8. Запустить тест:
   python tests/test_monitoring_optimization.py

9. Запустить приложение и проверить:
   - http://localhost:8000/api/monitoring/health-optimized
   - http://localhost:8000/api/monitoring/comparison

10. Мониторинг переключения:
    curl -X POST "http://localhost:8000/api/monitoring/switch-system?use_optimized=true"
"""
