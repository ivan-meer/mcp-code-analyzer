'use client';

import React from 'react';
import { 
  Brain, 
  Search, 
  GitBranch, 
  Lightbulb, 
  Target, 
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  gradient: string;
  badge?: string;
}

function FeatureCard({ icon, title, description, features, gradient, badge }: FeatureCardProps) {
  return (
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm hover:from-white/15 hover:to-white/10 transition-all duration-500 hover:scale-105 hover:-translate-y-2">
      {/* Градиентный фон */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
      
      {/* Светящаяся граница */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
      
      <CardContent className="relative p-8">
        {/* Иконка и бейдж */}
        <div className="flex items-start justify-between mb-6">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          {badge && (
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20 text-xs">
              {badge}
            </Badge>
          )}
        </div>
        
        {/* Заголовок и описание */}
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
          {title}
        </h3>
        <p className="text-slate-300 mb-6 leading-relaxed">
          {description}
        </p>
        
        {/* Список возможностей */}
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
              <ArrowRight className="h-3 w-3 mr-2 text-purple-400 group-hover:text-pink-400 transition-colors duration-300" />
              {feature}
            </li>
          ))}
        </ul>
        
        {/* Декоративные элементы */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </CardContent>
    </Card>
  );
}

export function ModernFeaturesGrid() {
  const features = [
    {
      icon: <Brain className="h-6 w-6 text-white" />,
      title: "AI-Объяснения",
      description: "Получите интеллектуальные объяснения вашего кода от GPT-4 и Claude с учетом контекста проекта",
      features: [
        "Персонализированные объяснения",
        "Анализ архитектурных решений", 
        "Обнаружение паттернов проектирования",
        "Рекомендации по улучшению"
      ],
      gradient: "from-purple-600 to-pink-600",
      badge: "AI Powered"
    },
    {
      icon: <Search className="h-6 w-6 text-white" />,
      title: "Глубокий анализ",
      description: "Комплексное исследование структуры кода с выявлением метрик качества и потенциальных проблем",
      features: [
        "Анализ сложности кода",
        "Обнаружение code smells",
        "Метрики производительности",
        "Проверка best practices"
      ],
      gradient: "from-blue-600 to-cyan-600"
    },
    {
      icon: <GitBranch className="h-6 w-6 text-white" />,
      title: "Граф зависимостей",
      description: "Интерактивная визуализация связей между компонентами и модулями вашего проекта",
      features: [
        "3D визуализация связей",
        "Интерактивные узлы",
        "Фильтрация по типам",
        "Экспорт диаграмм"
      ],
      gradient: "from-emerald-600 to-teal-600"
    },
    {
      icon: <Lightbulb className="h-6 w-6 text-white" />,
      title: "Умные предложения",
      description: "AI анализирует ваш код и предлагает конкретные улучшения для повышения качества и производительности",
      features: [
        "Автоматический рефакторинг",
        "Предложения оптимизации",
        "Улучшение читаемости",
        "Современные паттерны"
      ],
      gradient: "from-yellow-600 to-orange-600"
    },
    {
      icon: <Target className="h-6 w-6 text-white" />,
      title: "Code Review",
      description: "Автоматическое рецензирование кода с детальными комментариями и оценкой качества",
      features: [
        "Автоматические комментарии",
        "Оценка качества кода",
        "Проверка безопасности",
        "Соответствие стандартам"
      ],
      gradient: "from-red-600 to-pink-600",
      badge: "Beta"
    },
    {
      icon: <Layers className="h-6 w-6 text-white" />,
      title: "Обучающие модули",
      description: "Персонализированные уроки и объяснения концепций программирования на основе вашего кода",
      features: [
        "Адаптивное обучение",
        "Интерактивные примеры",
        "Прогресс отслеживание",
        "Персональные рекомендации"
      ],
      gradient: "from-indigo-600 to-purple-600"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden">
      {/* Фоновые декоративные элементы */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/6 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/6 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-6 lg:px-8 relative">
        {/* Заголовок секции */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-slate-300">Возможности платформы</span>
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-6 lg:text-5xl">
            Инструменты нового поколения
            <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              для разработчиков
            </span>
          </h2>
          
          <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Объединяем мощь искусственного интеллекта с глубоким анализом кода, 
            чтобы предоставить вам беспрецедентные возможности для понимания и улучшения ваших проектов
          </p>
        </div>
        
        {/* Сетка возможностей */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
        
        {/* Призыв к действию */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <span className="font-semibold">Готовы начать?</span>
            </div>
            <ArrowRight className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
    </section>
  );
}
