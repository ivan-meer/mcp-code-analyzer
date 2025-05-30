"""
OpenAI GPT интеграция для анализа кода.
Реализует базовый AI сервис с использованием OpenAI API.
"""

import asyncio
import time
from typing import Dict, List, Optional, Any
import json
import httpx
from .base_ai_service import BaseAIService, CodeContext, AIResponse, AIServiceError, TokenLimitExceededError

class OpenAIService(BaseAIService):
    """
    Сервис для работы с OpenAI GPT моделями.
    Поддерживает GPT-4, GPT-4 Turbo и GPT-3.5 Turbo.
    """
    
    def __init__(self, api_key: str, model_name: str = "gpt-4-turbo-preview"):
        super().__init__(api_key, model_name)
        self.base_url = "https://api.openai.com/v1"
        self.max_tokens_by_model = {
            "gpt-4": 8192,
            "gpt-4-turbo": 128000,
            "gpt-4-turbo-preview": 128000,
            "gpt-3.5-turbo": 16385,
            "gpt-3.5-turbo-16k": 16385
        }
        
    async def explain_code(self, context: CodeContext, explanation_level: str = "intermediate") -> AIResponse:
        """
        Объяснение кода с использованием GPT.
        
        Использует умный промптинг для создания контекстно-релевантных объяснений
        с учетом уровня сложности и архитектуры проекта.
        """
        start_time = time.time()
        
        try:
            # Строим системный промпт в зависимости от уровня объяснения
            system_prompt = self._build_explanation_prompt(explanation_level)
            
            # Форматируем контекст для AI модели
            user_message = self._format_context_for_ai(context)
            
            # Выполняем запрос к OpenAI
            response = await self._make_api_request([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ])
            
            # Обрабатываем ответ и извлекаем структурированную информацию
            ai_response = self._parse_explanation_response(response)
            ai_response.processing_time = time.time() - start_time
            
            # Обновляем статистику использования
            self.request_count += 1
            self.total_tokens_used += response.get("usage", {}).get("total_tokens", 0)
            
            return ai_response
            
        except Exception as e:
            raise AIServiceError(f"Ошибка при объяснении кода: {str(e)}")
    
    async def suggest_improvements(self, context: CodeContext) -> List[str]:
        """
        Генерация предложений по улучшению кода.
        
        Анализирует код на предмет производительности, читаемости,
        безопасности и соответствия лучшим практикам.
        """
        try:
            system_prompt = self._build_system_prompt("improvement")
            user_message = self._format_context_for_ai(context) + """

ЗАДАЧА: Проанализируйте код и предложите конкретные улучшения в следующих областях:
1. Производительность и оптимизация
2. Читаемость и поддерживаемость кода
3. Безопасность и обработка ошибок
4. Соответствие принципам SOLID и лучшим практикам
5. Архитектурные улучшения

Для каждого предложения укажите:
- Конкретную проблему
- Предлагаемое решение
- Преимущества от внедрения
- Примерный код изменений (если применимо)

Ответ предоставьте в формате JSON:
{
  "improvements": [
    {
      "category": "performance|readability|security|architecture",
      "problem": "описание проблемы",
      "solution": "предлагаемое решение",
      "benefits": "преимущества",
      "code_example": "пример кода (опционально)"
    }
  ]
}
"""
            
            response = await self._make_api_request([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ])
            
            # Извлекаем предложения из ответа
            improvements = self._extract_improvements_from_response(response)
            
            self.request_count += 1
            self.total_tokens_used += response.get("usage", {}).get("total_tokens", 0)
            
            return improvements
            
        except Exception as e:
            raise AIServiceError(f"Ошибка при генерации предложений: {str(e)}")
    
    async def detect_patterns(self, context: CodeContext) -> List[str]:
        """
        Обнаружение архитектурных паттернов и подходов.
        
        Анализирует код для выявления паттернов проектирования,
        архитектурных решений и стилей программирования.
        """
        try:
            system_prompt = self._build_system_prompt("patterns")
            user_message = self._format_context_for_ai(context) + """

ЗАДАЧА: Проанализируйте код и определите:
1. Паттерны проектирования (Design Patterns)
2. Архитектурные подходы (MVC, MVVM, Clean Architecture, etc.)
3. Принципы программирования (SOLID, DRY, KISS, etc.)
4. Стили программирования (функциональный, объектно-ориентированный, etc.)
5. Специфические frameworks и их паттерны

Для каждого обнаруженного паттерна укажите:
- Название паттерна
- Где именно он применяется в коде
- Насколько правильно он реализован
- Возможные альтернативы

Ответ в JSON формате:
{
  "patterns": [
    {
      "name": "название паттерна",
      "type": "design_pattern|architectural_pattern|programming_principle",
      "location": "где применяется",
      "quality": "excellent|good|acceptable|poor",
      "description": "объяснение реализации",
      "alternatives": ["альтернативные подходы"]
    }
  ]
}
"""
            
            response = await self._make_api_request([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ])
            
            patterns = self._extract_patterns_from_response(response)
            
            self.request_count += 1
            self.total_tokens_used += response.get("usage", {}).get("total_tokens", 0)
            
            return patterns
            
        except Exception as e:
            raise AIServiceError(f"Ошибка при обнаружении паттернов: {str(e)}")
    
    async def _make_api_request(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Выполнение HTTP запроса к OpenAI API.
        
        Включает обработку ошибок, ретраи и контроль лимитов токенов.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Оцениваем количество токенов (примерная оценка)
        estimated_tokens = sum(len(msg["content"]) // 4 for msg in messages)
        max_tokens = self.max_tokens_by_model.get(self.model_name, 8192)
        
        if estimated_tokens > max_tokens * 0.8:  # Оставляем запас
            raise TokenLimitExceededError(estimated_tokens, max_tokens)
        
        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.3,  # Низкая температура для более точных ответов
            "max_tokens": min(2000, max_tokens - estimated_tokens),
            "top_p": 0.9,
            "frequency_penalty": 0.1,
            "presence_penalty": 0.1
        }
        
        # Выполняем запрос с ретраями
        for attempt in range(3):
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload
                    )
                    
                    if response.status_code == 200:
                        return response.json()
                    elif response.status_code == 429:  # Rate limit
                        wait_time = 2 ** attempt
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        error_data = response.json() if response.content else {}
                        raise AIServiceError(
                            f"OpenAI API ошибка: {response.status_code} - {error_data.get('error', {}).get('message', 'Неизвестная ошибка')}"
                        )
                        
            except httpx.TimeoutException:
                if attempt == 2:  # Последняя попытка
                    raise AIServiceError("Таймаут при обращении к OpenAI API")
                await asyncio.sleep(2 ** attempt)
            except httpx.RequestError as e:
                raise AIServiceError(f"Ошибка сети при обращении к OpenAI API: {str(e)}")
        
        raise AIServiceError("Не удалось выполнить запрос к OpenAI API после нескольких попыток")
    
    def _build_explanation_prompt(self, level: str) -> str:
        """
        Построение специализированного промпта для объяснения кода.
        """
        base_prompt = self._build_system_prompt("explanation")
        
        level_specific = {
            "beginner": """
            УРОВЕНЬ: Начинающий разработчик
            - Объясняйте базовые концепции подробно
            - Используйте простые аналогии и примеры
            - Избегайте сложной терминологии без объяснения
            - Показывайте связь с фундаментальными принципами программирования
            """,
            
            "intermediate": """
            УРОВЕНЬ: Разработчик среднего уровня
            - Фокусируйтесь на архитектурных решениях и паттернах
            - Объясняйте преимущества и недостатки подходов
            - Указывайте на лучшие практики и их применение
            - Предлагайте альтернативные решения
            """,
            
            "advanced": """
            УРОВЕНЬ: Опытный разработчик
            - Углубляйтесь в тонкости реализации
            - Обсуждайте производительность и оптимизации
            - Анализируйте архитектурные компромиссы
            - Предлагайте продвинутые техники и подходы
            """
        }
        
        return base_prompt + level_specific.get(level, level_specific["intermediate"])
    
    def _parse_explanation_response(self, response: Dict[str, Any]) -> AIResponse:
        """
        Парсинг ответа AI для извлечения структурированной информации.
        """
        try:
            content = response["choices"][0]["message"]["content"]
            
            # Пытаемся извлечь структурированную информацию из ответа
            # Если ответ в JSON формате, парсим его
            try:
                if content.strip().startswith('{'):
                    parsed = json.loads(content)
                    return AIResponse(
                        explanation=parsed.get("explanation", content),
                        concepts=parsed.get("concepts", []),
                        recommendations=parsed.get("recommendations", []),
                        examples=parsed.get("examples", []),
                        confidence_score=parsed.get("confidence", 0.8),
                        processing_time=0.0
                    )
            except json.JSONDecodeError:
                pass
            
            # Если JSON не удался, анализируем текстовый ответ
            concepts = self._extract_concepts_from_text(content)
            recommendations = self._extract_recommendations_from_text(content)
            
            return AIResponse(
                explanation=content,
                concepts=concepts,
                recommendations=recommendations,
                examples=[],
                confidence_score=0.8,
                processing_time=0.0
            )
            
        except (KeyError, IndexError) as e:
            raise AIServiceError(f"Некорректный формат ответа от OpenAI: {str(e)}")
    
    def _extract_concepts_from_text(self, text: str) -> List[str]:
        """
        Извлечение концепций из текстового ответа AI.
        """
        concepts = []
        
        # Ключевые слова для поиска концепций
        concept_keywords = [
            "паттерн", "pattern", "принцип", "principle",
            "архитектура", "architecture", "подход", "approach",
            "методология", "methodology", "техника", "technique"
        ]
        
        lines = text.split('\n')
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in concept_keywords):
                # Очищаем строку и добавляем как концепцию
                cleaned = line.strip(' -•*').strip()
                if cleaned and len(cleaned) < 100:  # Ограничиваем длину
                    concepts.append(cleaned)
        
        return concepts[:10]  # Ограничиваем количество концепций
    
    def _extract_recommendations_from_text(self, text: str) -> List[str]:
        """
        Извлечение рекомендаций из текстового ответа AI.
        """
        recommendations = []
        
        # Ключевые слова для поиска рекомендаций
        recommendation_keywords = [
            "рекомендую", "предлагаю", "стоит", "следует",
            "лучше", "можно улучшить", "совет", "recommendation"
        ]
        
        lines = text.split('\n')
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in recommendation_keywords):
                cleaned = line.strip(' -•*').strip()
                if cleaned and len(cleaned) < 200:
                    recommendations.append(cleaned)
        
        return recommendations[:5]  # Ограничиваем количество рекомендаций
    
    def _extract_improvements_from_response(self, response: Dict[str, Any]) -> List[str]:
        """
        Извлечение предложений по улучшению из ответа AI.
        """
        try:
            content = response["choices"][0]["message"]["content"]
            
            # Пытаемся парсить JSON ответ
            try:
                if '{' in content and '}' in content:
                    # Извлекаем JSON часть
                    start = content.find('{')
                    end = content.rfind('}') + 1
                    json_part = content[start:end]
                    
                    parsed = json.loads(json_part)
                    improvements = parsed.get("improvements", [])
                    
                    return [
                        f"{imp.get('category', 'general').upper()}: {imp.get('problem', '')} -> {imp.get('solution', '')}"
                        for imp in improvements
                    ]
            except json.JSONDecodeError:
                pass
            
            # Fallback: извлекаем улучшения из текста
            return self._extract_recommendations_from_text(content)
            
        except (KeyError, IndexError):
            return []
    
    def _extract_patterns_from_response(self, response: Dict[str, Any]) -> List[str]:
        """
        Извлечение обнаруженных паттернов из ответа AI.
        """
        try:
            content = response["choices"][0]["message"]["content"]
            
            # Пытаемся парсить JSON ответ
            try:
                if '{' in content and '}' in content:
                    start = content.find('{')
                    end = content.rfind('}') + 1
                    json_part = content[start:end]
                    
                    parsed = json.loads(json_part)
                    patterns = parsed.get("patterns", [])
                    
                    return [
                        f"{pattern.get('name', 'Unknown')}: {pattern.get('description', '')}"
                        for pattern in patterns
                    ]
            except json.JSONDecodeError:
                pass
            
            # Fallback: ищем паттерны в тексте
            return self._extract_concepts_from_text(content)
            
        except (KeyError, IndexError):
            return []
