/**
 * NavigationSidebar - Современная боковая навигация с анимациями
 * 
 * Интерактивная навигация между вкладками с индикаторами данных и состояния
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Dot, AlertCircle, 
  CheckCircle, Info, TrendingUp, Activity
} from 'lucide-react';
import { ProjectAnalysis, AnalysisTab } from '@/types/analysis.types';

interface NavigationSidebarProps {
  activeTab: AnalysisTab;
  onTabChange: (tab: AnalysisTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  tabConfigs: Record<string, {
    id: AnalysisTab;
    label: string;
    icon: React.ElementType;
    description: string;
    shortcut: string;
    color: string;
    features: string[];
  }>;
  analysisResult: ProjectAnalysis;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  tabConfigs,
  analysisResult
}) => {
  // Вычисляем статистику для каждой вкладки
  const getTabStats = (tabId: AnalysisTab) => {
    switch (tabId) {
      case AnalysisTab.FILES:
        return {
          count: analysisResult.files.length,
          status: 'active',
          subtitle: `${analysisResult.metrics.languages.length} языков`
        };
      case AnalysisTab.DEPENDENCIES:
        return {
          count: analysisResult.dependencies.length,
          status: analysisResult.dependencies.length > 100 ? 'warning' : 'active',
          subtitle: 'связей'
        };
      case AnalysisTab.TODOS:
        const todos = analysisResult.all_todos || [];
        const criticalCount = todos.filter(t => t.type === 'FIXME').length;
        return {
          count: todos.length,
          status: criticalCount > 5 ? 'error' : criticalCount > 0 ? 'warning' : 'success',
          subtitle: `${criticalCount} критичных`
        };
      case AnalysisTab.DOCUMENTATION:
        const docs = analysisResult.project_documentation || [];
        const totalFunctions = docs.reduce((sum, doc) => sum + doc.functions.length, 0);
        return {
          count: totalFunctions,
          status: totalFunctions === 0 ? 'inactive' : 'active',
          subtitle: 'функций'
        };
      case AnalysisTab.DUPLICATES:
        const duplicates = analysisResult.file_duplicates || [];
        return {
          count: duplicates.length,
          status: duplicates.length > 0 ? 'warning' : 'success',
          subtitle: 'групп'
        };
      case AnalysisTab.VISUALIZATION:
      default:
        return {
          count: analysisResult.files.length + analysisResult.dependencies.length,
          status: 'active',
          subtitle: 'элементов'
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-400" />;
      case 'warning':
        return <Info className="h-3 w-3 text-yellow-400" />;
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-400" />;
      case 'inactive':
        return <Dot className="h-3 w-3 text-gray-400" />;
      default:
        return <Activity className="h-3 w-3 text-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'error':
        return 'border-red-500/30 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'success':
        return 'border-green-500/30 bg-green-500/10';
      case 'inactive':
        return 'border-gray-500/30 bg-gray-500/10';
      default:
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 320 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="glass-morphism border-r border-white/10 flex flex-col h-full"
    >
      {/* Заголовок с кнопкой сворачивания */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-semibold text-white">Навигация</h2>
                <p className="text-xs text-white/60">Разделы анализа</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggleCollapse}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 
                     hover:border-white/30 transition-all duration-300"
          >
            {collapsed ? 
              <ChevronRight className="h-4 w-4 text-white" /> : 
              <ChevronLeft className="h-4 w-4 text-white" />
            }
          </motion.button>
        </div>
      </div>

      {/* Список вкладок */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <nav className="space-y-2">
          {Object.values(tabConfigs).map((tab, index) => {
            const isActive = activeTab === tab.id;
            const stats = getTabStats(tab.id);
            const IconComponent = tab.icon;

            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full group relative overflow-hidden rounded-xl transition-all duration-300
                  ${isActive 
                    ? `bg-gradient-to-r ${tab.color} border-white/30 shadow-lg` 
                    : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
                  }
                  border p-3 text-left
                `}
              >
                {/* Фоновый эффект при активном состоянии */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.1 }}
                    className="absolute inset-0 bg-white rounded-xl"
                  />
                )}

                <div className="relative z-10">
                  <div className="flex items-center gap-3">
                    {/* Иконка */}
                    <div className={`
                      p-2 rounded-lg transition-all duration-300
                      ${isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-white/10 text-white/70 group-hover:text-white group-hover:bg-white/15'
                      }
                    `}>
                      <IconComponent className="h-5 w-5" />
                    </div>

                    {/* Контент (показывается только когда sidebar развернут) */}
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex-1 overflow-hidden"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className={`
                                font-medium transition-colors duration-300
                                ${isActive ? 'text-white' : 'text-white/80 group-hover:text-white'}
                              `}>
                                {tab.label}
                              </div>
                              <div className={`
                                text-xs transition-colors duration-300
                                ${isActive ? 'text-white/80' : 'text-white/60 group-hover:text-white/70'}
                              `}>
                                {stats.subtitle}
                              </div>
                            </div>

                            {/* Статистика и статус */}
                            <div className="flex items-center gap-2">
                              <div className={`
                                px-2 py-1 rounded-lg text-xs font-bold border transition-all duration-300
                                ${getStatusColor(stats.status)}
                                ${isActive ? 'text-white' : 'text-white/80'}
                              `}>
                                {stats.count}
                              </div>
                              {getStatusIcon(stats.status)}
                            </div>
                          </div>

                          {/* Описание и функции (только для активной вкладки) */}
                          <AnimatePresence>
                            {isActive && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-3 pt-3 border-t border-white/20"
                              >
                                <p className="text-xs text-white/70 mb-2">
                                  {tab.description}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {tab.features.slice(0, 3).map((feature, featureIndex) => (
                                    <span
                                      key={featureIndex}
                                      className="px-1.5 py-0.5 text-xs bg-white/10 rounded text-white/60"
                                    >
                                      {feature}
                                    </span>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Индикатор активности (только для свернутого состояния) */}
                  {collapsed && isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 
                               bg-white rounded-full shadow-lg"
                    />
                  )}
                </div>

                {/* Tooltip для свернутого состояния */}
                {collapsed && (
                  <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 
                               opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                               pointer-events-none z-50">
                    <div className="bg-black/90 text-white text-sm px-3 py-2 rounded-lg 
                                  border border-white/20 backdrop-blur-sm whitespace-nowrap">
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs text-white/70">{tab.description}</div>
                      <div className="text-xs text-white/50 mt-1">
                        Alt + {tab.shortcut}
                      </div>
                    </div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Нижняя часть - общая статистика */}
      <div className="p-4 border-t border-white/10">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-2"
            >
              <div className="text-xs text-white/60 font-medium">Общая статистика</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-white">
                    {(analysisResult.metrics.total_lines / 1000).toFixed(1)}K
                  </div>
                  <div className="text-xs text-white/60">строк</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-white">
                    {analysisResult.metrics.languages.length}
                  </div>
                  <div className="text-xs text-white/60">языков</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Индикатор для свернутого состояния */}
        {collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center"
          >
            <div className="w-2 h-2 bg-white/30 rounded-full" />
          </motion.div>
        )}
      </div>
    </motion.aside>
  );
};

export default NavigationSidebar;
