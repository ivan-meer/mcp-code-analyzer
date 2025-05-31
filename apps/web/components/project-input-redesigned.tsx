/**
 * Обновленный компонент ввода проекта с электрической эстетикой
 */

"use client"

import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FolderOpen, Loader2, Play, Upload, AlertCircle, 
  CheckCircle2, Folder, FileText, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ProjectInputProps {
  projectPath: string;
  setProjectPath: (path: string) => void;
  isAnalyzing: boolean;
  error: string | null;
  analyzeProject: () => void;
}

export function ProjectInput({ 
  projectPath, 
  setProjectPath, 
  isAnalyzing, 
  error, 
  analyzeProject 
}: ProjectInputProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Проверка поддержки File System API
  const supportsFileSystemAPI = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  // Выбор папки через File System API
  const handleSelectFolder = useCallback(async () => {
    if (!supportsFileSystemAPI) {
      fileInputRef.current?.click();
      return;
    }

    try {
      // @ts-ignore
      const directoryHandle = await window.showDirectoryPicker({
        mode: 'read'
      });
      
      // Сохраняем handle папки вместо только имени
      // Store directory handle in state
// Removed setDirectoryHandle since it's not defined and not needed
// The directoryHandle is used only for getting the name and files
      setProjectPath(directoryHandle.name);
      
      // Получаем список файлов для предварительного просмотра
      const fileList: string[] = [];
      for await (const [name, handle] of directoryHandle.entries()) {
        if (handle.kind === 'file') {
          fileList.push(name);
        }
      }
      setSelectedFiles(fileList.slice(0, 5));
      
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Ошибка выбора папки:', err);
      }
    }
  }, [supportsFileSystemAPI, setProjectPath]);

  // Fallback для браузеров без File System API
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const firstFile = files[0];
      // @ts-ignore
      const fullPath = firstFile.webkitRelativePath || firstFile.name;
      const folderPath = fullPath.split('/')[0];
      
      setProjectPath(folderPath);
      
      const fileNames = Array.from(files).map(file => 
        // @ts-ignore
        file.webkitRelativePath?.split('/').pop() || file.name
      );
      setSelectedFiles(fileNames.slice(0, 5));
    }
  }, [setProjectPath]);

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const items = e.dataTransfer.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          // @ts-ignore
          if (item.getAsFileSystemHandle) {
            // @ts-ignore
            item.getAsFileSystemHandle().then((handle: any) => {
              if (handle.kind === 'directory') {
                setProjectPath(handle.name);
              }
            });
          }
        }
      }
    }
  }, [setProjectPath]);

  const handleAnalyze = useCallback(() => {
    console.log('Button clicked');
    if (!projectPath) {
      return;
    }
    analyzeProject();
  }, [projectPath, analyzeProject]);

  console.log('DEBUG ProjectInput:', { projectPath, isAnalyzing, error, analyzeProjectType: typeof analyzeProject, projectPathType: typeof projectPath });
  const isValidPath = typeof projectPath === 'string' && projectPath.trim().length > 0;
  console.log('isValidPath:', isValidPath, 'projectPath:', projectPath, 'typeof:', typeof projectPath);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="max-w-lg mx-auto"
    >
      <Card className="group relative overflow-hidden glass border-blue-500/20 bg-slate-900/80 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:border-blue-400/40">
        {/* Электрический градиент на hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
        
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl text-white">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            Анализ проекта
          </CardTitle>
          <CardDescription className="text-base text-slate-300">
            Выберите папку с проектом или укажите путь для интеллектуального анализа кода
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Зона drag & drop */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-300 ${
              isDragOver
                ? 'border-blue-400 bg-blue-500/10'
                : 'border-slate-600 hover:border-slate-500'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <motion.div
                  animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isDragOver 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <FolderOpen className="w-6 h-6" />
                </motion.div>
              </div>
              
              <div>
                <p className="font-medium text-white">
                  {isDragOver ? 'Отпустите для выбора папки' : 'Перетащите папку сюда'}
                </p>
                <p className="text-sm text-slate-400">
                  или используйте кнопки ниже для выбора
                </p>
              </div>

              {/* Кнопки выбора */}
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={handleSelectFolder}
                  className="flex items-center gap-2 bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50 hover:border-blue-500/50"
                >
                  <Folder className="w-4 h-4" />
                  Выбрать папку
                </Button>

                {!supportsFileSystemAPI && (
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50 hover:border-blue-500/50"
                  >
                    <Upload className="w-4 h-4" />
                    Загрузить файлы
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Скрытый input для fallback */}
          <input
            ref={fileInputRef}
            type="file"
            // @ts-ignore
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Добавляем поле для ручного ввода пути */}
          <div className="mt-4">
            <label htmlFor="manual-path" className="block text-sm font-medium text-slate-300 mb-1">
              Или введите путь вручную
            </label>
            <Input
              id="manual-path"
              type="text"
              value={projectPath}
              onChange={(e) => setProjectPath(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="Введите полный путь к проекту"
              className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
            />
            {/* Восстановленная кнопка "Анализировать" */}
            <Button
              className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              onClick={handleAnalyze}
              disabled={!isValidPath || isAnalyzing}
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Анализируем...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Анализировать
                </>
              )}
            </Button>
          </div>

          {/* Превью выбранных файлов */}
          <AnimatePresence>
            {selectedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-white">
                    Выбранные файлы:
                  </span>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3 space-y-2">
                  {selectedFiles.map((fileName, index) => (
                    <motion.div
                      key={fileName}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-2 text-sm text-slate-300"
                    >
                      <FileText className="w-3 h-3" />
                      {fileName}
                    </motion.div>
                  ))}
                  {selectedFiles.length === 5 && (
                    <p className="text-xs text-slate-500">
                      ... и другие файлы
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ошибка */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-3"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Ошибка анализа</p>
                  <p className="mt-1 opacity-90">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Информация и примеры */}
          <div className="text-xs text-slate-400 space-y-3 pt-4 border-t border-slate-700">
            <div>
              <p className="font-medium mb-2 text-slate-300">Поддерживаемые форматы:</p>
              <div className="flex flex-wrap gap-1">
                {['JavaScript', 'TypeScript', 'Python', 'React', 'Vue', 'Node.js'].map((tech) => (
                  <span key={tech} className="px-2 py-1 bg-slate-800/50 rounded text-blue-300 text-xs border border-slate-600">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <p className="font-medium mb-2 text-slate-300">Примеры путей:</p>
              <div className="space-y-1">
                <code className="block bg-slate-800/30 px-2 py-1 rounded font-mono text-slate-300">
                  C:\Users\YourName\Projects\my-app
                </code>
                <code className="block bg-slate-800/30 px-2 py-1 rounded font-mono text-slate-300">
                  /home/user/projects/react-app
                </code>
                <code className="block bg-slate-800/30 px-2 py-1 rounded font-mono text-slate-300">
                  ~/Documents/code/my-project
                </code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
