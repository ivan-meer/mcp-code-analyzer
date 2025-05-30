'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface AIService {
  name: string;
  status: 'active' | 'inactive' | 'error';
  requestCount: number;
  totalTokens: number;
  model?: string;
}

interface AIStatusData {
  status: string;
  available_services: string[];
  usage_stats: Record<string, any>;
  total_requests: number;
  total_tokens: number;
}

export function AIStatusCard() {
  const [aiStatus, setAiStatus] = useState<AIStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAIStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-status');
      if (response.ok) {
        const data = await response.json();
        setAiStatus(data);
        setLastUpdated(new Date());
      } else {
        console.error('Failed to fetch AI status');
      }
    } catch (error) {
      console.error('Error fetching AI status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAIStatus();
    
    // Обновляем статус каждые 30 секунд
    const interval = setInterval(fetchAIStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'initialized':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'not_initialized':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'no_services':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'initialized':
        return 'AI сервисы активны';
      case 'not_initialized':
        return 'AI не инициализирован';
      case 'no_services':
        return 'Нет доступных сервисов';
      default:
        return 'Неизвестный статус';
    }
  };

  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'OpenAI GPT';
      case 'anthropic':
        return 'Anthropic Claude';
      default:
        return provider;
    }
  };

  if (isLoading && !aiStatus) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI статус
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2">Загружаем статус AI...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI статус
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAIStatus}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
        <CardDescription>
          Статус AI сервисов для анализа кода
          {lastUpdated && (
            <span className="block text-xs mt-1">
              Обновлено: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Общий статус */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center gap-2">
            {getStatusIcon(aiStatus?.status || 'unknown')}
            <span className="font-medium">
              {getStatusText(aiStatus?.status || 'unknown')}
            </span>
          </div>
          <Badge variant={aiStatus?.status === 'initialized' ? 'default' : 'secondary'}>
            {aiStatus?.available_services?.length || 0} сервисов
          </Badge>
        </div>

        {/* Доступные сервисы */}
        {aiStatus?.available_services && aiStatus.available_services.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Доступные AI провайдеры:</h4>
            <div className="grid gap-2">
              {aiStatus.available_services.map((service) => {
                const stats = aiStatus.usage_stats[service];
                return (
                  <div 
                    key={service}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div>
                      <span className="font-medium">
                        {getProviderDisplayName(service)}
                      </span>
                      {stats?.model_name && (
                        <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                          ({stats.model_name})
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        {stats?.request_count || 0} запросов
                      </div>
                      <div className="text-xs text-slate-500">
                        {(stats?.total_tokens_used || 0).toLocaleString()} токенов
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Общая статистика */}
        {aiStatus?.total_requests > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {aiStatus.total_requests}
              </div>
              <div className="text-sm text-blue-600/80">
                Всего запросов
              </div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {aiStatus.total_tokens.toLocaleString()}
              </div>
              <div className="text-sm text-green-600/80">
                Всего токенов
              </div>
            </div>
          </div>
        )}

        {/* Сообщение если AI недоступен */}
        {aiStatus?.status !== 'initialized' && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>AI функции недоступны.</strong>
              <br />
              Установите переменные окружения OPENAI_API_KEY или ANTHROPIC_API_KEY для активации интеллектуального анализа кода.
            </div>
          </div>
        )}

        {/* Возможности AI */}
        {aiStatus?.status === 'initialized' && (
          <div>
            <h4 className="font-semibold mb-2">Доступные AI возможности:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Объяснение кода
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Предложения улучшений
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Обнаружение паттернов
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Комплексный анализ
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
