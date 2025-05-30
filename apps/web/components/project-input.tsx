import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FolderOpen, Loader2, Play } from "lucide-react";

interface ProjectInputProps {
  projectPath: string;
  setProjectPath: (path: string) => void;
  isAnalyzing: boolean;
  error: string | null;
  analyzeProject: () => void;
}

export function ProjectInput({ projectPath, setProjectPath, isAnalyzing, error, analyzeProject }: ProjectInputProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="max-w-md mx-auto"
    >
      <Card className="group relative overflow-hidden border-border bg-background transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/5">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />
        <span className="absolute -left-px -top-px block size-3 border-l-2 border-t-2 border-blue-500 transition-all duration-300 group-hover:size-4" />
        <span className="absolute -right-px -top-px block size-3 border-r-2 border-t-2 border-blue-500 transition-all duration-300 group-hover:size-4" />
        <span className="absolute -bottom-px -left-px block size-3 border-b-2 border-l-2 border-blue-500 transition-all duration-300 group-hover:size-4" />
        <span className="absolute -bottom-px -right-px block size-3 border-b-2 border-r-2 border-blue-500 transition-all duration-300 group-hover:size-4" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Анализ проекта
          </CardTitle>
          <CardDescription className="text-base">
            Укажите путь к папке с вашим проектом для анализа
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="/path/to/your/project"
              value={projectPath}
              onChange={(e) => setProjectPath(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && analyzeProject()}
              className="transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500/30"
            />
            <Button 
              onClick={analyzeProject}
              disabled={isAnalyzing}
              className="shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className="ml-2">Анализировать</span>
            </Button>
          </div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2"
            >
              <span className="inline-block p-1 bg-red-100 dark:bg-red-900/30 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </span>
              {error}
            </motion.div>
          )}

          <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="font-medium">Примеры путей:</p>
            <code className="block bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono">
              C:\Users\YourName\Projects\my-app
            </code>
            <code className="block bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono">
              /home/user/projects/react-app
            </code>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
