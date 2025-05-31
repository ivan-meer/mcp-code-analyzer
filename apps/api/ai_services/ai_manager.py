import os
import time
import re
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
            model = model_name or os.getenv("OPENAI_DEFAULT_MODEL", "gpt-4-turbo-preview")
            return OpenAIService(api_key, model)
        
        elif provider == AIProvider.ANTHROPIC:
            model = model_name or os.getenv("ANTHROPIC_DEFAULT_MODEL", "claude-3-5-sonnet-20241022")
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
            TaskType.EXPLANATION: AIProvider.ANTHROPIC,
            TaskType.IMPROVEMENT: AIProvider.OPENAI,
            TaskType.PATTERN_DETECTION: AIProvider.ANTHROPIC,
            TaskType.CODE_REVIEW: AIProvider.ANTHROPIC,
            TaskType.LEARNING: AIProvider.ANTHROPIC
        }
        self.fallback_order = [AIProvider.ANTHROPIC, AIProvider.OPENAI]
        
    def add_service(self, provider: AIProvider, api_key: str, model_name: Optional[str] = None):
        try:
            service = AIServiceFactory.create_service(provider, api_key, model_name)
            self.services[provider] = service
            logger.info(f"Добавлен AI сервис: {provider.value} с моделью {service.model_name}")
        except Exception as e:
            logger.error(f"Ошибка при добавлении AI сервиса {provider.value}: {str(e)}")
            raise
    
    def get_service(self, provider: AIProvider) -> Optional[BaseAIService]:
        return self.services.get(provider)
    
    def get_optimal_service(self, task_type: TaskType, context: CodeContext) -> BaseAIService:
        content_size = len(context.file_content)
        
        if content_size > 50000:
            preferred_provider = AIProvider.ANTHROPIC
        else:
            preferred_provider = self.task_preferences.get(task_type, AIProvider.ANTHROPIC)
        
        service = self.services.get(preferred_provider)
        if service:
            return service
        
        for provider_option in self.fallback_order: # Renamed to avoid conflict
            service = self.services.get(provider_option)
            if service:
                logger.warning(f"Использование fallback сервиса {provider_option.value} для задачи {task_type.value}")
                return service
        
        raise AIServiceError("Нет доступных AI сервисов")
    
    async def explain_code_smart(self, context: CodeContext, explanation_level: str = "intermediate") -> AIResponse:
        service = self.get_optimal_service(TaskType.EXPLANATION, context)
        return await service.explain_code(context, explanation_level)
    
    async def suggest_improvements_smart(self, context: CodeContext) -> List[str]:
        service = self.get_optimal_service(TaskType.IMPROVEMENT, context)
        return await service.suggest_improvements(context)
    
    async def detect_patterns_smart(self, context: CodeContext) -> List[str]:
        service = self.get_optimal_service(TaskType.PATTERN_DETECTION, context)
        return await service.detect_patterns(context)
    
    async def comprehensive_analysis(self, context: CodeContext, explanation_level: str = "intermediate") -> Dict[str, Any]:
        """
        Комплексный анализ кода, используя все доступные AI сервисы для получения
        максимально полной картины.
        
        Returns:
            Словарь с результатами всех видов анализа
        """
        explanation_result: Optional[AIResponse] = None
        improvements_result: List[str] = []
        patterns_result: List[str] = []
        status_notes_str: str = ""
        final_results: Dict[str, Any] = {}

        try:
            tasks = [
                self._safe_explain_code(context, explanation_level),
                self._safe_suggest_improvements(context),
                self._safe_detect_patterns(context)
            ]
            # The order of results from asyncio.gather matches the order of tasks
            gathered_results = await asyncio.gather(*tasks)
            explanation_result = gathered_results[0]
            improvements_result = gathered_results[1]
            patterns_result = gathered_results[2]

            # Populate status_notes based on results
            if explanation_result is None:
                status_notes_str += "Explanation failed. "
            # Ensure results are lists before checking truthiness, as gather returns them directly
            if not isinstance(improvements_result, list) or not improvements_result:
                status_notes_str += "Improvements task returned no results (may be normal or an error). "
            if not isinstance(patterns_result, list) or not patterns_result:
                status_notes_str += "Patterns task returned no results (may be normal or an error). "
            
            if not status_notes_str: # If empty, all parts presumably succeeded or returned valid empty results
                status_notes_str = "All analysis tasks completed as expected."
            
        except Exception as e:
            logger.error(f"Ошибка при выполнении задач комплексного анализа: {str(e)}")
            status_notes_str += f"Overall analysis error: {str(e)}. "
            # Ensure results are initialized even if gather fails
            explanation_result = explanation_result or None # Keep if already populated
            improvements_result = improvements_result or []
            patterns_result = patterns_result or []


        final_results = {
            "explanation": explanation_result,
            "improvements": improvements_result if isinstance(improvements_result, list) else [],
            "patterns": patterns_result if isinstance(patterns_result, list) else [],
            "analysis_metadata": {
                "timestamp": time.time(),
                "file_path": context.file_path,
                "file_type": context.file_type,
                "lines_of_code": context.lines_of_code,
                "status_notes": status_notes_str.strip()
            }
        }
        return final_results

    async def _safe_explain_code(self, context: CodeContext, level: str) -> Optional[AIResponse]:
        try:
            return await self.explain_code_smart(context, level)
        except Exception as e:
            logger.error(f"Ошибка при объяснении кода: {str(e)}")
            return None
    
    async def _safe_suggest_improvements(self, context: CodeContext) -> List[str]:
        try:
            return await self.suggest_improvements_smart(context)
        except Exception as e:
            logger.error(f"Ошибка при генерации предложений: {str(e)}")
            return []
    
    async def _safe_detect_patterns(self, context: CodeContext) -> List[str]:
        try:
            return await self.detect_patterns_smart(context)
        except Exception as e:
            logger.error(f"Ошибка при обнаружении паттернов: {str(e)}")
            return []
    
    def get_all_usage_stats(self) -> Dict[str, Dict[str, Any]]:
        stats = {}
        for provider, service in self.services.items():
            stats[provider.value] = service.get_usage_stats()
        return stats
    
    def is_service_available(self, provider: AIProvider) -> bool:
        return provider in self.services and self.services[provider] is not None

ai_manager_instance = AIServiceManager() # Renamed from ai_manager to avoid conflict with module name if imported as such

def initialize_ai_services():
    # OpenAI сервис
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if openai_api_key:
        try:
            ai_manager_instance.add_service(AIProvider.OPENAI, openai_api_key)
            logger.info("OpenAI сервис успешно инициализирован")
        except Exception as e:
            logger.error(f"Ошибка при инициализации OpenAI сервиса: {str(e)}")
    
    # Anthropic сервис
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
    if anthropic_api_key:
        try:
            ai_manager_instance.add_service(AIProvider.ANTHROPIC, anthropic_api_key)
            logger.info("Anthropic сервис успешно инициализирован")
        except Exception as e:
            logger.error(f"Ошибка при инициализации Anthropic сервиса: {str(e)}")
    
    if not any(ai_manager_instance.is_service_available(provider) for provider in AIProvider if provider != AIProvider.AUTO):
        logger.warning("Ни один AI сервис не был успешно инициализирован. Проверьте переменные окружения.")
    
    return ai_manager_instance

def get_ai_manager() -> AIServiceManager:
    return ai_manager_instance

# Initialize services on module load, making ai_manager_instance ready.
# initialize_ai_services() # This line might be problematic if env vars are not set during tests or linting.
# It's better to have an explicit init call in the main app startup.
# The original file had `ai_manager = AIServiceManager()` and then `initialize_ai_services()` called elsewhere.
# For now, I will stick to the structure where `get_ai_manager()` returns the instance,
# and `initialize_ai_services()` populates it. The FastAPI startup event calls initialize_ai_services.
