/**
 * ProjectOverview - Улучшенная панель обзора проекта
 * 
 * Современный дизайн с интерактивными метриками, AI инсайтами и аналитикой
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, FileText, GitBranch, Users, Clock, Zap, 
  Target, TrendingUp, AlertTriangle, CheckCircle2, 
  Brain, Lightbulb, Award, Shield, Code, Layers
} from 'lucide-react';
import { ProjectAnalysis } from '@/types/analysis.types';
import { PerformanceMetrics } from '../hooks/usePerformanceMonitor';

interface ProjectOverviewProps {
  analysisResult: ProjectAnalysis;
  performanceMetrics: PerformanceMetrics;
  aiInsights?: {
    codeQuality: number;
    architectureScore: number;
    maintainabilityIndex: number;
    technicalDebt: number;
    recommendations: string[];
    patterns: string[];
  } | null;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  analysisResult,
  performanceMetrics,
  aiInsights
}) => {
  // Вычисляемые метрики
  const enhancedMetrics = useMemo(() => {
    const files = analysisResult.files;
    const todos = analysisResult.all_todos || [];
    const docs = analysisResult.project_documentation || [];
    
    // Анализ языков программирования
    const languageStats = files.reduce((acc, file) => {
      const ext = file.type.toLowerCase();
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Качество документации
    const totalFunctions = docs.reduce((sum, doc) => sum + doc.functions.length, 0);
    const documentedFunctions = docs.reduce((sum, doc) => 
      sum + doc.functions.filter(f => f.description).length, 0);
    const documentationCoverage = totalFunctions > 0 ? (documentedFunctions / totalFunctions) * 100 : 0;

    // Анализ TODO
    const criticalTodos = todos.filter(todo => todo.type === 'FIXME').length;
    const todosByType = todos.reduce((acc, todo) => {
      acc[todo.type] = (acc[todo.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Сложность проекта
    const averageFileSize = files.length > 0 ? files.reduce((sum, f) => sum + f.size, 0) / files.length : 0;
    const complexityScore = Math.min(100, Math.max(0, 
      50 + (files.length > 100 ? 20 : 0) + 
      (averageFileSize > 1000 ? 15 : 0) + 
      (analysisResult.dependencies.length > 50 ? 15 : 0)
    ));

    // Архитектурная зрелость
    const hasPatterns = analysisResult.architecture_patterns.length > 0;
    const architectureMaturity = hasPatterns ? 
      Math.min(100, 60 + analysisResult.architecture_patterns.length * 10) : 40;

    return {
      languageStats,
      documentationCoverage,
      criticalTodos,
      todosByType,
      complexityScore,
      architectureMaturity,
      mainLanguage: Object.entries(languageStats).sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown',
      filesBySize: {
        small: files.filter(f => f.size < 1000).length,
        medium: files.filter(f => f.size >= 1000 && f.size < 10000).length,
        large: files.filter(f => f.size >= 10000).length
      }
    };
  }, [analysisResult]);

  return (
    <div className="space-y-6">
      {/* Основные метрики */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <MetricCard
          icon={FileText}
          title="Файлы"
          value={analysisResult.files.length.toLocaleString()}
          subtitle={`${enhancedMetrics.mainLanguage.toUpperCase()} проект`}
          color="from-blue-500 to-cyan-600"
          delay={0}
        />
        
        <MetricCard
          icon={Code}
          title="Строки кода"
          value={analysisResult.metrics.total_lines.toLocaleString()}
          subtitle={`${Math.round(analysisResult.metrics.avg_lines_per_file)} на файл`}
          color="from-purple-500 to-indigo-600"
          delay={0.1}
        />
        
        <MetricCard
          icon={GitBranch}
          title="Зависимости"
          value={analysisResult.dependencies.length.toString()}
          subtitle="связей"
          color="from-orange-500 to-red-600"
          delay={0.2}
        />
        
        <MetricCard
          icon={CheckCircle2}
          title="Задачи"
          value={analysisResult.all_todos?.length.toString() || '0'}
          subtitle={`${enhancedMetrics.criticalTodos} критичных`}
          color="from-yellow-500 to-orange-600"
          delay={0.3}
        />
        
        <MetricCard
          icon={Clock}
          title="Анализ"
          value={`${Math.round(performanceMetrics.analysisTime / 1000)}с`}
          subtitle={performanceMetrics.analysisComplexity}
          color="from-green-500 to-teal-600"
          delay={0.4}
        />
        
        <MetricCard
          icon={Zap}
          title="Память"
          value={`${performanceMetrics.memoryUsage}MB`}
          subtitle={performanceMetrics.uiResponsiveness}
          color="from-pink-500 to-purple-600"
          delay={0.5}
        />
      </div>

      {/* Качественные метрики и AI инсайты */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Качество кода */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-morphism rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Качество кода</h3>
          </div>

          <div className="space-y-4">
            <QualityIndicator
              label="Документация"
              value={enhancedMetrics.documentationCoverage}
              maxValue={100}
              suffix="%"
            />
            <QualityIndicator
              label="Архитектура"
              value={enhancedMetrics.architectureMaturity}
              maxValue={100}
              suffix="%"
            />
            <QualityIndicator
              label="Сложность"
              value={enhancedMetrics.complexityScore}
              maxValue={100}
              suffix="%"
              inverse
            />
            {aiInsights && (
              <QualityIndicator
                label="AI Оценка"
                value={aiInsights.codeQuality}
                maxValue={100}
                suffix="%"
              />
            )}
          </div>
        </motion.div>

        {/* Распределение файлов */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-morphism rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-teal-600">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Структура</h3>
          </div>

          <div className="space-y-3">
            <FileDistribution
              label="Малые файлы"
              count={enhancedMetrics.filesBySize.small}
              total={analysisResult.files.length}
              color="bg-green-500"
            />
            <FileDistribution
              label="Средние файлы"
              count={enhancedMetrics.filesBySize.medium}
              total={analysisResult.files.length}
              color="bg-yellow-500"
            />
            <FileDistribution
              label="Крупные файлы"
              count={enhancedMetrics.filesBySize.large}
              total={analysisResult.files.length}
              color="bg-red-500"
            />
          </div>

          {/* Языки программирования */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <h4 className="text-sm font-medium text-white/80 mb-2">Языки</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(enhancedMetrics.languageStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([lang, count]) => (
                  <span
                    key={lang}
                    className="px-2 py-1 text-xs bg-white/10 rounded-lg text-white/80"
                  >
                    {lang.toUpperCase()} ({count})
                  </span>
                ))}
            </div>
          </div>
        </motion.div>

        {/* AI Инсайты */}
        {aiInsights && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-morphism rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">AI Инсайты</h3>
            </div>

            <div className="space-y-3">
              {aiInsights.recommendations.slice(0, 3).map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-white/80">{recommendation}</p>
                </div>
              ))}
            </div>

            {aiInsights.patterns.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <h4 className="text-sm font-medium text-white/80 mb-2">Паттерны</h4>
                <div className="flex flex-wrap gap-2">
                  {aiInsights.patterns.slice(0, 3).map((pattern, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-lg"
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Архитектурные паттерны и рекомендации */}
      {analysisResult.architecture_patterns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="glass-morphism rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600">
              <Award className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Архитектурные паттерны</h3>
          </div>

          <div className="flex flex-wrap gap-3">
            {analysisResult.architecture_patterns.map((pattern, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 
                         border border-indigo-400/30 rounded-xl text-indigo-300 text-sm font-medium"
              >
                {pattern}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Компонент карточки метрики
interface MetricCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  subtitle: string;
  color: string;
  delay: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  color, 
  delay 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ scale: 1.02, y: -2 }}
    className="glass-morphism rounded-2xl p-4 border border-white/20 hover:border-white/30 
               transition-all duration-300 group cursor-pointer"
  >
    <div className={`inline-flex p-2 rounded-xl bg-gradient-to-r ${color} mb-3`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    
    <div className="space-y-1">
      <div className="text-2xl font-bold text-white group-hover:text-white/90 transition-colors">
        {value}
      </div>
      <div className="text-sm font-medium text-white/80">
        {title}
      </div>
      <div className="text-xs text-white/60">
        {subtitle}
      </div>
    </div>
  </motion.div>
);

// Компонент индикатора качества
interface QualityIndicatorProps {
  label: string;
  value: number;
  maxValue: number;
  suffix?: string;
  inverse?: boolean;
}

const QualityIndicator: React.FC<QualityIndicatorProps> = ({ 
  label, 
  value, 
  maxValue, 
  suffix = '', 
  inverse = false 
}) => {
  const percentage = Math.min(100, (value / maxValue) * 100);
  const displayValue = Math.round(value);
  
  const getColor = () => {
    const threshold = inverse ? 100 - percentage : percentage;
    if (threshold >= 80) return 'bg-green-500';
    if (threshold >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-white/80">{label}</span>
        <span className="text-sm font-medium text-white">
          {displayValue}{suffix}
        </span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-2 rounded-full ${getColor()} transition-colors duration-300`}
        />
      </div>
    </div>
  );
};

// Компонент распределения файлов
interface FileDistributionProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

const FileDistribution: React.FC<FileDistributionProps> = ({ 
  label, 
  count, 
  total, 
  color 
}) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded ${color}`} />
        <span className="text-sm text-white/80">{label}</span>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-white">{count}</div>
        <div className="text-xs text-white/60">{percentage.toFixed(1)}%</div>
      </div>
    </div>
  );
};

export default ProjectOverview;
