"""
🔍 Интеллектуальная система мониторинга и логирования
Центральная система наблюдения за производительностью MCP Code Analyzer

Архитектурная философия:
- Каждая операция должна быть измерена и зафиксирована
- Система должна предоставлять инсайты для оптимизации
- Логи должны быть структурированными и легко анализируемыми
- Мониторинг не должен значительно влиять на производительность
"""

import time
import asyncio
import logging
import json
import traceback
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from contextlib import asynccontextmanager
from enum import Enum
import psutil
import os
from pathlib import Path

# 📊 Типы событий для детального отслеживания
class EventType(Enum):
    ANALYSIS_START = "analysis_start"
    ANALYSIS_COMPLETE = "analysis_complete" 
    ANALYSIS_ERROR = "analysis_error"
    FILE_SCAN_START = "file_scan_start"
    FILE_SCAN_COMPLETE = "file_scan_complete"
    FILE_ANALYSIS_START = "file_analysis_start"
    FILE_ANALYSIS_COMPLETE = "file_analysis_complete"
    AI_REQUEST_START = "ai_request_start"
    AI_REQUEST_COMPLETE = "ai_request_complete"
    AI_REQUEST_ERROR = "ai_request_error"
    SYSTEM_HEALTH_CHECK = "system_health_check"
    PERFORMANCE_METRIC = "performance_metric"

@dataclass
class PerformanceMetrics:
    """📈 Метрики производительности системы"""
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    active_connections: int
    response_time_ms: float
    timestamp: datetime

@dataclass
class AnalysisEvent:
    """📝 Структурированное событие анализа"""
    event_id: str
    event_type: EventType
    timestamp: datetime
    project_path: Optional[str] = None
    file_path: Optional[str] = None
    duration_ms: Optional[float] = None
    error_message: Optional[str] = None
    error_traceback: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    performance_metrics: Optional[PerformanceMetrics] = None
    user_session_id: Optional[str] = None

class AdvancedAnalyticsLogger:
    """🧠 Интеллектуальная система логирования с аналитикой"""
    
    def __init__(self, log_file: str = "mcp_analyzer_analytics.log"):
        self.log_file = log_file
        self.events: List[AnalysisEvent] = []
        self.active_operations: Dict[str, float] = {}  # operation_id -> start_time
        self.session_stats: Dict[str, Dict] = {}
        
        # 📁 Настройка структурированного логирования
        self.logger = logging.getLogger("mcp_analytics")
        self.logger.setLevel(logging.INFO)
        
        # Создаём файловый handler с JSON форматом
        if not self.logger.handlers:
            handler = logging.FileHandler(log_file, encoding='utf-8')
            formatter = logging.Formatter(
                '%(asctime)s | %(levelname)s | %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            
            # Также выводим в консоль для разработки
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(formatter)
            self.logger.addHandler(console_handler)
    
    def generate_event_id(self) -> str:
        """🆔 Генерация уникального ID для события"""
        return f"evt_{int(time.time() * 1000)}_{len(self.events)}"
    
    def get_system_metrics(self) -> PerformanceMetrics:
        """📊 Сбор текущих метрик системы"""
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return PerformanceMetrics(
            cpu_usage=cpu_percent,
            memory_usage=memory.percent,
            disk_usage=disk.percent,
            active_connections=len(psutil.net_connections()),
            response_time_ms=0.0,  # Будет заполнено при измерении
            timestamp=datetime.now(timezone.utc)
        )
    
    def log_event(self, event: AnalysisEvent):
        """📝 Логирование структурированного события"""
        self.events.append(event)
        
        # Структурированный JSON лог
        log_data = {
            "event_id": event.event_id,
            "event_type": event.event_type.value,
            "timestamp": event.timestamp.isoformat(),
            "project_path": event.project_path,
            "file_path": event.file_path,
            "duration_ms": event.duration_ms,
            "error_message": event.error_message,
            "metadata": event.metadata or {},
            "performance": asdict(event.performance_metrics) if event.performance_metrics else None
        }
        
        self.logger.info(f"EVENT | {json.dumps(log_data, ensure_ascii=False)}")
        
        # 🎯 Обновляем статистику сессии
        if event.user_session_id:
            if event.user_session_id not in self.session_stats:
                self.session_stats[event.user_session_id] = {
                    "start_time": event.timestamp,
                    "events_count": 0,
                    "errors_count": 0,
                    "total_files_analyzed": 0,
                    "total_analysis_time_ms": 0
                }
            
            session = self.session_stats[event.user_session_id]
            session["events_count"] += 1
            
            if "error" in event.event_type.value:
                session["errors_count"] += 1
            
            if event.event_type == EventType.FILE_ANALYSIS_COMPLETE and event.duration_ms:
                session["total_files_analyzed"] += 1
                session["total_analysis_time_ms"] += event.duration_ms
    
    @asynccontextmanager
    async def track_operation(self, 
                            operation_type: EventType, 
                            project_path: Optional[str] = None,
                            file_path: Optional[str] = None,
                            metadata: Optional[Dict] = None,
                            session_id: Optional[str] = None):
        """⏱️ Контекстный менеджер для отслеживания операций с автоматическим измерением времени"""
        
        event_id = self.generate_event_id()
        start_time = time.time()
        start_metrics = self.get_system_metrics()
        
        # 🟢 Логируем начало операции
        start_event = AnalysisEvent(
            event_id=f"{event_id}_start",
            event_type=operation_type,
            timestamp=datetime.now(timezone.utc),
            project_path=project_path,
            file_path=file_path,
            metadata={**(metadata or {}), "operation_phase": "start"},
            performance_metrics=start_metrics,
            user_session_id=session_id
        )
        self.log_event(start_event)
        
        error_occurred = None
        
        try:
            yield event_id
        except Exception as e:
            error_occurred = e
            
            # 🔴 Логируем ошибку
            error_event = AnalysisEvent(
                event_id=f"{event_id}_error",
                event_type=EventType.ANALYSIS_ERROR,
                timestamp=datetime.now(timezone.utc),
                project_path=project_path,
                file_path=file_path,
                error_message=str(e),
                error_traceback=traceback.format_exc(),
                metadata={**(metadata or {}), "operation_phase": "error"},
                user_session_id=session_id
            )
            self.log_event(error_event)
            raise
        finally:
            # ⏹️ Логируем завершение операции
            end_time = time.time()
            duration_ms = (end_time - start_time) * 1000
            end_metrics = self.get_system_metrics()
            end_metrics.response_time_ms = duration_ms
            
            completion_type = EventType.ANALYSIS_ERROR if error_occurred else EventType.ANALYSIS_COMPLETE
            if "file" in operation_type.value:
                completion_type = EventType.FILE_ANALYSIS_COMPLETE
            elif "ai" in operation_type.value:
                completion_type = EventType.AI_REQUEST_COMPLETE
            
            end_event = AnalysisEvent(
                event_id=f"{event_id}_complete",
                event_type=completion_type,
                timestamp=datetime.now(timezone.utc),
                project_path=project_path,
                file_path=file_path,
                duration_ms=duration_ms,
                metadata={
                    **(metadata or {}), 
                    "operation_phase": "complete",
                    "success": error_occurred is None
                },
                performance_metrics=end_metrics,
                user_session_id=session_id
            )
            self.log_event(end_event)
    
    def get_analytics_summary(self, session_id: Optional[str] = None) -> Dict[str, Any]:
        """📊 Получение аналитической сводки"""
        
        if session_id and session_id in self.session_stats:
            return {
                "session_stats": self.session_stats[session_id],
                "session_events": len([e for e in self.events if e.user_session_id == session_id])
            }
        
        # Общая статистика
        total_events = len(self.events)
        error_events = len([e for e in self.events if "error" in e.event_type.value])
        
        # Средняя производительность
        performance_events = [e for e in self.events if e.performance_metrics]
        avg_cpu = sum(e.performance_metrics.cpu_usage for e in performance_events) / len(performance_events) if performance_events else 0
        avg_memory = sum(e.performance_metrics.memory_usage for e in performance_events) / len(performance_events) if performance_events else 0
        
        # Анализ времени выполнения
        duration_events = [e for e in self.events if e.duration_ms]
        avg_duration = sum(e.duration_ms for e in duration_events) / len(duration_events) if duration_events else 0
        
        return {
            "total_events": total_events,
            "error_rate": (error_events / total_events) * 100 if total_events > 0 else 0,
            "average_cpu_usage": avg_cpu,
            "average_memory_usage": avg_memory,
            "average_operation_duration_ms": avg_duration,
            "active_sessions": len(self.session_stats),
            "system_uptime_events": total_events,
            "last_event_time": self.events[-1].timestamp.isoformat() if self.events else None
        }
    
    def health_check(self) -> Dict[str, Any]:
        """🩺 Проверка здоровья системы"""
        current_metrics = self.get_system_metrics()
        
        # Определяем статус здоровья системы
        health_status = "healthy"
        warnings = []
        
        if current_metrics.cpu_usage > 80:
            health_status = "warning"
            warnings.append(f"High CPU usage: {current_metrics.cpu_usage:.1f}%")
        
        if current_metrics.memory_usage > 85:
            health_status = "critical" if health_status != "critical" else health_status
            warnings.append(f"High memory usage: {current_metrics.memory_usage:.1f}%")
        
        if current_metrics.disk_usage > 90:
            health_status = "critical"
            warnings.append(f"High disk usage: {current_metrics.disk_usage:.1f}%")
        
        # Логируем health check
        health_event = AnalysisEvent(
            event_id=self.generate_event_id(),
            event_type=EventType.SYSTEM_HEALTH_CHECK,
            timestamp=datetime.now(timezone.utc),
            metadata={
                "health_status": health_status,
                "warnings": warnings
            },
            performance_metrics=current_metrics
        )
        self.log_event(health_event)
        
        return {
            "status": health_status,
            "warnings": warnings,
            "metrics": asdict(current_metrics),
            "timestamp": health_event.timestamp.isoformat()
        }

# 🌍 Глобальный экземпляр логгера
analytics_logger = AdvancedAnalyticsLogger()

# 🎁 Экспорт основных функций для простого использования
async def track_analysis_operation(operation_type: EventType, **kwargs):
    """🎯 Декоратор для отслеживания операций анализа"""
    return analytics_logger.track_operation(operation_type, **kwargs)

def log_analysis_event(event_type: EventType, **kwargs):
    """📝 Быстрое логирование события"""
    event = AnalysisEvent(
        event_id=analytics_logger.generate_event_id(),
        event_type=event_type,
        timestamp=datetime.now(timezone.utc),
        **kwargs
    )
    analytics_logger.log_event(event)

def get_system_health():
    """🩺 Быстрая проверка здоровья системы"""
    return analytics_logger.health_check()

def get_analytics_summary(session_id: Optional[str] = None):
    """📊 Быстрое получение аналитики"""
    return analytics_logger.get_analytics_summary(session_id)
