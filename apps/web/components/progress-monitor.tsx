/**
 * 📊 Система мониторинга прогресса анализа
 * Интеллектуальная панель управления для отслеживания процесса анализа кода
 * 
 * Концепция архитектуры:
 * - Показываем пользователю детальную информацию о каждом этапе анализа
 * - Предоставляем визуальные индикаторы прогресса с анимациями
 * - Логируем каждый шаг для дальнейшего анализа производительности
 * - Даём пользователю ощущение контроля над процессом
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
  onComplete?: () => void;
  onError?: (error: string) => void;
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

export function ProgressMonitor({ isActive, onComplete, onError, projectPath }: ProgressMonitorProps) {
  const [progress, setProgress] = useState<AnalysisProgress>({
    stage: 'initializing',
    percentage: 0,
    filesProcessed: 0,
    totalFiles: 0,
    startTime: new Date()
  });

  const [logs, setLogs] = useState<Array<{
    timestamp: Date;
    stage: AnalysisStage;
    message: string;
    duration?: number;
  }>>([]);

  // 📝 Добавление записи в лог
  const addLog = useCallback((stage: AnalysisStage, message: string, duration?: number) => {
    const logEntry = {
      timestamp: new Date(),
      stage,
      message,
      duration
    };
    
    setLogs(prev => [...prev, logEntry]);
    
    // 🔍 Детальное логирование для разработчиков
    console.log(`🔄 [${stage.toUpperCase()}] ${message}`, {
      timestamp: logEntry.timestamp.toISOString(),
      duration,
      projectPath
    });
  }, [projectPath]);

  // 🎯 Симуляция прогресса анализа (в реальной реализации это будет получать данные от API)
  const simulateProgress = useCallback(async () => {
    if (!isActive) return;

    const stages: AnalysisStage[] = [
      'initializing',
      'scanning', 
      'parsing',
      'ai-processing',
      'building-graph',
      'generating-insights',
      'finalizing',
      'completed'
    ];

    let currentStageIndex = 0;
    const totalDuration = Object.values(stageConfig).reduce((sum, config) => sum + config.duration, 0);
    let elapsedTime = 0;

    for (const stage of stages) {
      if (!isActive) break;

      const config = stageConfig[stage];
      const stageStartTime = Date.now();
      
      setProgress(prev => ({
        ...prev,
        stage,
        startTime: prev.startTime,
        filesProcessed: stage === 'scanning' ? Math.floor(Math.random() * 50) + 10 : prev.filesProcessed,
        totalFiles: stage === 'scanning' ? Math.floor(Math.random() * 100) + 50 : prev.totalFiles
      }));

      addLog(stage, config.description);

      // 📈 Плавная анимация прогресса для текущего этапа
      const steps = 20;
      const stepDuration = config.duration / steps;

      for (let step = 0; step <= steps; step++) {
        if (!isActive) break;

        const stageProgress = (step / steps) * 100;
        const overallProgress = ((elapsedTime + (config.duration * step / steps)) / totalDuration) * 100;

        setProgress(prev => ({
          ...prev,
          percentage: Math.min(overallProgress, 95) // Никогда не показываем 100% до фактического завершения
        }));

        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }

      elapsedTime += config.duration;
      
      const stageDuration = Date.now() - stageStartTime;
      addLog(stage, `${config.label} завершён за ${stageDuration}ms`, stageDuration);
      
      currentStageIndex++;
    }

    // 🎉 Завершение анализа
    if (isActive) {
      setProgress(prev => ({
        ...prev,
        stage: 'completed',
        percentage: 100,
        estimatedCompletion: new Date()
      }));

      const totalTime = Date.now() - progress.startTime.getTime();
      addLog('completed', `Анализ завершён за ${totalTime}ms`, totalTime);
      
      onComplete?.();
    }
  }, [isActive, onComplete, addLog, progress.startTime]);

  // 🚀 Запуск симуляции при активации
  useEffect(() => {
    if (isActive) {
      simulateProgress();
    }
  }, [isActive, simulateProgress]);

  // 📊 Вычисление статистики производительности
  const getPerformanceStats = useCallback(() => {
    const totalTime = Date.now() - progress.startTime.getTime();
    const avgTimePerFile = progress.filesProcessed > 0 ? totalTime / progress.filesProcessed : 0;
    const filesPerSecond = progress.filesProcessed > 0 ? (progress.filesProcessed / (totalTime / 1000)) : 0;
    
    return {
      totalTime,
      avgTimePerFile,
      filesPerSecond: filesPerSecond.toFixed(2)
    };
  }, [progress]);

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
              />
              
              <p className="text-xs text-slate-300">
                {currentConfig.description}
              </p>
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

            {/* 📝 Лог активности (последние 3 записи) */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Лог активности
              </h4>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {logs.slice(-3).map((log, index) => (
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
