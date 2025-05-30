"""
AI Service Factory и Manager для управления различными провайдерами AI.
Обеспечивает единый интерфейс для работы с разными AI сервисами.
"""

import os
import time
from typing import Dict, List, Optional, Any, Union
from enum import Enum
import asyncio
import logging
from .base_ai_service import BaseAIService, CodeContext, AIResponse, AIServiceError
from .openai_service import OpenAIService
from .anthropic_service import AnthropicService

logger = logging.getLogger(__name__)

class AIProvider(Enum):
    """Перечисление доступных AI провайдеров."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    AUTO = "auto"  # Автоматический выбор лучшего провайдера для задачи

class TaskType(Enum):
    """Типы задач для AI анализа."""
    EXPLANATION = "explanation"
    IMPROVEMENT = "improvement"
    PATTERN_DETECTION = "pattern_detection"
    CODE_REVIEW = "code_review"
    LEARNING = "learning"

class AIServiceFactory:
    """
    Фабрика для создания экземпляров AI сервисов.
    """
    
    @staticmethod
    def create_service(provider: AIProvider, api_key: str, model_name: Optional[str] = None) -> BaseAIService:
        """
        Создание экземпляра AI сервиса.
        
        Args:
            provider: Провайдер AI (OpenAI, Anthropic, etc.)
            api_key: API ключ для провайдера
            model_name: Название модели (опционально)
        
        Returns:
            Экземпляр AI сервиса
        """
        if provider == AIProvider.OPENAI:
            model = model_name or "gpt-4-turbo-preview"
            return OpenAIService(api_key, model)
        
        elif provider == AIProvider.ANTHROPIC:
            model = model_name or "claude-3-5-sonnet-20241022"
            return AnthropicService(api_key, model)
        
        else:
            raise ValueError(f"Неподдерживаемый провайдер AI: {provider}")

class AIServiceManager:
    """
    Менеджер для управления несколькими AI сервисами и автоматического выбора.
    Реализует интеллектуальную маршрутизацию запросов к оптимальному провайдеру.
    """
    
    def __init__(self):
        self.services: Dict[AIProvider, BaseAIService] = {}
        self.task_preferences: Dict[TaskType, AIProvider] = {
            # Настройки предпочтений для разных типов задач
            TaskType.EXPLANATION: AIProvider.ANTHROPIC,  # Claude лучше объясняет
            TaskType.IMPROVEMENT: AIProvider.OPENAI,     # GPT-4 хорош в предложениях
            TaskType.PATTERN_DETECTION: AIProvider.ANTHROPIC,  # Claude отлично анализирует паттерны
            TaskType.CODE_REVIEW: AIProvider.ANTHROPIC,  # Детальные обзоры кода
            TaskType.LEARNING: AIProvider.ANTHROPIC      # Обучающие объяснения
        }
        self.fallback_order = [AIProvider.ANTHROPIC, AIProvider.OPENAI]
        
    def add_service(self, provider: AIProvider, api_key: str, model_name: Optional[str] = None):
        """
        Добавление AI сервиса в менеджер.
        """
        try:
            service = AIServiceFactory.create_service(provider, api_key, model_name)
            self.services[provider] = service
            logger.info(f"Добавлен AI сервис: {provider.value} с моделью {service.model_name}")
        except Exception as e:
            logger.error(f"Ошибка при добавлении AI сервиса {provider.value}: {str(e)}")
            raise
    
    def get_service(self, provider: AIProvider) -> Optional[BaseAIService]:
        """
        Получение конкретного AI сервиса.
        """
        return self.services.get(provider)
    
    def get_optimal_service(self, task_type: TaskType, context: CodeContext) -> BaseAIService:
        """
        Выбор оптимального AI сервиса для конкретной задачи.
        
        Args:
            task_type: Тип задачи
            context: Контекст кода для анализа
        
        Returns:
            Оптимальный AI сервис для задачи
        """
        # Проверяем размер контекста для выбора подходящей модели
        content_size = len(context.file_content)
        
        # Для больших файлов предпочитаем модели с большим контекстным окном
        if content_size > 50000:  # Большой файл
            preferred_provider = AIProvider.ANTHROPIC  # Claude имеет больший контекст
        else:
            preferred_provider = self.task_preferences.get(task_type, AIProvider.ANTHROPIC)
        
        # Пытаемся получить предпочтительный сервис
        service = self.services.get(preferred_provider)
        if service:
            return service
        
        # Fallback к доступным сервисам
        for provider in self.fallback_order:
            service = self.services.get(provider)
            if service:
                logger.warning(f"Использование fallback сервиса {provider.value} для задачи {task_type.value}")
                return service
        
        raise AIServiceError("Нет доступных AI сервисов")
    
    async def explain_code_smart(self, context: CodeContext, explanation_level: str = "intermediate") -> AIResponse:
        """
        Интеллектуальное объяснение кода с автоматическим выбором провайдера.
        """
        service = self.get_optimal_service(TaskType.EXPLANATION, context)
        return await service.explain_code(context, explanation_level)
    
    async def suggest_improvements_smart(self, context: CodeContext) -> List[str]:
        """
        Интеллектуальные предложения по улучшению с выбором оптимального провайдера.
        """
        service = self.get_optimal_service(TaskType.IMPROVEMENT, context)
        return await service.suggest_improvements(context)
    
    async def detect_patterns_smart(self, context: CodeContext) -> List[str]:
        """
        Интеллектуальное обнаружение паттернов с выбором оптимального провайдера.
        """
        service = self.get_optimal_service(TaskType.PATTERN_DETECTION, context)
        return await service.detect_patterns(context)
    
    async def comprehensive_analysis(self, context: CodeContext, explanation_level: str = "intermediate") -> Dict[str, Any]:
        """
        Комплексный анализ кода, используя все доступные AI сервисы для получения
        максимально полной картины.
        
        Returns:
            Словарь с результатами всех видов анализа
        """
        results = {}
        
        try:
            # Параллельно выполняем разные виды анализа
            tasks = []
            
            # Объяснение кода
            tasks.append(self._safe_explain_code(context, explanation_level))
            
            # Предложения по улучшению
            tasks.append(self._safe_suggest_improvements(context))
            
            # Обнаружение паттернов
            tasks.append(self._safe_detect_patterns(context))
            
            # Выполняем все задачи параллельно
            explanation_result, improvements_result, patterns_result = await asyncio.gather(*tasks)
            
            results = {
                "explanation": explanation_result,
                "improvements": improvements_result,
                "patterns": patterns_result,
                "analysis_metadata": {
                    "timestamp": time.time(),
                    "file_path": context.file_path,
                    "file_type": context.file_type,
                    "lines_of_code": context.lines_of_code
                }
            }
            
        except Exception as e:
            logger.error(f"Ошибка при комплексном анализе: {str(e)}")
            results["error"] = str(e)
        
        return results
    
    async def _safe_explain_code(self, context: CodeContext, level: str) -> Optional[AIResponse]:
        """Безопасное выполнение объяснения кода с обработкой ошибок."""
        try:
            return await self.explain_code_smart(context, level)
        except Exception as e:
            logger.error(f"Ошибка при объяснении кода: {str(e)}")
            return None
    
    async def _safe_suggest_improvements(self, context: CodeContext) -> List[str]:
        """Безопасное выполнение предложений по улучшению."""
        try:
            return await self.suggest_improvements_smart(context)
        except Exception as e:
            logger.error(f"Ошибка при генерации предложений: {str(e)}")
            return []
    
    async def _safe_detect_patterns(self, context: CodeContext) -> List[str]:
        """Безопасное выполнение обнаружения паттернов."""
        try:
            return await self.detect_patterns_smart(context)
        except Exception as e:
            logger.error(f"Ошибка при обнаружении паттернов: {str(e)}")
            return []
    
    def get_all_usage_stats(self) -> Dict[str, Dict[str, Any]]:
        """
        Получение статистики использования всех AI сервисов.
        """
        stats = {}
        for provider, service in self.services.items():
            stats[provider.value] = service.get_usage_stats()
        return stats
    
    def is_service_available(self, provider: AIProvider) -> bool:
        """
        Проверка доступности AI сервиса.
        """
        return provider in self.services and self.services[provider] is not None

# Глобальный экземпляр менеджера AI сервисов
ai_manager = AIServiceManager()

def initialize_ai_services():
    """
    Инициализация AI сервисов на основе переменных окружения.
    """
    # OpenAI сервис
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if openai_api_key:
        try:
            ai_manager.add_service(AIProvider.OPENAI, openai_api_key)
            logger.info("OpenAI сервис успешно инициализирован")
        except Exception as e:
            logger.error(f"Ошибка при инициализации OpenAI сервиса: {str(e)}")
    
    # Anthropic сервис
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
    if anthropic_api_key:
        try:
            ai_manager.add_service(AIProvider.ANTHROPIC, anthropic_api_key)
            logger.info("Anthropic сервис успешно инициализирован")
        except Exception as e:
            logger.error(f"Ошибка при инициализации Anthropic сервиса: {str(e)}")
    
    # Проверяем, что хотя бы один сервис доступен
    if not any(ai_manager.is_service_available(provider) for provider in AIProvider if provider != AIProvider.AUTO):
        logger.warning("Ни один AI сервис не был успешно инициализирован. Проверьте переменные окружения.")
    
    return ai_manager

def get_ai_manager() -> AIServiceManager:
    """
    Получение глобального экземпляра менеджера AI сервисов.
    """
    return ai_manager
