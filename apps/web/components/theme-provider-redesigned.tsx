/**
 * Провайдер темы с поддержкой электрической эстетики
 * 
 * Обеспечивает переключение между светлой и темной темой с сохранением
 * предпочтений пользователя и плавными переходами.
 */

"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  resolvedTheme: 'light',
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'mcp-analyzer-theme',
  attribute = 'data-theme',
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [mounted, setMounted] = useState(false)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Инициализация темы из localStorage только на клиенте
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem(storageKey) as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [storageKey])

  useEffect(() => {
    const root = window.document.documentElement

    // Удаляем предыдущие классы темы
    root.removeAttribute(attribute)
    root.classList.remove('light', 'dark')

    let systemTheme: 'light' | 'dark' = 'light'
    
    if (enableSystem && theme === 'system') {
      systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light'
    }

    const activeTheme = theme === 'system' ? systemTheme : theme
    setResolvedTheme(activeTheme)

    // Добавляем новые классы и атрибуты
    root.setAttribute(attribute, activeTheme)
    root.classList.add(activeTheme)

    // Добавляем специальные классы для электрических эффектов
    if (activeTheme === 'dark') {
      root.classList.add('electric-theme')
    } else {
      root.classList.remove('electric-theme')
    }

    // Применяем переходы
    if (!disableTransitionOnChange) {
      const css = document.createElement('style')
      css.appendChild(
        document.createTextNode(
          `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`
        )
      )
      document.head.appendChild(css)

      return () => {
        // Восстанавливаем переходы через небольшую задержку
        window.getComputedStyle(css).opacity
        document.head.removeChild(css)
      }
    }
  }, [theme, attribute, enableSystem, disableTransitionOnChange])

  useEffect(() => {
    // Слушаем изменения системной темы
    if (enableSystem) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        if (theme === 'system') {
          setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')
        }
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme, enableSystem])

  const value = React.useMemo(
    () => ({
      theme,
      setTheme: (theme: Theme) => {
        localStorage?.setItem(storageKey, theme)
        setTheme(theme)
      },
      resolvedTheme,
    }),
    [theme, resolvedTheme, storageKey]
  )

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {mounted ? children : <div className="loading-theme">{children}</div>}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}

/**
 * Компонент переключателя темы с электрическими эффектами
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg bg-surface-secondary animate-pulse" />
    )
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="group relative w-9 h-9 rounded-lg bg-surface-secondary hover:bg-surface-accent transition-all duration-200 flex items-center justify-center border border-border-primary hover:border-border-electric"
      title={`Переключить на ${resolvedTheme === 'dark' ? 'светлую' : 'темную'} тему`}
    >
      {/* Иконка солнца */}
      <svg
        className={`absolute w-4 h-4 transition-all duration-300 ${
          resolvedTheme === 'dark' 
            ? 'rotate-90 scale-0 opacity-0' 
            : 'rotate-0 scale-100 opacity-100'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>

      {/* Иконка луны */}
      <svg
        className={`absolute w-4 h-4 transition-all duration-300 ${
          resolvedTheme === 'dark' 
            ? 'rotate-0 scale-100 opacity-100' 
            : '-rotate-90 scale-0 opacity-0'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>

      {/* Электрический эффект при hover */}
      <div className="absolute inset-0 rounded-lg bg-gradient-electric opacity-0 group-hover:opacity-20 transition-opacity duration-200" />
    </button>
  )
}
