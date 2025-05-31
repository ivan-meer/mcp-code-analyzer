/**
 * Обновленный навбар с электрической эстетикой
 * 
 * Современный навигационный компонент с поддержкой темной/светлой темы,
 * градиентными эффектами и улучшенной мобильной адаптивностью.
 */

"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Code2, FileSearch, GitBranch, BookOpen, Settings, 
  Menu, X, Zap, Github, ExternalLink, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-provider-redesigned'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  badge?: string
  external?: boolean
}

const navigationItems: NavItem[] = [
  {
    href: '/',
    label: 'Главная',
    icon: Code2,
    description: 'Анализ кода с ИИ'
  },
  {
    href: '/documentation',
    label: 'Документация',
    icon: BookOpen,
    description: 'Руководство пользователя'
  },
  {
    href: 'https://github.com/your-repo/mcp-code-analyzer',
    label: 'GitHub',
    icon: Github,
    description: 'Исходный код',
    external: true
  },
  {
    href: '/settings',
    label: 'Настройки',
    icon: Settings,
    description: 'Конфигурация системы'
  }
]

const ModernNavbar: React.FC = () => {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Отслеживание прокрутки для эффекта glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Закрытие меню при изменении маршрута
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const isActiveRoute = (href: string) => {
    if (href === '/') return pathname === href
    return pathname?.startsWith(href) ?? false
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-surface-primary/80 backdrop-blur-xl border-b border-border-primary shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Логотип и название */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link href="/" className="flex items-center space-x-3 group">
              {/* Логотип с электрическим эффектом */}
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center group-hover:shadow-primary transition-all duration-300">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                {/* Электрическое свечение */}
                <div className="absolute inset-0 rounded-lg bg-gradient-primary opacity-0 group-hover:opacity-30 blur-sm transition-opacity duration-300" />
              </div>
              
              {/* Название */}
              <div className="flex flex-col">
                <span className="font-bold text-lg text-text-primary group-hover:text-interactive-primary transition-colors">
                  MCP Code Analyzer
                </span>
                <span className="text-xs text-text-tertiary -mt-1">
                  AI Powered
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Десктопная навигация */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon
              const isActive = !item.external && isActiveRoute(item.href)
              
              return (
                <motion.div
                  key={item.href}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`relative px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 group ${
                        isActive
                          ? 'bg-surface-accent text-interactive-primary'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                      
                      {/* Активная индикация */}
                      {isActive && (
                        <motion.div
                          layoutId="navbar-active"
                          className="absolute inset-0 bg-gradient-primary/10 rounded-lg border border-border-electric"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className={`relative px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 group ${
                        isActive
                          ? 'bg-surface-accent text-interactive-primary'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                      
                      {/* Активная индикация */}
                      {isActive && (
                        <motion.div
                          layoutId="navbar-active"
                          className="absolute inset-0 bg-gradient-primary/10 rounded-lg border border-border-electric"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Link>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Правая часть - переключатель темы и мобильное меню */}
          <div className="flex items-center space-x-3">
            {/* Статус AI */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-state-success-bg border border-state-success/20">
              <div className="w-2 h-2 rounded-full bg-state-success animate-pulse" />
              <span className="text-xs font-medium text-state-success">AI Online</span>
            </div>

            {/* Переключатель темы */}
            <ThemeToggle />

            {/* Мобильное меню */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-9 h-9 p-0"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isMenuOpen ? 'close' : 'menu'}
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isMenuOpen ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <Menu className="w-4 h-4" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Мобильное меню */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden bg-surface-primary/95 backdrop-blur-xl border-t border-border-primary"
          >
            <div className="px-4 py-6 space-y-3">
              {navigationItems.map((item, index) => {
                const IconComponent = item.icon
                const isActive = !item.external && isActiveRoute(item.href)
                
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-surface-accent text-interactive-primary border border-border-electric'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{item.label}</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </div>
                          {item.description && (
                            <p className="text-xs text-text-tertiary mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-surface-accent text-interactive-primary border border-border-electric'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                        <div className="flex-1">
                          <span className="font-medium">{item.label}</span>
                          {item.description && (
                            <p className="text-xs text-text-tertiary mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    )}
                  </motion.div>
                )
              })}

              {/* Мобильный статус AI */}
              <div className="flex items-center justify-center space-x-2 px-4 py-3 mt-4 rounded-lg bg-state-success-bg border border-state-success/20">
                <Sparkles className="w-4 h-4 text-state-success" />
                <span className="text-sm font-medium text-state-success">
                  AI система активна
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

export default ModernNavbar
