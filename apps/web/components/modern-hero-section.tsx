'use client';

import React from 'react';
import { Brain, Code2, Sparkles, Zap, ArrowRight, Github, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function ModernHeroSection() {
  return (
    <div className="relative overflow-hidden gradient-mesh min-h-screen flex items-center">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl animate-float delay-500"></div>
        
        {/* Floating particles */}
        <div className="absolute top-1/3 left-1/5 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
        <div className="absolute top-2/3 right-1/5 w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-300"></div>
        <div className="absolute top-1/4 right-1/3 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse delay-700"></div>
      </div>
      
      {/* Enhanced Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(147,51,234,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(147,51,234,0.03)_1px,transparent_1px)] bg-[length:60px_60px]"></div>
      
      <div className="relative px-6 lg:px-8 w-full">
        <div className="mx-auto max-w-5xl pt-20 pb-32 sm:pt-32 sm:pb-40">
          {/* Enhanced Top Badge */}
          <div className="mb-8 flex justify-center">
            <div className="relative rounded-full px-6 py-3 text-sm leading-6 text-slate-300 glass border border-purple-500/30 hover:border-purple-400/50 transition-all duration-500 hover-lift group">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
                <span className="text-gradient font-medium">Powered by AI • OpenAI & Anthropic</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </div>
          </div>
          
          {/* Enhanced Main Title */}
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-8xl animate-fade-in">
              <span className="block hover:scale-105 transition-transform duration-500">MCP Code</span>
              <span className="block text-gradient animate-pulse-glow bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Analyzer
              </span>
            </h1>
            
            <p className="mt-8 text-xl leading-8 text-slate-300 max-w-3xl mx-auto animate-fade-in delay-300">
              Превратите ваш код в <span className="text-gradient font-semibold">интерактивную визуализацию</span> с AI-объяснениями. 
              Анализируйте архитектуру, находите паттерны и получайте умные рекомендации 
              для улучшения качества кода.
            </p>
            
            {/* Enhanced Action Buttons */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-700 hover:via-pink-700 hover:to-cyan-700 text-white px-10 py-6 text-xl font-semibold shadow-2xl shadow-purple-500/30 transition-all duration-500 hover:scale-110 hover:shadow-purple-500/50 group animate-pulse-glow"
              >
                <Brain className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                Начать анализ
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="glass border-purple-500/30 text-white hover:bg-purple-500/20 px-10 py-6 text-xl transition-all duration-500 hover:scale-110 hover-lift group"
              >
                <Github className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                GitHub
              </Button>
            </div>
            
            {/* Enhanced Statistics with Interactive Effects */}
            <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="text-center group hover-lift">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl glass border border-purple-500/30 group-hover:border-purple-400/60 group-hover:shadow-lg group-hover:shadow-purple-500/25 transition-all duration-500 animate-pulse-glow">
                  <Code2 className="h-10 w-10 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <dt className="mt-6 text-sm font-semibold text-slate-400 uppercase tracking-wider">Языков поддерживается</dt>
                <dd className="text-4xl font-bold text-gradient mt-2">15+</dd>
              </div>
              
              <div className="text-center group hover-lift">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl glass border border-cyan-500/30 group-hover:border-cyan-400/60 group-hover:shadow-lg group-hover:shadow-cyan-500/25 transition-all duration-500 animate-pulse-glow delay-300">
                  <Zap className="h-10 w-10 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <dt className="mt-6 text-sm font-semibold text-slate-400 uppercase tracking-wider">Скорость анализа</dt>
                <dd className="text-4xl font-bold text-gradient mt-2">&lt;2s</dd>
              </div>
              
              <div className="text-center group hover-lift">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl glass border border-emerald-500/30 group-hover:border-emerald-400/60 group-hover:shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-500 animate-pulse-glow delay-700">
                  <Star className="h-10 w-10 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <dt className="mt-6 text-sm font-semibold text-slate-400 uppercase tracking-wider">Точность AI</dt>
                <dd className="text-4xl font-bold text-gradient mt-2">94%</dd>
              </div>
            </div>
            
            {/* Additional Feature Highlights */}
            <div className="mt-16 flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="glass border-purple-500/30 text-purple-300 px-4 py-2">
                <Brain className="h-4 w-4 mr-2" />
                AI-Powered Analysis
              </Badge>
              <Badge variant="secondary" className="glass border-cyan-500/30 text-cyan-300 px-4 py-2">
                <Code2 className="h-4 w-4 mr-2" />
                Interactive Visualization
              </Badge>
              <Badge variant="secondary" className="glass border-pink-500/30 text-pink-300 px-4 py-2">
                <Sparkles className="h-4 w-4 mr-2" />
                Real-time Insights
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
