/**
 * Временная заглушка для компонента результатов анализа
 */

"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileCode, GitBranch, Users, Clock } from 'lucide-react';

interface ProjectAnalysis {
  project_path: string;
  files: Array<{
    path: string;
    name: string;
    type: string;
    size: number;
    lines_of_code?: number;
    functions: string[];
    imports: string[];
  }>;
  dependencies: Array<{
    from: string;
    to: string;
    type: string;
  }>;
  metrics: {
    total_files: number;
    total_lines: number;
    total_functions: number;
    avg_lines_per_file: number;
    languages: string[];
  };
  architecture_patterns: string[];
}

interface AnalysisResultsProps {
  data: ProjectAnalysis;
}

export function AnalysisResults({ data }: AnalysisResultsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Главная карточка с метриками */}
      <Card className="glass border-blue-500/20 bg-slate-900/80 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <FileCode className="h-4 w-4 text-white" />
            </div>
            Результаты анализа
          </CardTitle>
          <CardDescription className="text-slate-300">
            Интеллектуальный анализ структуры проекта завершен
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient mb-2">
                {data.metrics.total_files}
              </div>
              <div className="text-sm text-slate-400">Файлов</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient mb-2">
                {data.metrics.total_lines.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">Строк кода</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient mb-2">
                {data.metrics.total_functions}
              </div>
              <div className="text-sm text-slate-400">Функций</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient mb-2">
                {data.dependencies.length}
              </div>
              <div className="text-sm text-slate-400">Связей</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Языки программирования */}
      <Card className="glass border-blue-500/20 bg-slate-900/80 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <GitBranch className="h-5 w-5" />
            Используемые технологии
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.metrics.languages.map(language => (
              <Badge 
                key={language} 
                variant="secondary" 
                className="bg-blue-500/20 text-blue-300 border-blue-500/30"
              >
                {language}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Архитектурные паттерны */}
      {data.architecture_patterns.length > 0 && (
        <Card className="glass border-blue-500/20 bg-slate-900/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <Users className="h-5 w-5" />
              Архитектурные паттерны
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.architecture_patterns.map(pattern => (
                <Badge 
                  key={pattern} 
                  variant="outline" 
                  className="border-purple-500/30 text-purple-300"
                >
                  {pattern}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Список файлов (первые 10) */}
      <Card className="glass border-blue-500/20 bg-slate-900/80 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Clock className="h-5 w-5" />
            Файлы проекта
          </CardTitle>
          <CardDescription className="text-slate-300">
            Показано первых {Math.min(10, data.files.length)} файлов из {data.files.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.files.slice(0, 10).map((file, index) => (
              <motion.div
                key={file.path}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center">
                    <span className="text-xs font-mono text-blue-300">
                      {file.type.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-white">{file.name}</div>
                    <div className="text-xs text-slate-400">{file.path}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-300">
                    {file.lines_of_code || 0} строк
                  </div>
                  <div className="text-xs text-slate-400">
                    {file.functions.length} функций
                  </div>
                </div>
              </motion.div>
            ))}
            {data.files.length > 10 && (
              <div className="text-center py-4">
                <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                  и еще {data.files.length - 10} файлов...
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Заглушка для дополнительных вкладок */}
      <Card className="glass border-blue-500/20 bg-slate-900/80 backdrop-blur-xl">
        <CardContent className="py-12 text-center">
          <div className="text-slate-400 space-y-2">
            <div className="text-lg font-medium">🚀 Расширенная визуализация</div>
            <div className="text-sm">
              Интерактивные графы зависимостей, карты архитектуры и AI-анализ<br/>
              будут доступны в следующих обновлениях
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
