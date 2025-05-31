'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ModernNavbar from '@/components/modern-navbar';
import { HeroSection } from '@/components/hero-section';
import { ModernFeaturesGrid } from '@/components/modern-features-grid';
import { ProjectInput } from '@/components/project-input-redesigned';
import { LoadingState } from '@/components/loading-state';
import { ModernFooter } from '@/components/modern-footer';
import { AIStatusCard } from '@/components/ai-status-card';
import { AnalysisResults } from '@/components/analysis-results-simple';
import { generateSampleReactProject, generateSamplePythonProject } from '@/lib/sample-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Component as Lightning } from '@/components/ui/lightning';
import {
  Code2,
  Sparkles,
  Eye,
  FileText,
  GitBranch,
  ArrowLeft,
  Lightbulb
} from 'lucide-react';

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
    exports?: string[];
    complexity?: number;
  }>;
  dependencies: Array<{
    from: string;
    to: string;
    type: string;
    weight?: number;
  }>;
  metrics: {
    total_files: number;
    total_lines: number;
    total_functions: number;
    avg_lines_per_file: number;
    languages: string[];
    complexity_score?: number;
  };
  architecture_patterns: string[];
}

export default function HomePage() {
  const [projectPath, setProjectPath] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ProjectAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [demoType, setDemoType] = useState<'react' | 'python'>('react');

  const loadSampleProject = (type: 'react' | 'python') => {
    setIsAnalyzing(true);
    setError(null);
    
    setTimeout(() => {
      const sampleData = type === 'react' ? generateSampleReactProject() : generateSamplePythonProject();
      
      // Transform sample data to match expected interface
      const transformedResult: ProjectAnalysis = {
        project_path: `sample-${type}-project/`,
        files: sampleData.files.map(file => ({
          ...file,
          imports: file.imports || [] // Ensure imports is always an array
        })),
        dependencies: sampleData.dependencies,
        metrics: {
          ...sampleData.metrics,
          total_functions: sampleData.files.reduce((sum, file) => sum + file.functions.length, 0),
          avg_lines_per_file: Math.round(sampleData.metrics.total_lines / sampleData.metrics.total_files)
        },
        architecture_patterns: type === 'react' 
          ? ['Component Architecture', 'Redux Pattern', 'Custom Hooks', 'Service Layer']
          : ['MVC Pattern', 'Repository Pattern', 'Dependency Injection', 'Unit Testing']
      };
      
      setAnalysisResult(transformedResult);
      setShowDemo(true);
      setDemoType(type);
      setIsAnalyzing(false);
    }, 1500); // Simulate analysis time
  };

  const analyzeProject = async () => {
    if (!projectPath.trim()) {
      setError('Пожалуйста, укажите путь к проекту');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setShowDemo(false);

    // Очистка пути от лишних пробелов и дублирований
    const cleanedPath = projectPath.trim().replace(/\s+/g, ' ').split(' ')[0];

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: cleanedPath,
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

  const resetToHome = () => {
    setAnalysisResult(null);
    setShowDemo(false);
    setProjectPath('');
    setError(null);
  };

  return (
    <div className="min-h-screen gradient-mesh">
      <ModernNavbar />
      
      {/* Main Content */}
      <main className="pt-16 lg:pt-20">


        {!analysisResult ? (
          <>
            {/* Enhanced Hero Section */}
            <div className="relative h-screen bg-gradient-to-br from-gray-900 to-slate-950 dark:from-gray-900 dark:to-black">
  <Lightning
    hue={220}
    xOffset={0.0}
    speed={0.7}
    intensity={1.2}
    size={1.5}
  />
  <div className="absolute inset-0 flex flex-col justify-center items-center text-white z-10 px-4">
    <div className="max-w-4xl w-full text-center">
      <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
        Превратите код в интерактивную визуализацию
      </h1>
      <p className="text-xl text-slate-700 dark:text-slate-300 mb-8 mx-auto max-w-2xl leading-relaxed">
        Интеллектуальный анализ кода с AI-объяснениями и красивой визуализацией для глубокого понимания структуры вашего проекта
      </p>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mb-10 max-w-lg mx-auto"
      >
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-lg rounded-full opacity-30"></div>
          <div className="relative bg-blue-100 dark:bg-blue-900/20 p-1 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Code2 className="w-10 h-10" />
          </div>
        </div>
      </motion.div>
    </div>
  </div>
</div>
            
            {/* Demo Showcase Section */}
            <section className="py-20 relative">
              <div className="container mx-auto px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center mb-12">
                  <Badge variant="secondary" className="glass border-cyan-500/30 text-cyan-300 px-4 py-2 mb-6">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Демонстрация возможностей
                  </Badge>
                  <h2 className="text-3xl font-bold text-gradient mb-6">
                    Попробуйте прямо сейчас
                  </h2>
                  <p className="text-xl text-slate-300 mb-8">
                    Изучите интерактивную визуализацию на примере реальных проектов
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => loadSampleProject('react')}
                      size="lg"
                      className="glass border-blue-500/30 hover:bg-blue-500/20 text-white hover-lift group"
                    >
                      <Code2 className="h-5 w-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                      React Project Demo
                    </Button>
                    
                    <Button
                      onClick={() => loadSampleProject('python')}
                      size="lg"
                      className="glass border-green-500/30 hover:bg-green-500/20 text-white hover-lift group"
                    >
                      <FileText className="h-5 w-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                      Python Project Demo
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Enhanced Features Grid */}
            <ModernFeaturesGrid />
            
            {/* Enhanced Project Input */}
            <section className="py-20">
              <div className="container mx-auto px-6 lg:px-8">
                <ProjectInput 
                  projectPath={projectPath} 
                  setProjectPath={setProjectPath} 
                  isAnalyzing={isAnalyzing} 
                  error={error} 
                  analyzeProject={analyzeProject} 
                />
              </div>
            </section>
            
            {/* AI Status Section */}
            <section className="py-20 glass">
              <div className="container mx-auto px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-12">
                    <Badge variant="secondary" className="glass border-purple-500/30 text-purple-300 px-4 py-2 mb-6">
                      <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                      AI Engine Status
                    </Badge>
                    <h2 className="text-3xl font-bold text-gradient mb-6">
                      Мониторинг AI системы
                    </h2>
                    <p className="text-xl text-slate-300">
                      Статус интеллектуальных сервисов для анализа кода
                    </p>
                  </div>
                  <AIStatusCard />
                </div>
              </div>
            </section>
          </>
        ) : (
          /* Enhanced Analysis Results */
          <div className="py-8 min-h-screen">
            <div className="container mx-auto px-6 lg:px-8">
              {/* Enhanced Header for Results */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <Button
                    onClick={resetToHome}
                    variant="outline"
                    className="glass border-purple-500/30 hover:bg-purple-500/20 text-white hover-lift"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Назад к главной
                  </Button>
                  
                  {showDemo && (
                    <Badge variant="secondary" className="glass border-cyan-500/30 text-cyan-300 px-4 py-2">
                      <Eye className="h-4 w-4 mr-2" />
                      Demo: {demoType === 'react' ? 'React Project' : 'Python Project'}
                    </Badge>
                  )}
                </div>
                
                <Card className="glass border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-gradient flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: demoType === 'react' ? '#61dafb' : '#3776ab' }}
                      >
                        {demoType === 'react' ? <Code2 className="h-5 w-5 text-white" /> : <FileText className="h-5 w-5 text-white" />}
                      </div>
                      Результаты анализа проекта
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {showDemo ? 'Демонстрационный анализ архитектуры проекта' : analysisResult.project_path}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gradient">{analysisResult.metrics.total_files}</div>
                        <div className="text-sm text-slate-400">Файлов</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gradient">{analysisResult.metrics.total_lines.toLocaleString()}</div>
                        <div className="text-sm text-slate-400">Строк кода</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gradient">{analysisResult.metrics.total_functions}</div>
                        <div className="text-sm text-slate-400">Функций</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gradient">{analysisResult.dependencies.length}</div>
                        <div className="text-sm text-slate-400">Связей</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Enhanced Visualization with Knowledge Graph */}
              <AnalysisResults data={analysisResult} />
            </div>
          </div>
        )}
        
        {/* Loading State Overlay */}
        <LoadingState isAnalyzing={isAnalyzing} />
      </main>
      {/* End of Main Content */}
      
      {/* Enhanced Footer */}
      <ModernFooter />
    </div>
  );
}
