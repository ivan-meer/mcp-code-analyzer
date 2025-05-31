/**
 * Секция для работы с зависимостями проекта
 * 
 * Этот компонент предоставляет интерфейс для анализа и визуализации
 * зависимостей между файлами проекта. Он помогает понять архитектуру
 * проекта, найти циклические зависимости и оценить связанность кода.
 * 
 * Особенности:
 * 1. Интерактивная визуализация графа зависимостей
 * 2. Фильтрация по типам зависимостей
 * 3. Поиск конкретных связей
 * 4. Анализ циклических зависимостей
 * 5. Метрики связанности
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch, Network, AlertTriangle, TrendingUp, Download, 
  Filter, Search, BarChart3, Zap, RefreshCw 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { ProjectDependency } from '@/types/analysis.types';
import { useFiltering } from '@/hooks/useFiltering';
import { SearchFilter } from '@/components/shared/SearchFilter';
import { VirtualList } from '@/components/shared/VirtualList';
import { DependencyItem } from '@/components/shared/DependencyAndTodoItems';

interface DependenciesSectionProps {
  dependencies: ProjectDependency[];
  projectPath: string;
  onFileNavigate?: (filePath: string) => void;
  className?: string;
}

/**
 * Компонент статистики зависимостей
 */
const DependenciesStatistics: React.FC<{ 
  dependencies: ProjectDependency[];
  analysis: any;
}> = ({ dependencies, analysis }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {dependencies.length}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Всего связей</div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
          {analysis.uniqueFiles}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Уникальных файлов</div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {analysis.averageConnections.toFixed(1)}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Среднее связей</div>
      </div>
      
      <div className="text-center">
        <div className={`text-2xl font-bold ${analysis.cyclicDependencies > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
          {analysis.cyclicDependencies}
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Циклических</div>
      </div>
    </div>
  );
};

/**
 * Компонент анализа зависимостей
 */
const DependencyAnalysis: React.FC<{ dependencies: ProjectDependency[] }> = ({ dependencies }) => {
  const analysis = useMemo(() => {
    const typeDistribution = dependencies.reduce((acc, dep) => {
      acc[dep.type] = (acc[dep.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const fileConnections = new Map<string, { incoming: number; outgoing: number }>();
    
    dependencies.forEach(dep => {
      // Исходящие связи
      const from = fileConnections.get(dep.from) || { incoming: 0, outgoing: 0 };
      from.outgoing++;
      fileConnections.set(dep.from, from);
      
      // Входящие связи
      const to = fileConnections.get(dep.to) || { incoming: 0, outgoing: 0 };
      to.incoming++;
      fileConnections.set(dep.to, to);
    });

    const uniqueFiles = fileConnections.size;
    const totalConnections = Array.from(fileConnections.values()).reduce(
      (sum, conn) => sum + conn.incoming + conn.outgoing, 0
    );
    const averageConnections = uniqueFiles > 0 ? totalConnections / uniqueFiles : 0;

    // Находим самые связанные файлы
    const mostConnected = Array.from(fileConnections.entries())
      .map(([file, conn]) => ({
        file,
        total: conn.incoming + conn.outgoing,
        incoming: conn.incoming,
        outgoing: conn.outgoing
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Простая эвристика для обнаружения циклических зависимостей
    const cyclicDependencies = dependencies.filter(dep => 
      dependencies.some(other => other.from === dep.to && other.to === dep.from)
    ).length / 2; // Делим на 2, так как каждый цикл считается дважды

    return {
      typeDistribution,
      uniqueFiles,
      averageConnections,
      mostConnected,
      cyclicDependencies
    };
  }, [dependencies]);

  return (
    <div className="space-y-6">
      {/* Предупреждение о циклических зависимостях */}
      {analysis.cyclicDependencies > 0 && (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            Обнаружено {analysis.cyclicDependencies} циклических зависимостей. 
            Это может указывать на проблемы в архитектуре проекта.
          </AlertDescription>
        </Alert>
      )}

      {/* Распределение по типам */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Типы зависимостей
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(analysis.typeDistribution).map(([type, count]) => {
              const percentage = (count / dependencies.length) * 100;
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{type}</Badge>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {count} связей
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded">
                      <div 
                        className="h-full bg-blue-500 rounded"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-10 text-right">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Самые связанные файлы */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Network className="h-4 w-4" />
            Наиболее связанные файлы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.mostConnected.map((item, index) => (
              <div 
                key={item.file} 
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {item.file.split('/').pop()}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {item.incoming} входящих, {item.outgoing} исходящих
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">
                  {item.total} связей
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Компонент графового представления зависимостей
 */
const DependencyGraph: React.FC<{ 
  dependencies: ProjectDependency[];
  onNodeClick?: (filePath: string) => void;
}> = ({ dependencies, onNodeClick }) => {
  // Упрощенное представление графа (в реальном проекте здесь была бы библиотека для визуализации)
  const graphData = useMemo(() => {
    const nodes = new Set<string>();
    const edges: { from: string; to: string; type: string }[] = [];

    dependencies.forEach(dep => {
      nodes.add(dep.from);
      nodes.add(dep.to);
      edges.push({
        from: dep.from,
        to: dep.to,
        type: dep.type
      });
    });

    return {
      nodes: Array.from(nodes).map(node => ({
        id: node,
        label: node.split('/').pop() || node,
        fullPath: node
      })),
      edges
    };
  }, [dependencies]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Граф зависимостей
          </div>
          <Badge variant="outline">
            {graphData.nodes.length} узлов, {graphData.edges.length} связей
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-center">
          <div className="text-center text-slate-500 dark:text-slate-400">
            <Network className="h-12 w-12 mx-auto mb-3" />
            <p className="font-medium">Интерактивный граф зависимостей</p>
            <p className="text-sm mt-1">
              Визуализация будет добавлена с использованием D3.js или аналогичной библиотеки
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Основной компонент DependenciesSection
 */
export const DependenciesSection: React.FC<DependenciesSectionProps> = ({
  dependencies,
  projectPath,
  onFileNavigate,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('list');

  // Используем хук фильтрации для зависимостей
  const {
    filteredData: filteredDependencies,
    filters,
    search,
    updateFilters,
    quickSearch,
    resetFilters,
    stats
  } = useFiltering(dependencies, {
    todoTypes: [] // Переиспользуем для типов зависимостей
  }, {
    searchFields: ['from', 'to', 'type']
  });

  // Анализ зависимостей
  const analysis = useMemo(() => {
    const typeDistribution = dependencies.reduce((acc, dep) => {
      acc[dep.type] = (acc[dep.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const uniqueFiles = new Set([
      ...dependencies.map(d => d.from),
      ...dependencies.map(d => d.to)
    ]).size;

    const averageConnections = uniqueFiles > 0 ? (dependencies.length * 2) / uniqueFiles : 0;

    // Простая эвристика для циклических зависимостей
    const cyclicDependencies = dependencies.filter(dep => 
      dependencies.some(other => other.from === dep.to && other.to === dep.from)
    ).length / 2;

    return {
      typeDistribution,
      uniqueFiles,
      averageConnections,
      cyclicDependencies
    };
  }, [dependencies]);

  // Подготовка фильтров
  const filterGroups = useMemo(() => {
    const dependencyTypes = Array.from(new Set(dependencies.map(d => d.type)));
    
    return [
      {
        id: 'todoTypes', // Переиспользуем существующий тип
        label: 'Типы зависимостей',
        options: dependencyTypes.map(type => ({
          id: type,
          label: type.charAt(0).toUpperCase() + type.slice(1),
          count: dependencies.filter(d => d.type === type).length
        })),
        multiSelect: true
      }
    ];
  }, [dependencies]);

  // Обработчики событий
  const handleFileClick = useCallback((filePath: string) => {
    onFileNavigate?.(filePath);
  }, [onFileNavigate]);

  const handleExport = useCallback(() => {
    const csvContent = [
      'Источник,Цель,Тип',
      ...filteredDependencies.map(dep => 
        `"${dep.from}","${dep.to}","${dep.type}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectPath.split('/').pop()}-dependencies.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredDependencies, projectPath]);

  const renderDependencyItem = useCallback((dep: ProjectDependency, index: number) => (
    <DependencyItem
      dependency={dep}
      variant="default"
      searchTerm={search.query}
      onFromClick={handleFileClick}
      onToClick={handleFileClick}
    />
  ), [search.query, handleFileClick]);

  return (
    <Card className={`dependencies-section ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Зависимости проекта
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>

        {/* Статистика */}
        <DependenciesStatistics dependencies={dependencies} analysis={analysis} />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Поиск и фильтры */}
        <SearchFilter
          searchPlaceholder="Поиск зависимостей по файлам или типу..."
          searchValue={search.query}
          onSearchChange={quickSearch}
          filterGroups={filterGroups}
          activeFilters={filters}
          onFilterChange={updateFilters}
          totalItems={dependencies.length}
          filteredItems={stats.filteredItems}
          onClearAll={resetFilters}
          variant="minimal"
        />

        {/* Вкладки с различными представлениями */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Список</TabsTrigger>
            <TabsTrigger value="graph">Граф</TabsTrigger>
            <TabsTrigger value="analysis">Анализ</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <VirtualList
              items={filteredDependencies}
              renderItem={renderDependencyItem}
              height={600}
              itemHeight={80}
              emptyMessage="Зависимости не найдены. Попробуйте изменить критерии поиска."
              showScrollIndicator={filteredDependencies.length > 50}
              animateItems={filteredDependencies.length < 30}
              ariaLabel="Список зависимостей проекта"
            />
          </TabsContent>

          <TabsContent value="graph" className="space-y-4">
            <DependencyGraph 
              dependencies={filteredDependencies}
              onNodeClick={handleFileClick}
            />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <DependencyAnalysis dependencies={filteredDependencies} />
          </TabsContent>
        </Tabs>

        {/* Дополнительная информация */}
        {analysis.cyclicDependencies === 0 && dependencies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
          >
            <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-800 dark:text-green-200">
              Отлично! В проекте не обнаружено циклических зависимостей.
            </span>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default DependenciesSection;
