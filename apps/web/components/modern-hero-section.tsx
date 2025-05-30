'use client';

import React from 'react';
import { Brain, Code2, Sparkles, Zap, ArrowRight, Github, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function ModernHeroSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Фоновые декоративные элементы */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      {/* Сетка в фоне */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:50px_50px]"></div>
      
      <div className="relative px-6 lg:px-8">
        <div className="mx-auto max-w-4xl pt-20 pb-32 sm:pt-32 sm:pb-40">
          {/* Верхний бейдж */}
          <div className="mb-8 flex justify-center">
            <div className="relative rounded-full px-4 py-2 text-sm leading-6 text-slate-300 ring-1 ring-white/10 hover:ring-white/20 transition-all duration-300 backdrop-blur-sm bg-white/5">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                Powered by AI • OpenAI & Anthropic
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
          
          {/* Главный заголовок */}
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              <span className="block">MCP Code</span>
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Analyzer
              </span>
            </h1>
            
            <p className="mt-6 text-lg leading-8 text-slate-300 max-w-2xl mx-auto">
              Превратите ваш код в интерактивную визуализацию с AI-объяснениями. 
              Анализируйте архитектуру, находите паттерны и получайте умные рекомендации 
              для улучшения качества кода.
            </p>
            
            {/* Кнопки действий */}
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold shadow-2xl shadow-purple-500/25 transition-all duration-300 hover:scale-105"
              >
                <Brain className="h-5 w-5 mr-2" />
                Начать анализ
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg backdrop-blur-sm transition-all duration-300 hover:scale-105"
              >
                <Github className="h-5 w-5 mr-2" />
                GitHub
              </Button>
            </div>
            
            {/* Статистики */}
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="text-center group">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform duration-300">
                  <Code2 className="h-8 w-8 text-purple-400" />
                </div>
                <dt className="mt-4 text-sm font-semibold text-slate-400">Языков поддерживается</dt>
                <dd className="text-3xl font-bold text-white">15+</dd>
              </div>
              
              <div className="text-center group">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-8 w-8 text-blue-400" />
                </div>
                <dt className="mt-4 text-sm font-semibold text-slate-400">Скорость анализа</dt>
                <dd className="text-3xl font-bold text-white">&lt;2s</dd>
              </div>
              
              <div className="text-center group">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-8 w-8 text-emerald-400" />
                </div>
                <dt className="mt-4 text-sm font-semibold text-slate-400">Точность AI</dt>
                <dd className="text-3xl font-bold text-white">94%</dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
