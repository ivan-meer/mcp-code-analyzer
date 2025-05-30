"""
AI Services Package для MCP Code Analyzer.

Этот пакет предоставляет интеграцию с различными AI провайдерами
для интеллектуального анализа и объяснения кода.

Основные компоненты:
- BaseAIService: Абстрактный базовый класс для всех AI сервисов
- OpenAIService: Интеграция с OpenAI GPT моделями  
- AnthropicService: Интеграция с Anthropic Claude моделями
- AIServiceManager: Менеджер для управления и автоматического выбора AI сервисов
- AIServiceFactory: Фабрика для создания экземпляров AI сервисов

Использование:
    from ai_services import get_ai_manager, initialize_ai_services, CodeContext
    
    # Инициализация AI сервисов
    ai_manager = initialize_ai_services()
    
    # Создание контекста кода
    context = CodeContext(
        file_path="example.py",
        file_content="def hello(): print('Hello, World!')",
        file_type="python",
        project_info={},
        dependencies=[],
        functions=["hello"],
        imports=[],
        architecture_patterns=[],
        lines_of_code=1
    )
    
    # Получение объяснения кода
    response = await ai_manager.explain_code_smart(context)
    print(response.explanation)
"""

from .base_ai_service import (
    BaseAIService,
    CodeContext,
    AIResponse,
    AIServiceError,
    TokenLimitExceededError
)

from .openai_service import OpenAIService
from .anthropic_service import AnthropicService

from .ai_manager import (
    AIServiceManager,
    AIServiceFactory,
    AIProvider,
    TaskType,
    ai_manager,
    initialize_ai_services,
    get_ai_manager
)

__all__ = [
    # Базовые классы
    "BaseAIService",
    "CodeContext", 
    "AIResponse",
    "AIServiceError",
    "TokenLimitExceededError",
    
    # Реализации сервисов
    "OpenAIService",
    "AnthropicService",
    
    # Менеджмент и фабрики
    "AIServiceManager",
    "AIServiceFactory",
    "AIProvider",
    "TaskType",
    
    # Глобальные функции и объекты
    "ai_manager",
    "initialize_ai_services", 
    "get_ai_manager"
]

__version__ = "0.1.0"
__author__ = "MCP Code Analyzer Team"
__description__ = "AI integration services for intelligent code analysis"
