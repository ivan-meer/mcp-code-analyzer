'use client';

import React, { useState, useRef } from 'react';
import { 
  FolderOpen, 
  Upload, 
  Search, 
  Brain, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Sparkles,
  Code2,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ModernProjectInputProps {
  projectPath: string;
  setProjectPath: (path: string) => void;
  isAnalyzing: boolean;
  error: string | null;
  analyzeProject: () => void;
}

export function ModernProjectInput({ 
  projectPath, 
  setProjectPath, 
  isAnalyzing, 
  error, 
  analyzeProject 
}: ModernProjectInputProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Обработка drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type === 'application/x-directory') {
      setProjectPath(files[0].path);
    }
  };

  // Примеры проектов для быстрого старта
  const exampleProjects = [
    { name: "React App", path: "C:\\Projects\\my-react-app", language: "JavaScript/TypeScript" },
    { name: "Python API", path: "C:\\Projects\\fastapi-backend", language: "Python" },
    { name: "Vue.js Project", path: "C:\\Projects\\vue-dashboard", language: "JavaScript" }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-slate-800 to-slate-900 relative overflow-hidden">
      {/* Анимированный фон */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="container mx-auto px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6">
              <Code2 className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-slate-300">Анализ проекта</span>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4 lg:text-4xl">
              Загрузите свой проект
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                для анализа
              </span>
            </h2>
            
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Выберите директорию с вашим проектом, и мы проанализируем его структуру, 
              найдем паттерны и предоставим AI-объяснения
            </p>
          </div>

          {/* Основная карточка ввода */}
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm shadow-2xl">
            <CardContent className="p-8">
              {/* Drag & Drop область */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
                  isDragOver 
                    ? 'border-blue-400 bg-blue-500/10' 
                    : inputFocused 
                      ? 'border-purple-400 bg-purple-500/5'
                      : 'border-white/20 hover:border-white/30'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* Иконки в фоне */}
                <div className="absolute top-4 right-4 opacity-20">
                  <div className="flex gap-2">
                    <FolderOpen className="h-6 w-6 text-blue-400" />
                    <Code2 className="h-6 w-6 text-purple-400" />
                    <Brain className="h-6 w-6 text-pink-400" />
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Основной ввод пути */}
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                          type="text"
                          placeholder="Введите путь к проекту (например: C:\Projects\my-app)"
                          value={projectPath}
                          onChange={(e) => setProjectPath(e.target.value)}
                          onFocus={() => setInputFocused(true)}
                          onBlur={() => setInputFocused(false)}
                          className="pl-12 pr-4 py-4 text-lg bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                        />
                      </div>
                      
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        size="lg"
                        className="px-6 py-4 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
                      >
                        <FolderOpen className="h-5 w-5 mr-2" />
                        Обзор
                      </Button>
                    </div>
                    
                    {/* Скрытый input для выбора файлов */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={() => {}} // Обработка выбора директории
                    />
                  </div>

                  {/* Статус и ошибки */}
                  {error && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                      <span className="text-red-200">{error}</span>
                    </div>
                  )}

                  {/* Drag & Drop подсказка */}
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-300">
                      Перетащите папку с проектом сюда или используйте поле ввода выше
                    </p>
                    <p className="text-sm text-slate-400 mt-2">
                      Поддерживаются: JavaScript, TypeScript, Python, React, Vue, Angular и другие
                    </p>
                  </div>

                  {/* Кнопка анализа */}
                  <div className="flex justify-center">
                    <Button
                      onClick={analyzeProject}
                      disabled={!projectPath.trim() || isAnalyzing}
                      size="lg"
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-2xl shadow-blue-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Анализируем...
                        </>
                      ) : (
                        <>
                          <Brain className="h-5 w-5 mr-2" />
                          Начать AI-анализ
                          <ArrowRight className="h-5 w-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Быстрые примеры */}
          <div className="mt-8">
            <div className="text-center mb-6">
              <p className="text-slate-400 text-sm">Или попробуйте один из примеров:</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {exampleProjects.map((project, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer hover:scale-105 transition-all duration-300 border-0 bg-white/5 hover:bg-white/10 backdrop-blur-sm"
                  onClick={() => setProjectPath(project.path)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">{project.name}</h4>
                        <p className="text-slate-400 text-sm">{project.language}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Индикаторы поддерживаемых технологий */}
          <div className="mt-12 text-center">
            <p className="text-slate-400 text-sm mb-4">Поддерживаемые технологии:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                'React', 'Vue', 'Angular', 'Next.js', 'Nuxt', 
                'TypeScript', 'JavaScript', 'Python', 'FastAPI', 
                'Django', 'Node.js', 'Express'
              ].map((tech) => (
                <Badge 
                  key={tech}
                  variant="secondary" 
                  className="bg-white/10 text-slate-300 border-white/20 hover:bg-white/20 transition-colors"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
