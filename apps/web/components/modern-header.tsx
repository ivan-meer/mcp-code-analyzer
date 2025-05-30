'use client';

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Github, 
  Menu, 
  X, 
  BookOpen, 
  Settings, 
  Sparkles,
  Monitor,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';

export function ModernHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, setTheme } = useTheme();

  // Отслеживание прокрутки для изменения прозрачности header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: 'Главная', href: '#', icon: Brain },
    { name: 'Документация', href: '#docs', icon: BookOpen },
    { name: 'GitHub', href: '#github', icon: Github },
    { name: 'Настройки', href: '#settings', icon: Settings },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-slate-900/95 backdrop-blur-lg border-b border-white/10' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Логотип */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              {/* Анимированный эффект свечения */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl blur opacity-20 animate-pulse"></div>
            </div>
            
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white">
                MCP Code Analyzer
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
                <Badge variant="outline" className="border-white/20 text-slate-400 text-xs">
                  Experimental
                </Badge>
              </div>
            </div>
          </div>

          {/* Навигация для desktop */}
          <nav className="hidden lg:flex items-center gap-6">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-white/10"
              >
                <item.icon className="h-4 w-4" />
                <span className="font-medium">{item.name}</span>
              </a>
            ))}
          </nav>

          {/* Переключатель темы и действия */}
          <div className="flex items-center gap-3">
            {/* Переключатель темы */}
            <div className="hidden sm:flex items-center bg-white/10 rounded-lg p-1 backdrop-blur-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme('light')}
                className={`p-2 rounded-md transition-all ${
                  theme === 'light' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme('dark')}
                className={`p-2 rounded-md transition-all ${
                  theme === 'dark' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme('system')}
                className={`p-2 rounded-md transition-all ${
                  theme === 'system' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </div>

            {/* GitHub кнопка */}
            <Button
              variant="outline"
              size="sm"
              className="hidden lg:flex border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
            >
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </Button>

            {/* Кнопка меню для mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden text-white p-2"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Мобильное меню */}
        {isMenuOpen && (
          <div className="lg:hidden">
            <div className="py-4 space-y-2 bg-slate-800/95 backdrop-blur-lg rounded-lg mt-2 border border-white/10">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors duration-200 px-4 py-3 hover:bg-white/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="font-medium">{item.name}</span>
                </a>
              ))}
              
              {/* Дополнительные опции для мобильного меню */}
              <div className="border-t border-white/10 pt-2 mt-2">
                <div className="px-4 py-2">
                  <p className="text-xs text-slate-400 mb-2">Тема</p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTheme('light')}
                      className="flex-1 text-slate-300"
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Светлая
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTheme('dark')}
                      className="flex-1 text-slate-300"
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Темная
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
