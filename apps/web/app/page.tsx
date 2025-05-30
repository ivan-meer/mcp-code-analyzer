'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code2, 
  Brain, 
  Zap, 
  GitBranch, 
  FileText, 
  Play, 
  Loader2,
  FolderOpen,
  BarChart3,
  Network
} from 'lucide-react';
import { ProjectVisualization } from '@/components/visualization/project-visualization';
import { CodeExplanation } from '@/components/learning/code-explanation';

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

export default function HomePage() {
  const [projectPath, setProjectPath] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ProjectAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeProject = async () => {
    if (!projectPath.trim()) {
      setError('Пожалуйста, укажите путь к проекту');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/backend/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: projectPath,
          include_tests: true,
          analysis_depth: 'medium'
        }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка анализа: ${response.statusText}`);
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const features = [
    {
      icon: <Code2 className="h-6 w-6" />,
      title: "Анализ кода",
      description: "Глубокий анализ структуры и качества вашего кода"
    },
    {
      icon: <Network className="h-6 w-6" />,
      title: "Визуализация зависимостей",
      description: "Интерактивные графы связей между компонентами"
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI объяснения",
      description: "Умные объяснения сложных концепций и паттернов"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Метрики качества",
      description: "Детальная аналитика и рекомендации по улучшению"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Code2 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                MCP Code Analyzer
              </h1>
            </div>
            <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300">
              🧪 Experimental
            </Badge>
          </motion.div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        {!analysisResult && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              Превратите код в интерактивную визуализацию
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
              Интеллектуальный анализ кода с AI-объяснениями и красивой визуализацией
            </p>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-2 p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg w-fit">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Project Input */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="max-w-md mx-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Анализ проекта
                  </CardTitle>
                  <CardDescription>
                    Укажите путь к папке с вашим проектом
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="/path/to/your/project"
                      value={projectPath}
                      onChange={(e) => setProjectPath(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && analyzeProject()}
                    />
                    <Button 
                      onClick={analyzeProject}
                      disabled={isAnalyzing}
                      className="shrink-0"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="text-xs text-slate-500 space-y-1">
                    <p>Примеры путей:</p>
                    <code className="block bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      C:\Users\YourName\Projects\my-app
                    </code>
                    <code className="block bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      /home/user/projects/react-app
                    </code>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.section>
        )}

        {/* Analysis Results */}
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analysisResult.metrics.total_files}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Файлов</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {analysisResult.metrics.total_lines.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Строк кода</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {analysisResult.metrics.total_functions}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Функций</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.round(analysisResult.metrics.avg_lines_per_file)}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Строк/файл</div>
                    </div>
                  </div>

                  {/* Languages and Patterns */}
                  <div className="mt-6 space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Языки программирования:</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.metrics.languages.map((lang) => (
                          <Badge key={lang} variant="secondary">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {analysisResult.architecture_patterns.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Архитектурные паттерны:</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.architecture_patterns.map((pattern) => (
                            <Badge key={pattern} variant="outline">
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
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="visualization">Визуализация</TabsTrigger>
                  <TabsTrigger value="files">Файлы</TabsTrigger>
                  <TabsTrigger value="dependencies">Зависимости</TabsTrigger>
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
                            <div>
                              <div className="font-medium">{file.name}</div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">
                                {file.path}
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <Badge variant="outline">{file.type}</Badge>
                              {file.lines_of_code && (
                                <div className="text-xs text-slate-500">
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
                            key={`${dep.from}-${dep.to}`}
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
              </Tabs>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Loading State */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <div>
                    <h3 className="font-semibold">Анализируем проект...</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Это может занять несколько секунд
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>MCP Code Analyzer - Experimental AI-powered code analysis platform</p>
        </div>
      </footer>
    </div>
  );
}
