'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Code2, Lightbulb, BookOpen, Play } from 'lucide-react';

interface CodeExplanationProps {
  code?: string;
  language?: string;
  initialExplanation?: string;
}

export function CodeExplanation({ 
  code = '', 
  language = 'javascript',
  initialExplanation = ''
}: CodeExplanationProps) {
  const [inputCode, setInputCode] = useState(code);
  const [explanation, setExplanation] = useState(initialExplanation);
  const [isLoading, setIsLoading] = useState(false);
  const [concepts, setConcepts] = useState<string[]>([]);

  const explainCode = async () => {
    if (!inputCode.trim()) return;

    setIsLoading(true);
    try {
      // В реальном приложении здесь будет вызов AI API
      // Пока создаем mock объяснение
      await new Promise(resolve => setTimeout(resolve, 1500)); // Имитация загрузки
      
      const mockExplanation = generateMockExplanation(inputCode, language);
      const mockConcepts = extractConcepts(inputCode, language);
      
      setExplanation(mockExplanation);
      setConcepts(mockConcepts);
    } catch (error) {
      console.error('Ошибка объяснения кода:', error);
      setExplanation('Извините, произошла ошибка при анализе кода.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockExplanation = (code: string, lang: string): string => {
    const patterns = {
      function: code.includes('function') || code.includes('=>'),
      component: code.includes('Component') || code.includes('return') && code.includes('<'),
      loop: code.includes('for') || code.includes('while') || code.includes('map'),
      conditional: code.includes('if') || code.includes('?'),
      async: code.includes('async') || code.includes('await') || code.includes('Promise'),
      import: code.includes('import') || code.includes('require'),
    };

    let explanation = `Этот ${lang} код выполняет следующие операции:\n\n`;

    if (patterns.component) {
      explanation += "🔹 **React компонент**: Код определяет React-компонент, который возвращает JSX разметку для отображения в интерфейсе.\n\n";
    }
    
    if (patterns.function) {
      explanation += "🔹 **Функция**: Определяется функция для выполнения определенной логики.\n\n";
    }
    
    if (patterns.async) {
      explanation += "🔹 **Асинхронность**: Используются асинхронные операции для работы с данными, которые могут занять время (API запросы, файловые операции).\n\n";
    }
    
    if (patterns.loop) {
      explanation += "🔹 **Циклы/Итерации**: Код перебирает элементы массива или выполняет повторяющиеся операции.\n\n";
    }
    
    if (patterns.conditional) {
      explanation += "🔹 **Условная логика**: Используются условные конструкции для принятия решений в коде.\n\n";
    }
    
    if (patterns.import) {
      explanation += "🔹 **Импорты**: Подключаются внешние модули и библиотеки для расширения функциональности.\n\n";
    }

    explanation += "💡 **Рекомендации по улучшению:**\n";
    explanation += "- Добавьте комментарии для сложных частей кода\n";
    explanation += "- Используйте описательные имена переменных\n";
    explanation += "- Рассмотрите возможность разбиения на более мелкие функции";

    return explanation;
  };

  const extractConcepts = (code: string, lang: string): string[] => {
    const concepts: string[] = [];
    
    if (code.includes('useState') || code.includes('useEffect')) {
      concepts.push('React Hooks');
    }
    if (code.includes('async') || code.includes('await')) {
      concepts.push('Асинхронное программирование');
    }
    if (code.includes('map') || code.includes('filter') || code.includes('reduce')) {
      concepts.push('Функциональное программирование');
    }
    if (code.includes('class') || code.includes('constructor')) {
      concepts.push('Объектно-ориентированное программирование');
    }
    if (code.includes('import') || code.includes('export')) {
      concepts.push('Модульная система');
    }
    if (code.includes('<') && code.includes('>')) {
      concepts.push('JSX');
    }
    if (code.includes('fetch') || code.includes('axios')) {
      concepts.push('HTTP запросы');
    }

    return concepts;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Объяснение кода
          </CardTitle>
          <CardDescription>
            Получите умные объяснения и рекомендации для вашего кода
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Вставьте код для анализа:
            </label>
            <Textarea
              placeholder={`// Пример ${language} кода\nfunction analyzeCode() {\n  return "Привет, мир!";\n}`}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
            />
          </div>

          <Button 
            onClick={explainCode}
            disabled={isLoading || !inputCode.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Brain className="h-4 w-4 mr-2 animate-pulse" />
                Анализирую код...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Объяснить код
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {explanation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Объяснение
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {explanation.split('\n').map((line, index) => (
                <p key={index} className="mb-2">
                  {line}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {concepts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Обнаруженные концепции
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {concepts.map((concept) => (
                <Badge key={concept} variant="secondary" className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900">
                  {concept}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
              💡 Кликните на концепцию, чтобы узнать больше
            </p>
          </CardContent>
        </Card>
      )}

      {/* Примеры кода для изучения */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-green-500" />
            Примеры для изучения
          </CardTitle>
          <CardDescription>
            Попробуйте эти примеры кода для изучения различных концепций
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {[
              {
                title: "React Hook useState",
                code: `const [count, setCount] = useState(0);

const increment = () => {
  setCount(count + 1);
};`
              },
              {
                title: "Асинхронная функция",
                code: `async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ошибка:', error);
  }
}`
              },
              {
                title: "Функциональное программирование",
                code: `const numbers = [1, 2, 3, 4, 5];

const result = numbers
  .filter(n => n % 2 === 0)
  .map(n => n * 2)
  .reduce((sum, n) => sum + n, 0);`
              }
            ].map((example, index) => (
              <div
                key={index}
                className="p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setInputCode(example.code)}
              >
                <div className="font-medium text-sm mb-1">{example.title}</div>
                <code className="text-xs text-slate-600 dark:text-slate-400 block">
                  {example.code.split('\n')[0]}...
                </code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
