'use client';

import React, { useState } from 'react';
import { ModernHeader } from '@/components/modern-header';
import { ModernHeroSection } from '@/components/modern-hero-section';
import { ModernFeaturesGrid } from '@/components/modern-features-grid';
import { ModernProjectInput } from '@/components/modern-project-input';
import { AnalysisResults } from '@/components/analysis-results';
import { LoadingState } from '@/components/loading-state';
import { ModernFooter } from '@/components/modern-footer';
import { AIStatusCard } from '@/components/ai-status-card';

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
      const response = await fetch('/api/analyze', {
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

  return (
    <div className="min-h-screen bg-slate-900">
      <ModernHeader />
      
      {/* Основной контент */}
      <main className="pt-16 lg:pt-20">
        {!analysisResult ? (
          <>
            {/* Hero секция */}
            <ModernHeroSection />
            
            {/* Возможности */}
            <ModernFeaturesGrid />
            
            {/* Ввод проекта */}
            <ModernProjectInput 
              projectPath={projectPath} 
              setProjectPath={setProjectPath} 
              isAnalyzing={isAnalyzing} 
              error={error} 
              analyzeProject={analyzeProject} 
            />
            
            {/* AI статус */}
            <section className="py-16 bg-slate-800">
              <div className="container mx-auto px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">
                      Статус AI системы
                    </h2>
                    <p className="text-slate-300">
                      Мониторинг AI сервисов для интеллектуального анализа кода
                    </p>
                  </div>
                  <AIStatusCard />
                </div>
              </div>
            </section>
          </>
        ) : (
          /* Результаты анализа */
          <div className="py-8">
            <div className="container mx-auto px-6 lg:px-8">
              <AnalysisResults 
                analysisResult={analysisResult} 
                setAnalysisResult={setAnalysisResult} 
              />
            </div>
          </div>
        )}
        
        {/* Состояние загрузки */}
        <LoadingState isAnalyzing={isAnalyzing} />
      </main>
      
      {/* Футер */}
      <ModernFooter />
    </div>
  );
}
