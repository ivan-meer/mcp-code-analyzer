'use client';

import React from 'react';
import { 
  Brain, 
  Github, 
  Twitter, 
  Mail, 
  Code2, 
  Sparkles,
  Heart,
  ArrowUpRight,
  BookOpen,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function ModernFooter() {
  const currentYear = new Date().getFullYear();

  const navigation = {
    product: [
      { name: 'Возможности', href: '#features' },
      { name: 'Документация', href: '#docs' },
      { name: 'API Reference', href: '#api' },
      { name: 'Примеры', href: '#examples' },
    ],
    support: [
      { name: 'Руководство', href: '#guide' },
      { name: 'FAQ', href: '#faq' },
      { name: 'Сообщество', href: '#community' },
      { name: 'Поддержка', href: '#support' },
    ],
    company: [
      { name: 'О проекте', href: '#about' },
      { name: 'Блог', href: '#blog' },
      { name: 'Карьера', href: '#careers' },
      { name: 'Контакты', href: '#contact' },
    ],
    legal: [
      { name: 'Конфиденциальность', href: '#privacy' },
      { name: 'Условия', href: '#terms' },
      { name: 'Лицензия', href: '#license' },
      { name: 'Cookies', href: '#cookies' },
    ],
  };

  const socialLinks = [
    { name: 'GitHub', href: '#', icon: Github },
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'Email', href: 'mailto:hello@example.com', icon: Mail },
    { name: 'Discord', href: '#', icon: MessageCircle },
  ];

  return (
    <footer className="bg-slate-900 border-t border-white/10">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Главная секция футера */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Брендинг и описание */}
            <div className="lg:col-span-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl blur opacity-20 animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">MCP Code Analyzer</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Powered
                    </Badge>
                  </div>
                </div>
              </div>
              
              <p className="text-slate-300 mb-6 leading-relaxed">
                Революционная платформа для анализа кода с использованием искусственного интеллекта. 
                Превращаем сложный код в понятные визуализации и получаем умные рекомендации для улучшения качества разработки.
              </p>
              
              <div className="flex items-center gap-4">
                {socialLinks.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
                  >
                    <item.icon className="h-5 w-5 text-slate-400 hover:text-white transition-colors" />
                  </a>
                ))}
              </div>
            </div>

            {/* Навигационные ссылки */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-purple-400" />
                    Продукт
                  </h4>
                  <ul className="space-y-3">
                    {navigation.product.map((item) => (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className="text-slate-400 hover:text-white transition-colors duration-200 flex items-center group"
                        >
                          {item.name}
                          <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-400" />
                    Поддержка
                  </h4>
                  <ul className="space-y-3">
                    {navigation.support.map((item) => (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className="text-slate-400 hover:text-white transition-colors duration-200 flex items-center group"
                        >
                          {item.name}
                          <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-pink-400" />
                    Компания
                  </h4>
                  <ul className="space-y-3">
                    {navigation.company.map((item) => (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className="text-slate-400 hover:text-white transition-colors duration-200 flex items-center group"
                        >
                          {item.name}
                          <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-4">Правовая информация</h4>
                  <ul className="space-y-3">
                    {navigation.legal.map((item) => (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className="text-slate-400 hover:text-white transition-colors duration-200 flex items-center group"
                        >
                          {item.name}
                          <ArrowUpRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter подписка */}
        <div className="py-8 border-t border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h4 className="text-white font-semibold mb-2">
                Следите за обновлениями
              </h4>
              <p className="text-slate-400">
                Получайте последние новости о новых возможностях и улучшениях платформы
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="email"
                  placeholder="Ваш email"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300"
                />
              </div>
              <Button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium">
                Подписаться
              </Button>
            </div>
          </div>
        </div>

        {/* Нижняя секция */}
        <div className="py-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <span>© {currentYear} MCP Code Analyzer. Создано с</span>
              <Heart className="h-4 w-4 text-red-400 animate-pulse" />
              <span>для разработчиков</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Все системы работают</span>
              </div>
              
              <Badge variant="outline" className="border-white/20 text-slate-400">
                v0.2.0 Beta
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
