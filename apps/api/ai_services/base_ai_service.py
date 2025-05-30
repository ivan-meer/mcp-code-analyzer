"""
Base AI Service для интеграции с различными языковыми моделями.
Этот модуль предоставляет абстракцию для работы с OpenAI, Anthropic и другими AI провайдерами.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import json
import logging

# Настройка логирования для отслеживания AI запросов
logger = logging.getLogger(__name__)

@dataclass
class CodeContext:
    """
    Контекст кода для AI анализа.
    Содержит всю необходимую информацию о проекте и конкретном файле.
    """
    file_path: str
    file_content: str
    file_type: str
    project_info: Dict[str, Any]
    dependencies: List[Dict[str, str]]
    functions: List[str]
    imports: List[str]
    architecture_patterns: List[str]
    lines_of_code: int

@dataclass
class AIResponse:
    """
    Стандартизированный ответ от AI сервиса.
    """
    explanation: str
    concepts: List[str]
    recommendations: List[str]
    examples: List[str]
    confidence_score: float
    processing_time: float

class BaseAIService(ABC):
    """
    Абстрактный базовый класс для всех AI сервисов.
    Определяет общий интерфейс для взаимодействия с языковыми моделями.
    """
    
    def __init__(self, api_key: str, model_name: str):
        self.api_key = api_key
        self.model_name = model_name
        self.request_count = 0
        self.total_tokens_used = 0
    
    @abstractmethod
    async def explain_code(self, context: CodeContext, explanation_level: str = "intermediate") -> AIResponse:
        """
        Основной метод для объяснения кода.
        
        Args:
            context: Контекст кода с полной информацией о проекте
            explanation_level: Уровень объяснения (beginner, intermediate, advanced)
        
        Returns:
            AIResponse с объяснением и рекомендациями
        """
        pass
    
    @abstractmethod
    async def suggest_improvements(self, context: CodeContext) -> List[str]:
        """
        Предложения по улучшению кода.
        """
        pass
    
    @abstractmethod
    async def detect_patterns(self, context: CodeContext) -> List[str]:
        """
        Обнаружение паттернов проектирования и архитектурных решений.
        """
        pass
    
    def _build_system_prompt(self, task_type: str) -> str:
        """
        Построение системного промпта в зависимости от типа задачи.
        """
        base_prompt = """Вы - экспертный AI-ассистент для анализа кода и помощи разработчикам. 
        Ваша задача - предоставлять глубокие, практичные и контекстно-релевантные объяснения кода.
        
        Принципы работы:
        1. Анализируйте не только синтаксис, но и семантику и архитектуру
        2. Учитывайте контекст всего проекта при объяснении отдельных частей
        3. Предоставляйте практические рекомендации по улучшению
        4. Объясняйте сложные концепции простым языком
        5. Указывайте на потенциальные проблемы и лучшие практики
        """
        
        task_specific_prompts = {
            "explanation": """
            ЗАДАЧА: Объяснить предоставленный код
            - Начните с общего описания того, что делает код
            - Разберите ключевые концепции и паттерны
            - Объясните важные части построчно, если необходимо
            - Укажите на связи с другими частями проекта
            - Предложите альтернативные подходы, если они существуют
            """,
            
            "improvement": """
            ЗАДАЧА: Предложить улучшения кода
            - Проанализируйте код на предмет производительности
            - Найдите возможности для рефакторинга
            - Укажите на нарушения принципов SOLID или других best practices
            - Предложите конкретные изменения с примерами
            - Оцените влияние предлагаемых изменений
            """,
            
            "patterns": """
            ЗАДАЧА: Обнаружить архитектурные паттерны
            - Определите используемые паттерны проектирования
            - Оцените архитектурные решения
            - Найдите нарушения архитектурных принципов
            - Предложите альтернативные архитектурные подходы
            - Объясните преимущества и недостатки текущего подхода
            """
        }
        
        return base_prompt + task_specific_prompts.get(task_type, "")
    
    def _format_context_for_ai(self, context: CodeContext) -> str:
        """
        Форматирование контекста кода для передачи в AI модель.
        Создает структурированное представление всей доступной информации.
        """
        formatted_context = f"""
ИНФОРМАЦИЯ О ПРОЕКТЕ:
Путь к файлу: {context.file_path}
Тип файла: {context.file_type}
Размер: {context.lines_of_code} строк кода

АРХИТЕКТУРНЫЕ ПАТТЕРНЫ ПРОЕКТА:
{', '.join(context.architecture_patterns) if context.architecture_patterns else 'Не обнаружены'}

ФУНКЦИИ В ФАЙЛЕ:
{', '.join(context.functions) if context.functions else 'Нет функций'}

ИМПОРТЫ И ЗАВИСИМОСТИ:
{', '.join(context.imports) if context.imports else 'Нет импортов'}

СВЯЗИ С ДРУГИМИ ФАЙЛАМИ:
"""
        
        # Добавляем информацию о зависимостях
        if context.dependencies:
            for dep in context.dependencies[:5]:  # Ограничиваем для экономии токенов
                formatted_context += f"- {dep.get('to', 'Неизвестно')} ({dep.get('type', 'import')})\n"
        else:
            formatted_context += "Зависимости не обнаружены\n"
        
        # Добавляем общую информацию о проекте
        if context.project_info:
            formatted_context += f"""
ОБЩАЯ ИНФОРМАЦИЯ О ПРОЕКТЕ:
- Всего файлов: {context.project_info.get('total_files', 'Неизвестно')}
- Всего строк кода: {context.project_info.get('total_lines', 'Неизвестно')}
- Языки программирования: {', '.join(context.project_info.get('languages', []))}
"""
        
        formatted_context += f"""
КОД ДЛЯ АНАЛИЗА:
```{context.file_type}
{context.file_content}
```
"""
        
        return formatted_context
    
    def get_usage_stats(self) -> Dict[str, Any]:
        """
        Получение статистики использования AI сервиса.
        """
        return {
            "model_name": self.model_name,
            "request_count": self.request_count,
            "total_tokens_used": self.total_tokens_used,
            "average_tokens_per_request": self.total_tokens_used / max(1, self.request_count)
        }

class AIServiceError(Exception):
    """
    Исключение для ошибок AI сервиса.
    """
    def __init__(self, message: str, error_code: str = None):
        super().__init__(message)
        self.error_code = error_code

class TokenLimitExceededError(AIServiceError):
    """
    Исключение для превышения лимита токенов.
    """
    def __init__(self, required_tokens: int, available_tokens: int):
        message = f"Требуется {required_tokens} токенов, доступно {available_tokens}"
        super().__init__(message, "TOKEN_LIMIT_EXCEEDED")
        self.required_tokens = required_tokens
        self.available_tokens = available_tokens
