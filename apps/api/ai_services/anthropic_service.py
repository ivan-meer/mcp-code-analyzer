"""
Anthropic Claude интеграция для анализа кода.
Реализует базовый AI сервис с использованием Anthropic API.
"""

import asyncio
import time
from typing import Dict, List, Optional, Any
import json
import httpx
from .base_ai_service import BaseAIService, CodeContext, AIResponse, AIServiceError, TokenLimitExceededError

class AnthropicService(BaseAIService):
    """
    Сервис для работы с Anthropic Claude моделями.
    Поддерживает Claude 3.5 Sonnet, Claude 3 Opus и Claude 3 Haiku.
    """
    
    def __init__(self, api_key: str, model_name: str = "claude-3-5-sonnet-20241022"):
        super().__init__(api_key, model_name)
        self.base_url = "https://api.anthropic.com/v1"
        self.max_tokens_by_model = {
            "claude-3-5-sonnet-20241022": 200000,
            "claude-3-opus-20240229": 200000,
            "claude-3-haiku-20240307": 200000
        }
        
    async def explain_code(self, context: CodeContext, explanation_level: str = "intermediate") -> AIResponse:
        """
        Объяснение кода с использованием Claude.
        
        Claude особенно хорош в детальном анализе кода и объяснении сложных концепций.
        Использует большое контекстное окно для анализа целых файлов.
        """
        start_time = time.time()
        
        try:
            # Строим промпт для Claude
            system_message = self._build_claude_system_prompt(explanation_level)
            user_message = self._format_context_for_claude(context)
            
            # Выполняем запрос к Anthropic
            response = await self._make_api_request(system_message, user_message)
            
            # Обрабатываем ответ Claude
            ai_response = self._parse_claude_response(response)
            ai_response.processing_time = time.time() - start_time
            
            # Обновляем статистику
            self.request_count += 1
            self.total_tokens_used += response.get("usage", {}).get("input_tokens", 0) + response.get("usage", {}).get("output_tokens", 0)
            
            return ai_response
            
        except Exception as e:
            raise AIServiceError(f"Ошибка при объяснении кода через Claude: {str(e)}")
    
    async def suggest_improvements(self, context: CodeContext) -> List[str]:
        """
        Генерация предложений по улучшению кода через Claude.
        
        Claude отлично справляется с анализом архитектуры и предложением
        конкретных улучшений с детальными объяснениями.
        """
        try:
            system_message = """Вы - экспертный архитектор программного обеспечения и ментор для разработчиков. 
            Ваша задача - проанализировать предоставленный код и дать конкретные, практичные рекомендации по улучшению.
            
            Анализируйте код в следующих аспектах:
            1. ПРОИЗВОДИТЕЛЬНОСТЬ: оптимизация алгоритмов, устранение узких мест
            2. ЧИТАЕМОСТЬ: улучшение именования, структуры, комментирования
            3. ПОДДЕРЖИВАЕМОСТЬ: рефакторинг, разделение ответственности
            4. БЕЗОПАСНОСТЬ: уязвимости, валидация данных
            5. АРХИТЕКТУРА: соответствие принципам SOLID, паттернам проектирования
            
            Для каждого предложения укажите:
            - Конкретную проблему
            - Почему это проблема
            - Точное решение с примером кода
            - Ожидаемый результат от изменения"""
            
            user_message = self._format_context_for_claude(context) + """

Проанализируйте этот код и предоставьте конкретные предложения по улучшению. 
Сосредоточьтесь на самых важных улучшениях, которые принесут максимальную пользу.

Формат ответа:
🔧 УЛУЧШЕНИЕ: [Краткое название]
❌ ПРОБЛЕМА: [Что не так сейчас]
✅ РЕШЕНИЕ: [Как исправить]
💡 ПРИМЕР: [Код до/после, если применимо]
📈 РЕЗУЛЬТАТ: [Какую пользу это принесет]

---"""
            
            response = await self._make_api_request(system_message, user_message)
            improvements = self._extract_improvements_from_claude_response(response)
            
            self.request_count += 1
            self.total_tokens_used += response.get("usage", {}).get("input_tokens", 0) + response.get("usage", {}).get("output_tokens", 0)
            
            return improvements
            
        except Exception as e:
            raise AIServiceError(f"Ошибка при генерации предложений через Claude: {str(e)}")
    
    async def detect_patterns(self, context: CodeContext) -> List[str]:
        """
        Обнаружение архитектурных паттернов через Claude.
        
        Claude превосходно анализирует архитектурные решения и может
        выявить как явные, так и неявные паттерны в коде.
        """
        try:
            system_message = """Вы - эксперт по архитектуре программного обеспечения с глубоким пониманием паттернов проектирования.
            Ваша задача - проанализировать код и выявить все используемые архитектурные паттерны и подходы.
            
            Ищите:
            1. Классические паттерны GoF (Singleton, Factory, Observer, Strategy, etc.)
            2. Архитектурные паттерны (MVC, MVP, MVVM, Clean Architecture)
            3. Функциональные паттерны (Higher-Order Functions, Monads, etc.)
            4. Специфичные для технологии паттерны (React Hooks, Decorators, etc.)
            5. Принципы программирования (SOLID, DRY, KISS, YAGNI)
            
            Оценивайте качество реализации каждого паттерна."""
            
            user_message = self._format_context_for_claude(context) + """

Проанализируйте этот код на предмет архитектурных паттернов и принципов проектирования.

Для каждого найденного паттерна укажите:
🏗️ ПАТТЕРН: [Название]
📍 РАСПОЛОЖЕНИЕ: [Где в коде применяется]
⭐ КАЧЕСТВО: [Отлично/Хорошо/Удовлетворительно/Плохо]
📝 ОПИСАНИЕ: [Как реализован]
🔄 АЛЬТЕРНАТИВЫ: [Возможные улучшения или альтернативные подходы]

---"""
            
            response = await self._make_api_request(system_message, user_message)
            patterns = self._extract_patterns_from_claude_response(response)
            
            self.request_count += 1
            self.total_tokens_used += response.get("usage", {}).get("input_tokens", 0) + response.get("usage", {}).get("output_tokens", 0)
            
            return patterns
            
        except Exception as e:
            raise AIServiceError(f"Ошибка при обнаружении паттернов через Claude: {str(e)}")
    
    async def _make_api_request(self, system_message: str, user_message: str) -> Dict[str, Any]:
        """
        Выполнение HTTP запроса к Anthropic API.
        """
        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        # Оценка токенов (Claude использует другую систему подсчета)
        # TODO: Research and integrate official Anthropic client-side token counting if available.
        # Current estimation is a heuristic (len // 3).
        estimated_tokens = (len(system_message) + len(user_message)) // 3
        max_tokens = self.max_tokens_by_model.get(self.model_name, 200000)
        
        if estimated_tokens > max_tokens * 0.8:
            raise TokenLimitExceededError(estimated_tokens, max_tokens)
        
        payload = {
            "model": self.model_name,
            "max_tokens": min(3000, max_tokens - estimated_tokens),
            "system": system_message,
            "messages": [
                {"role": "user", "content": user_message}
            ],
            "temperature": 0.3,
            "top_p": 0.9
        }
        
        # Выполняем запрос с ретраями
        for attempt in range(3):
            try:
                async with httpx.AsyncClient(timeout=90.0) as client:
                    response = await client.post(
                        f"{self.base_url}/messages",
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
                            f"Anthropic API ошибка: {response.status_code} - {error_data.get('error', {}).get('message', 'Неизвестная ошибка')}"
                        )
                        
            except httpx.TimeoutException:
                if attempt == 2:
                    raise AIServiceError("Таймаут при обращении к Anthropic API")
                await asyncio.sleep(2 ** attempt)
            except httpx.RequestError as e:
                raise AIServiceError(f"Ошибка сети при обращении к Anthropic API: {str(e)}")
        
        raise AIServiceError("Не удалось выполнить запрос к Anthropic API после нескольких попыток")
    
    def _build_claude_system_prompt(self, level: str) -> str:
        """
        Построение системного промпта, оптимизированного для Claude.
        """
        base_prompt = """Вы - экспертный AI-ассистент для анализа кода, созданный для помощи разработчикам всех уровней.
        Ваша цель - предоставлять глубокие, практичные и легко понимаемые объяснения кода.
        
        Ваш подход:
        1. Анализируйте код в контексте всего проекта
        2. Объясняйте не только "что", но и "почему" и "как"
        3. Связывайте код с фундаментальными принципами программирования
        4. Предлагайте практические улучшения
        5. Адаптируйте объяснения под уровень аудитории
        
        Структура ответа:
        - Начните с краткого обзора того, что делает код
        - Разберите ключевые концепции и их применение
        - Объясните архитектурные решения
        - Укажите на сильные стороны и области для улучшения
        - Предложите дальнейшие шаги для изучения"""
        
        level_prompts = {
            "beginner": """
            АУДИТОРИЯ: Начинающие разработчики
            - Объясняйте базовые концепции детально
            - Используйте аналогии из повседневной жизни
            - Избегайте сложного жаргона без объяснения
            - Показывайте связь с основами программирования
            - Поощряйте дальнейшее изучение
            """,
            
            "intermediate": """
            АУДИТОРИЯ: Разработчики среднего уровня
            - Фокусируйтесь на архитектурных решениях
            - Обсуждайте компромиссы и альтернативы
            - Связывайте с best practices и паттернами
            - Предлагайте способы улучшения
            - Расширяйте понимание экосистемы
            """,
            
            "advanced": """
            АУДИТОРИЯ: Опытные разработчики
            - Углубляйтесь в нюансы реализации
            - Анализируйте производительность и масштабируемость
            - Обсуждайте архитектурные компромиссы
            - Предлагайте продвинутые оптимизации
            - Рассматривайте влияние на всю систему
            """
        }
        
        return base_prompt + level_prompts.get(level, level_prompts["intermediate"])
    
    def _format_context_for_claude(self, context: CodeContext) -> str:
        """
        Форматирование контекста для Claude с оптимизированной структурой.
        """
        return f"""📁 АНАЛИЗ КОДА

📋 ИНФОРМАЦИЯ О ФАЙЛЕ:
• Путь: {context.file_path}
• Тип: {context.file_type}  
• Размер: {context.lines_of_code} строк

🏗️ КОНТЕКСТ ПРОЕКТА:
• Архитектурные паттерны: {', '.join(context.architecture_patterns) if context.architecture_patterns else 'Не определены'}
• Языки: {', '.join(context.project_info.get('languages', [])) if context.project_info else 'Не определены'}
• Общий размер: {context.project_info.get('total_files', 'Неизвестно')} файлов, {context.project_info.get('total_lines', 'Неизвестно')} строк

🔗 ЗАВИСИМОСТИ:
{chr(10).join([f"• {dep.get('to', 'Неизвестно')} ({dep.get('type', 'import')})" for dep in context.dependencies[:10]]) if context.dependencies else '• Зависимости не обнаружены'}

⚙️ ФУНКЦИИ В ФАЙЛЕ:
{chr(10).join([f"• {func}" for func in context.functions[:15]]) if context.functions else '• Функции не обнаружены'}

📥 ИМПОРТЫ:
{chr(10).join([f"• {imp}" for imp in context.imports[:10]]) if context.imports else '• Импорты не обнаружены'}

💻 КОД ДЛЯ АНАЛИЗА:
```{context.file_type}
{context.file_content}
```"""
    
    def _parse_claude_response(self, response: Dict[str, Any]) -> AIResponse:
        """
        Парсинг ответа от Claude API.
        """
        try:
            content = response["content"][0]["text"]
            
            # Извлекаем концепции и рекомендации из структурированного ответа Claude
            concepts = self._extract_concepts_from_claude_text(content)
            recommendations = self._extract_recommendations_from_claude_text(content)
            examples = self._extract_examples_from_claude_text(content)
            
            return AIResponse(
                explanation=content,
                concepts=concepts,
                recommendations=recommendations,
                examples=examples,
                confidence_score=0.9,  # Claude обычно дает очень качественные ответы
                processing_time=0.0
            )
            
        except (KeyError, IndexError) as e:
            raise AIServiceError(f"Некорректный формат ответа от Claude: {str(e)}")
    
    def _extract_concepts_from_claude_text(self, text: str) -> List[str]:
        """
        Извлечение концепций из ответа Claude.
        """
        concepts = []
        lines = text.split('\n')
        
        for line in lines:
            # Ищем строки с концепциями (обычно Claude выделяет их)
            if any(marker in line for marker in ['**', '•', '-', '*']) and any(keyword in line.lower() for keyword in ['концепция', 'паттерн', 'принцип', 'подход']):
                cleaned = line.strip(' -*•').strip('*').strip()
                if cleaned and len(cleaned) < 100:
                    concepts.append(cleaned)
        
        return concepts[:8]
    
    def _extract_recommendations_from_claude_text(self, text: str) -> List[str]:
        """
        Извлечение рекомендаций из ответа Claude.
        """
        recommendations = []
        lines = text.split('\n')
        
        for line in lines:
            if any(keyword in line.lower() for keyword in ['рекомендую', 'стоит', 'следует', 'можно улучшить', 'предлагаю']):
                cleaned = line.strip(' -*•').strip('*').strip()
                if cleaned and len(cleaned) < 150:
                    recommendations.append(cleaned)
        
        return recommendations[:5]
    
    def _extract_examples_from_claude_text(self, text: str) -> List[str]:
        """
        Извлечение примеров кода из ответа Claude.
        """
        examples = []
        
        # Ищем блоки кода в markdown формате
        import re
        code_blocks = re.findall(r'```[\w]*\n(.*?)\n```', text, re.DOTALL)
        
        for block in code_blocks:
            if block.strip() and len(block) < 500:  # Ограничиваем размер примеров
                examples.append(block.strip())
        
        return examples[:3]
    
    def _extract_improvements_from_claude_response(self, response: Dict[str, Any]) -> List[str]:
        """
        Извлечение улучшений из ответа Claude.
        """
        try:
            content = response["content"][0]["text"]
            improvements = []
            
            # Claude часто структурирует ответы с эмодзи-маркерами
            lines = content.split('\n')
            current_improvement = ""
            
            for line in lines:
                if line.strip().startswith('🔧') or line.strip().startswith('УЛУЧШЕНИЕ'):
                    if current_improvement:
                        improvements.append(current_improvement.strip())
                    current_improvement = line.strip()
                elif current_improvement and line.strip() and not line.startswith('---'):
                    current_improvement += " " + line.strip()
                elif line.startswith('---') and current_improvement:
                    improvements.append(current_improvement.strip())
                    current_improvement = ""
            
            if current_improvement:
                improvements.append(current_improvement.strip())
            
            return improvements[:10]
            
        except (KeyError, IndexError):
            return []
    
    def _extract_patterns_from_claude_response(self, response: Dict[str, Any]) -> List[str]:
        """
        Извлечение паттернов из ответа Claude.
        """
        try:
            content = response["content"][0]["text"]
            patterns = []
            
            lines = content.split('\n')
            current_pattern = ""
            
            for line in lines:
                if line.strip().startswith('🏗️') or line.strip().startswith('ПАТТЕРН'):
                    if current_pattern:
                        patterns.append(current_pattern.strip())
                    current_pattern = line.strip()
                elif current_pattern and line.strip() and not line.startswith('---'):
                    current_pattern += " " + line.strip()
                elif line.startswith('---') and current_pattern:
                    patterns.append(current_pattern.strip())
                    current_pattern = ""
            
            if current_pattern:
                patterns.append(current_pattern.strip())
            
            return patterns[:8]
            
        except (KeyError, IndexError):
            return []
