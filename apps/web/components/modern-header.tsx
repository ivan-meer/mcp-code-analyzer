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
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Ensure the component is mounted before rendering theme-dependent content
  useEffect(() => {
    setMounted(true);
  }, []);

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'glass border-b border-purple-500/20 shadow-lg shadow-purple-500/10' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Enhanced Logo with Animation */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 animate-pulse-glow">
                <Brain className="h-6 w-6 text-white" />
              </div>
              {/* Enhanced animated glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-500 rounded-xl blur opacity-30 animate-float"></div>
            </div>
            
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gradient">
                MCP Code Analyzer
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30 text-xs glass">
                  <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
                  AI Powered
                </Badge>
                <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs glass">
                  Experimental
                </Badge>
              </div>
            </div>
          </div>

          {/* Enhanced Navigation for desktop */}
          <nav className="hidden lg:flex items-center gap-6">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-all duration-300 px-3 py-2 rounded-lg hover:bg-white/10 glass hover-lift group"
              >
                <item.icon className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium">{item.name}</span>
              </a>
            ))}
          </nav>

          {/* Enhanced Theme Controls and Actions */}
          <div className="flex items-center gap-3">
            {/* Enhanced Theme Switcher */}
            {mounted && (
              <div className="hidden sm:flex items-center glass rounded-lg p-1 backdrop-blur-sm border border-purple-500/20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme('light')}
                  className={`p-2 rounded-md transition-all duration-300 ${
                    theme === 'light' 
                      ? 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-400 shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Sun className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className={`p-2 rounded-md transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-r from-purple-400/20 to-blue-400/20 text-purple-400 shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Moon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme('system')}
                  className={`p-2 rounded-md transition-all duration-300 ${
                    theme === 'system' 
                      ? 'bg-gradient-to-r from-cyan-400/20 to-teal-400/20 text-cyan-400 shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Enhanced GitHub Button */}
            <Button
              variant="outline"
              size="sm"
              className="hidden lg:flex border-purple-500/30 text-white hover:bg-purple-500/20 glass backdrop-blur-sm hover-lift group"
            >
              <Github className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
              GitHub
            </Button>

            {/* Mobile Menu Button */}
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

        {/* Enhanced Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden">
            <div className="py-4 space-y-2 glass rounded-lg mt-2 border border-purple-500/20 backdrop-blur-xl">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 text-slate-300 hover:text-white transition-all duration-300 px-4 py-3 hover:bg-white/10 rounded-lg mx-2 hover-lift group"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-medium">{item.name}</span>
                </a>
              ))}
              
              {/* Enhanced Mobile Theme Options */}
              <div className="border-t border-purple-500/20 pt-2 mt-2">
                <div className="px-4 py-2">
                  <p className="text-xs text-slate-400 mb-3 font-medium">Тема оформления</p>
                  {mounted && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTheme('light')}
                        className={`flex-1 text-slate-300 justify-start ${
                          theme === 'light' ? 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-400' : ''
                        }`}
                      >
                        <Sun className="h-4 w-4 mr-2" />
                        Светлая
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTheme('dark')}
                        className={`flex-1 text-slate-300 justify-start ${
                          theme === 'dark' ? 'bg-gradient-to-r from-purple-400/20 to-blue-400/20 text-purple-400' : ''
                        }`}
                      >
                        <Moon className="h-4 w-4 mr-2" />
                        Темная
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
