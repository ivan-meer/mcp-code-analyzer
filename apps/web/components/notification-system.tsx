/**
 * 🚀 Интеллектуальная система уведомлений
 * Центр управления уведомлениями для MCP Code Analyzer
 * 
 * Архитектурная философия:
 * - Каждое уведомление - это важная информация для пользователя
 * - Уведомления должны быть информативными, но не навязчивыми
 * - Система должна поддерживать различные типы: успех, ошибка, предупреждение, информация
 * - Уведомления должны исчезать автоматически, но пользователь может их закрыть вручную
 */

"use client"

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Zap } from 'lucide-react';

// 📋 Типы уведомлений для различных ситуаций
type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'progress';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // Время отображения в миллисекундах
  persistent?: boolean; // Если true, не исчезает автоматически
  timestamp: Date;
  metadata?: Record<string, any>; // Дополнительные данные для аналитики
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  // 🎯 Специализированные методы для различных типов уведомлений
  notifySuccess: (title: string, message?: string, options?: Partial<Notification>) => string;
  notifyError: (title: string, message?: string, options?: Partial<Notification>) => string;
  notifyWarning: (title: string, message?: string, options?: Partial<Notification>) => string;
  notifyInfo: (title: string, message?: string, options?: Partial<Notification>) => string;
  notifyProgress: (title: string, message?: string, options?: Partial<Notification>) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// 🎨 Конфигурация внешнего вида для каждого типа уведомления
const notificationConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'from-green-500/20 to-emerald-500/20',
    borderColor: 'border-green-500/30',
    iconColor: 'text-green-400',
    defaultDuration: 4000
  },
  error: {
    icon: AlertCircle,
    bgColor: 'from-red-500/20 to-rose-500/20',
    borderColor: 'border-red-500/30',
    iconColor: 'text-red-400',
    defaultDuration: 6000
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'from-yellow-500/20 to-amber-500/20',
    borderColor: 'border-yellow-500/30',
    iconColor: 'text-yellow-400',
    defaultDuration: 5000
  },
  info: {
    icon: Info,
    bgColor: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    defaultDuration: 4000
  },
  progress: {
    icon: Zap,
    bgColor: 'from-purple-500/20 to-violet-500/20',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-400',
    defaultDuration: 0 // Прогресс уведомления не исчезают автоматически
  }
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 🆔 Генерация уникального ID для каждого уведомления
  const generateId = useCallback(() => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // ➕ Добавление нового уведомления
  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = generateId();
    const notification: Notification = {
      ...notificationData,
      id,
      timestamp: new Date(),
      duration: notificationData.duration || notificationConfig[notificationData.type].defaultDuration
    };

    setNotifications(prev => [...prev, notification]);

    // 🕐 Автоматическое удаление через заданное время (если не persistent)
    if (!notification.persistent && notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }

    // 📊 Логирование для аналитики
    console.log(`📢 Уведомление [${notification.type.toUpperCase()}]:`, {
      title: notification.title,
      message: notification.message,
      timestamp: notification.timestamp.toISOString(),
      metadata: notification.metadata
    });

    return id;
  }, [generateId]);

  // ➖ Удаление уведомления
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // 🧹 Очистка всех уведомлений
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // 🎯 Специализированные методы для каждого типа
  const notifySuccess = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({ ...options, type: 'success', title, message });
  }, [addNotification]);

  const notifyError = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({ ...options, type: 'error', title, message });
  }, [addNotification]);

  const notifyWarning = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({ ...options, type: 'warning', title, message });
  }, [addNotification]);

  const notifyInfo = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({ ...options, type: 'info', title, message });
  }, [addNotification]);

  const notifyProgress = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return addNotification({ ...options, type: 'progress', title, message, persistent: true });
  }, [addNotification]);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyProgress
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationDisplay />
    </NotificationContext.Provider>
  );
}

// 🖥️ Компонент отображения уведомлений
function NotificationDisplay() {
  const context = useContext(NotificationContext);
  if (!context) return null;

  const { notifications, removeNotification } = context;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => {
          const config = notificationConfig[notification.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={`
                relative p-4 rounded-lg border backdrop-blur-md
                bg-gradient-to-br ${config.bgColor} ${config.borderColor}
                shadow-lg shadow-black/20
              `}
            >
              {/* 🔄 Анимированная граница для прогресс уведомлений */}
              {notification.type === 'progress' && (
                <div className="absolute inset-0 rounded-lg border-2 border-purple-500/50 animate-pulse" />
              )}

              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 ${config.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white">
                    {notification.title}
                  </h4>
                  {notification.message && (
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      {notification.message}
                    </p>
                  )}
                  
                  {/* 🕒 Отметка времени для аналитики */}
                  <div className="mt-2 text-xs text-slate-500">
                    {notification.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                {/* ❌ Кнопка закрытия */}
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// 🪝 Хук для использования системы уведомлений
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// 🎁 Экспорт типов для использования в других компонентах
export type { Notification, NotificationType };
