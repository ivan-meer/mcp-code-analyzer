/**
 * 📊 Система мониторинга прогресса анализа
 * Интеллектуальная панель управления для отслеживания процесса анализа кода
 *
 * Концепция архитектуры:
 * - Показываем пользователю детальную информацию о каждом этапе анализа
 * - Предоставляем визуальные индикаторы прогресса с анимациями
 * - Логируем каждый шаг для дальнейшего анализа производительности
 * - Даём пользователю ощущение контроля над процессом
 *
 * Основные функции:
 * - Отображение текущего этапа анализа
 * - Визуализация прогресса анализа с использованием индикаторов
 * - Логирование активности анализа для последующего анализа
 * - Предоставление пользователю информации о текущем состоянии анализа
 *
 * Использование:
 * 1. Инициализация компонента с данными о прогрессе анализа.
 * 2. Обновление данных о прогрессе анализа для отображения текущего состояния.
 *
 * Пример:
 * ```typescript
 * const progress = {
 *   stage: 'scanning',
 *   percentage: 45,
 *   currentFile: 'src/index.ts',
 *   filesProcessed: 10,
 *   totalFiles: 20,
 *   startTime: new Date(),
 *   estimatedCompletion: new Date(Date.now() + 300000)
 * };
 *
 * const logs = [
 *   { timestamp: new Date(), stage: 'initializing', message: 'Начало анализа' },
 *   { timestamp: new Date(), stage: 'scanning', message: 'Сканирование файлов' }
 * ];
 *
 * <ProgressMonitor isActive={true} progress={progress} logs={logs} />
 * ```
 */

"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  FileSearch,
  Brain,
  GitBranch,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BarChart3,
  Code2,
  FileText,
  Database
} from 'lucide-react';

// 📋 Типы этапов анализа для детального отслеживания
type AnalysisStage =
  | 'initializing'      // Инициализация системы
  | 'scanning'          // Сканирование файлов
  | 'parsing'           // Парсинг и анализ кода
  | 'ai-processing'     // Обработка через AI
  | 'building-graph'    // Построение графа зависимостей
  | 'generating-insights' // Генерация инсайтов
  | 'finalizing'        // Финализация результатов
  | 'completed'         // Анализ завершён
  | 'error';            // Произошла ошибка

interface AnalysisProgress {
  stage: AnalysisStage;
  percentage: number;
  currentFile?: string;
  filesProcessed: number;
  totalFiles: number;
  startTime: Date;
  estimatedCompletion?: Date;
  metadata?: Record<string, any>;
}

interface ProgressMonitorProps {
  isActive: boolean;
  progress: AnalysisProgress;
  logs: Array<{
    timestamp: Date;
    stage: AnalysisStage;
    message: string;
    duration?: number;
  }>;
  projectPath?: string;
}

// 🎨 Конфигурация для каждого этапа анализа
const stageConfig = {
  initializing: {
    icon: Zap,
    label: 'Инициализация',
    description: 'Подготовка к анализу проекта',
    color: 'from-blue-500 to-cyan-500',
    duration: 500
  },
  scanning: {
    icon: FileSearch,
    label: 'Сканирование',
    description: 'Поиск и индексация файлов',
    color: 'from-green-500 to-emerald-500',
    duration: 2000
  },
  parsing: {
    icon: Code2,
    label: 'Анализ кода',
    description: 'Парсинг структуры и зависимостей',
    color: 'from-purple-500 to-violet-500',
    duration: 3000
  },
  'ai-processing': {
    icon: Brain,
    label: 'AI обработка',
    description: 'Интеллектуальный анализ паттернов',
    color: 'from-pink-500 to-rose-500',
    duration: 4000
  },
  'building-graph': {
    icon: GitBranch,
    label: 'Граф зависимостей',
    description: 'Построение интерактивной визуализации',
    color: 'from-orange-500 to-amber-500',
    duration: 1500
  },
  'generating-insights': {
    icon: BarChart3,
    label: 'Генерация инсайтов',
    description: 'Формирование рекомендаций и отчётов',
    color: 'from-teal-500 to-cyan-500',
    duration: 2000
  },
  finalizing: {
    icon: Database,
    label: 'Финализация',
    description: 'Сохранение результатов и очистка',
    color: 'from-indigo-500 to-purple-500',
    duration: 800
  },
  completed: {
    icon: CheckCircle2,
    label: 'Завершено',
    description: 'Анализ успешно завершён',
    color: 'from-green-600 to-emerald-600',
    duration: 0
  },
  error: {
    icon: AlertCircle,
    label: 'Ошибка',
    description: 'Произошла ошибка во время анализа',
    color: 'from-red-500 to-rose-500',
    duration: 0
  }
};

export function ProgressMonitor({ isActive, progress, logs, projectPath }: ProgressMonitorProps) {
  // 📊 Вычисление статистики производительности
  const getPerformanceStats = () => {
    const totalTime = progress.startTime && progress.estimatedCompletion
      ? progress.estimatedCompletion.getTime() - progress.startTime.getTime()
      : progress.startTime
        ? Date.now() - progress.startTime.getTime()
        : 0;
    const avgTimePerFile = progress.filesProcessed > 0 ? totalTime / progress.filesProcessed : 0;
    const filesPerSecond = progress.filesProcessed > 0 ? (progress.filesProcessed / (totalTime / 1000)) : 0;
    return {
      totalTime,
      avgTimePerFile,
      filesPerSecond: filesPerSecond.toFixed(2)
    };
  };

  if (!isActive) return null;

  const currentConfig = stageConfig[progress.stage];
  const Icon = currentConfig.icon;
  const stats = getPerformanceStats();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      >
        <Card className="w-full max-w-2xl glass border-purple-500/20 bg-slate-900/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-white">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${currentConfig.color} flex items-center justify-center`}>
                {progress.stage === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : progress.stage === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-white" />
                ) : (
                  <Icon className="w-5 h-5 text-white animate-pulse" />
                )}
              </div>
              Анализ проекта в прогрессе
              <Badge variant="secondary" className="ml-auto">
                {progress.percentage.toFixed(0)}%
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 📊 Основной индикатор прогресса */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white">
                  {currentConfig.label}
                </span>
                <span className="text-xs text-slate-400">
                  {progress.filesProcessed} / {progress.totalFiles} файлов
                </span>
              </div>

              <Progress
                value={progress.percentage}
                className="h-2"
                color="bg-blue-500"
                aria-valuenow={progress.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{ background: `linear-gradient(to right, #007bff ${progress.percentage}%, #e9ecef ${progress.percentage}%)` }}
              />

              <p className="text-xs text-slate-300">
                {currentConfig.description}
              </p>

              {/* 📊 Результаты анализа проекта */}
              <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Результаты анализа проекта</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Файлов:</span>
                    <span className="text-xs text-white">{progress.totalFiles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Строк кода:</span>
                    <span className="text-xs text-white">{progress.metadata?.totalLines || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Функций:</span>
                    <span className="text-xs text-white">{progress.metadata?.totalFunctions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Связей:</span>
                    <span className="text-xs text-white">{progress.metadata?.totalDependencies || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 📈 Статистика производительности */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <Clock className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                <div className="text-lg font-semibold text-white">
                  {(stats.totalTime / 1000).toFixed(1)}s
                </div>
                <div className="text-xs text-slate-400">Время</div>
              </div>

              <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <FileText className="w-4 h-4 mx-auto mb-1 text-green-400" />
                <div className="text-lg font-semibold text-white">
                  {stats.filesPerSecond}
                </div>
                <div className="text-xs text-slate-400">Файлов/сек</div>
              </div>

              <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <BarChart3 className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                <div className="text-lg font-semibold text-white">
                  {(stats.avgTimePerFile / 1000).toFixed(2)}s
                </div>
                <div className="text-xs text-slate-400">Среднее/файл</div>
              </div>
            </div>

            {/* 📊 Граф зависимостей */}
            <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Граф зависимостей</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Связей:</span>
                  <span className="text-xs text-white">{progress.metadata?.totalDependencies || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Файлов:</span>
                  <span className="text-xs text-white">{progress.totalFiles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Функций:</span>
                  <span className="text-xs text-white">{progress.metadata?.totalFunctions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Строк кода:</span>
                  <span className="text-xs text-white">{progress.metadata?.totalLines || 0}</span>
                </div>
              </div>
            </div>

            {/* 📝 Лог активности (последние 3 записи) */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Лог активности
                </h4>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {logs.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-slate-400 flex justify-between"
                    >
                      <span>{log.message}</span>
                      <span>{log.timestamp.toLocaleTimeString()}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

            {/* 🎯 Текущий файл (если доступен) */}
            {progress.currentFile && (
              <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Обрабатывается:</div>
                <div className="text-sm text-white font-mono">
                  {progress.currentFile}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

// 🎁 Экспорт типов для использования в других компонентах
export type { AnalysisStage, AnalysisProgress };
