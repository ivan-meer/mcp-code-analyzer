/**
 * ProjectHeader - Современный заголовок проекта с glassmorphism эффектами
 * 
 * Включает информацию о проекте, действия и метрики производительности
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Share2, Download, Search, Settings, 
  BarChart3, Clock, Zap, Database, TrendingUp,
  AlertCircle, CheckCircle, Info
} from 'lucide-react';
import { ProjectAnalysis } from '@/types/analysis.types';
import { PerformanceMetrics } from '../hooks/usePerformanceMonitor';

interface ProjectHeaderProps {
  analysisResult: ProjectAnalysis;
  onBack: () => void;
  onShare: () => void;
  onExport: () => void;
  onSearch: () => void;
  performanceMetrics: PerformanceMetrics;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  analysisResult,
  onBack,
  onShare,
  onExport,
  onSearch,
  performanceMetrics
}) => {
  const projectName = analysisResult.project_path.split('/').pop() || 'Неизвестный проект';
  
  // Определение статуса анализа на основе метрик
  const getAnalysisStatus = () => {
    if (performanceMetrics.errorRate > 0.1) {
      return { status: 'error', color: 'text-red-400', bgColor: 'bg-red-500/20', icon: AlertCircle };
    }
    if (performanceMetrics.uiResponsiveness === 'poor') {
      return { status: 'warning', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: Info };
    }
    return { status: 'success', color: 'text-green-400', bgColor: 'bg-green-500/20', icon: CheckCircle };
  };

  const statusInfo = getAnalysisStatus();
  const StatusIcon = statusInfo.icon;

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-morphism border-b border-white/10 p-6"
    >
      <div className="flex items-center justify-between">
        {/* Левая часть - Информация о проекте */}
        <div className="flex items-center space-x-6">
          {/* Кнопка назад */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 
                     border border-white/20 hover:border-white/30 transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Назад</span>
          </motion.button>

          {/* Информация о проекте */}
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${statusInfo.bgColor} border border-white/20`}>
              <BarChart3 className="h-6 w-6 text-blue-400" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">
                  {projectName}
                </h1>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${statusInfo.bgColor}`}>
                  <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
                  <span className={`text-xs font-medium ${statusInfo.color}`}>
                    {statusInfo.status === 'success' ? 'Отлично' : 
                     statusInfo.status === 'warning' ? 'Предупреждение' : 'Ошибка'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-white/60 font-mono">
                {analysisResult.project_path}
              </p>
            </div>
          </div>
        </div>

        {/* Центральная часть - Метрики производительности */}
        <div className="hidden lg:flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <MetricItem
              icon={Database}
              label="Файлы"
              value={analysisResult.files.length.toLocaleString()}
              color="text-blue-400"
            />
            <MetricItem
              icon={Clock}
              label="Время"
              value={`${Math.round(performanceMetrics.analysisTime / 1000)}с`}
              color="text-green-400"
            />
            <MetricItem
              icon={Zap}
              label="Память"
              value={`${performanceMetrics.memoryUsage}MB`}
              color="text-yellow-400"
            />
            <MetricItem
              icon={TrendingUp}
              label="Отзывчивость"
              value={performanceMetrics.uiResponsiveness === 'excellent' ? 'A+' : 
                    performanceMetrics.uiResponsiveness === 'good' ? 'A' :
                    performanceMetrics.uiResponsiveness === 'fair' ? 'B' : 'C'}
              color={performanceMetrics.uiResponsiveness === 'excellent' ? 'text-green-400' :
                    performanceMetrics.uiResponsiveness === 'good' ? 'text-blue-400' :
                    performanceMetrics.uiResponsiveness === 'fair' ? 'text-yellow-400' : 'text-red-400'}
            />
          </div>
        </div>

        {/* Правая часть - Действия */}
        <div className="flex items-center space-x-3">
          <ActionButton
            icon={Search}
            onClick={onSearch}
            tooltip="Поиск (Ctrl+K)"
            shortcut="⌘K"
          />
          <ActionButton
            icon={Share2}
            onClick={onShare}
            tooltip="Поделиться"
          />
          <ActionButton
            icon={Download}
            onClick={onExport}
            tooltip="Экспорт (Ctrl+E)"
            shortcut="⌘E"
            primary
          />
        </div>
      </div>

      {/* Прогресс-бар для показа статуса загрузки */}
      {performanceMetrics.analysisComplexity === 'extreme' && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className="mt-4 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
        />
      )}
    </motion.header>
  );
};

// Компонент метрики
interface MetricItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ icon: Icon, label, value, color }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 
               border border-white/10 hover:border-white/20 transition-all duration-300"
  >
    <Icon className={`h-4 w-4 ${color}`} />
    <div className="text-center">
      <div className="text-sm font-bold text-white">{value}</div>
      <div className="text-xs text-white/60">{label}</div>
    </div>
  </motion.div>
);

// Компонент кнопки действия
interface ActionButtonProps {
  icon: React.ElementType;
  onClick: () => void;
  tooltip: string;
  shortcut?: string;
  primary?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  icon: Icon, 
  onClick, 
  tooltip, 
  shortcut, 
  primary = false 
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`
      group relative p-3 rounded-xl border transition-all duration-300
      ${primary 
        ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-400/50 hover:border-blue-300' 
        : 'bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/30'
      }
    `}
    title={tooltip}
  >
    <Icon className={`h-4 w-4 ${primary ? 'text-white' : 'text-white/80 group-hover:text-white'}`} />
    
    {/* Tooltip с клавиатурным сочетанием */}
    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 px-2 py-1 
                    bg-black/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 
                    transition-opacity duration-300 whitespace-nowrap z-50">
      {tooltip}
      {shortcut && <span className="ml-2 text-white/60">{shortcut}</span>}
    </div>
  </motion.button>
);

export default ProjectHeader;
