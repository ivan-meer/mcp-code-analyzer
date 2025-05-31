import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderOpen, GitBranch, FileText, Code, Settings, Eye, FileJson, Globe, FileCode } from "lucide-react";
import { ProjectVisualization } from "@/components/visualization/project-visualization";

const getFileIconColor = (type: string) => {
  const colorMap: { [key: string]: string } = {
    'ts': '#3178c6',
    'tsx': '#61dafb', 
    'js': '#f7df1e',
    'jsx': '#61dafb',
    'py': '#3776ab',
    'css': '#1572b6',
    'scss': '#c6538c',
    'html': '#e34f26',
    'json': '#292929',
    'md': '#083fa1',
    'config': '#f59e0b',
    'test': '#10b981'
  };
  return colorMap[type] || '#64748b';
};

const getFileIcon = (type: string, name: string) => {
  const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
    'ts': Code,
    'tsx': Code,
    'js': Code,
    'jsx': Code,
    'py': FileText,
    'css': FileCode,
    'scss': FileCode,
    'html': Globe,
    'json': FileJson,
    'md': FileText,
    'config': Settings,
    'test': Eye
  };
  const Icon = iconMap[type] || FileText;
  return <Icon className="h-4 w-4 text-white" />;
};

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
  analysisResult: ProjectAnalysis | null;
  setAnalysisResult: (result: ProjectAnalysis | null) => void;
}

export function AnalysisResults({ analysisResult, setAnalysisResult }: AnalysisResultsProps) {
  // TODO: Добавить интеграцию ИИ-моделей для автоматического анализа кода и генерации рекомендаций.
  // Возможные точки интеграции:
  // 1. Анализ кода на наличие ошибок и уязвимостей с помощью ИИ.
  // 2. Генерация описаний функций и модулей на основе анализа кода.
  // 3. Автоматическое предложение оптимизаций и рефакторинга.
  return (
    <AnimatePresence>
      {analysisResult && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6"
        >
          {/* Back Button */}
          <Button 
            variant="outline" 
            onClick={() => setAnalysisResult(null)}
            className="mb-6"
          >
            ← Новый анализ
          </Button>

          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Обзор проекта
              </CardTitle>
              <CardDescription>
                {analysisResult.project_path}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                <div className="text-center p-2 rounded-md bg-slate-50 dark:bg-slate-800">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {analysisResult.metrics.total_files}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Файлов</div>
                </div>
                <div className="text-center p-2 rounded-md bg-slate-50 dark:bg-slate-800">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {analysisResult.metrics.total_lines.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Строк кода</div>
                </div>
                <div className="text-center p-2 rounded-md bg-slate-50 dark:bg-slate-800">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {analysisResult.metrics.total_functions}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Функций</div>
                </div>
                <div className="text-center p-2 rounded-md bg-slate-50 dark:bg-slate-800">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {Math.round(analysisResult.metrics.avg_lines_per_file)}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Строк/файл</div>
                </div>
              </div>

              {/* Languages and Patterns */}
              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-slate-700 dark:text-slate-300">Языки программирования:</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.metrics.languages.map((lang) => (
                      <Badge key={lang} variant="secondary" className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>

                {analysisResult.architecture_patterns.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-slate-700 dark:text-slate-300">Архитектурные паттерны:</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.architecture_patterns.map((pattern) => (
                        <Badge key={pattern} variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                          {pattern}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs for different views */}
          <Tabs defaultValue="visualization" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="visualization">Визуализация</TabsTrigger>
              <TabsTrigger value="files">Файлы</TabsTrigger>
              <TabsTrigger value="dependencies">Зависимости</TabsTrigger>
              <TabsTrigger value="todos">TODO/FIXME</TabsTrigger>
            </TabsList>

            <TabsContent value="visualization" className="space-y-4">
              <ProjectVisualization data={analysisResult} />
            </TabsContent>

            <TabsContent value="files" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Файлы проекта</CardTitle>
                  <CardDescription>
                    Найдено {analysisResult.files.length} файлов
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {analysisResult.files.map((file, index) => (
                      <motion.div
                        key={file.path}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: getFileIconColor(file.type) }}>
                            {getFileIcon(file.type, file.name)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-200">{file.name}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {file.path}
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant="outline" className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">{file.type}</Badge>
                          {file.lines_of_code && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {file.lines_of_code} строк
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dependencies" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Граф зависимостей</CardTitle>
                  <CardDescription>
                    Найдено {analysisResult.dependencies.length} зависимостей
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {analysisResult.dependencies.map((dep, index) => (
                      <motion.div
                        key={`${dep.from}-${dep.to}-${dep.type}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                      >
                        <GitBranch className="h-4 w-4 text-slate-500" />
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className="font-medium">{dep.from.split('/').pop()}</span>
                            <span className="text-slate-500 mx-2">→</span>
                            <span className="font-medium">{dep.to}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {dep.type}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="todos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Задачи и исправления (TODO/FIXME)</CardTitle>
                  <CardDescription>
                    В текущем анализе не найдено задач или исправлений
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-6 text-slate-600 dark:text-slate-400">
                    <p>В коде проекта не найдено комментариев TODO или FIXME.</p>
                    <p className="mt-2">При следующем анализе все такие комментарии будут отображаться здесь.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
