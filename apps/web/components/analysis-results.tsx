import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FolderOpen, GitBranch, FileText, Code, Settings, Eye, FileJson, Globe, FileCode, HelpCircle,
  Component, FileCode2, Database, Terminal, Settings2, Package, ListTree, Shell, FileQuestion, Braces, Coffee,
  AlertCircle, Lightbulb, Wrench, // Icons for TODOs
  BookOpen, Download // Icons for Documentation tab and export
} from "lucide-react";
import { ProjectVisualization } from "@/components/visualization/project-visualization";

// TypeScript interfaces for documentation structure
interface DocFunctionParamInterface {
  name: string;
  type?: string | null;
  description?: string | null;
}

interface DocFunctionInterface {
  name: string;
  description?: string | null;
  params: DocFunctionParamInterface[];
  returns?: {
    type?: string | null;
    description?: string | null;
  } | null;
  line_start?: number | null;
  line_end?: number | null;
}

interface DocFileInterface {
  file_path: string;
  functions: DocFunctionInterface[];
}

const getFileIconColor = (type: string, name?: string) => { // Added optional name parameter
  if (name && name.toLowerCase() === 'dockerfile') return '#384D54'; // Docker blue/gray

  const colorMap: { [key: string]: string } = {
    'ts': '#3178c6',    // TypeScript blue
    'tsx': '#61dafb',   // React blue
    'js': '#f7df1e',    // JavaScript yellow
    'jsx': '#61dafb',   // React blue
    'py': '#3776ab',    // Python blue
    'vue': '#4FC08D',  // Vue green
    'java': '#f89820',  // Java orange
    'cs': '#239120',    // C# green
    'rb': '#CC342D',    // Ruby red
    'go': '#00ADD8',    // Go blue
    'swift': '#FFAC45', // Swift orange
    'kt': '#7F52FF',    // Kotlin purple
    'php': '#777BB4',   // PHP purple
    'rs': '#DEA584',    // Rust orange (rust-lang.org color)
    'yaml': '#CB171E',  // YAML red (often used)
    'yml': '#CB171E',   // YAML red
    'conf': '#009639',  // Nginx green (for .conf)
    'sh': '#4EAA25',    // Shell green
    'sql': '#CC2927',   // SQL/database red
    'css': '#1572b6',   // CSS blue
    'scss': '#c6538c',  // SCSS pink
    'html': '#e34f26',  // HTML orange
    'json': '#292929',  // JSON dark gray/black
    'md': '#083fa1',    // Markdown blue
    'config': '#f59e0b',// Generic config orange
    'test': '#10b981',  // Test green
    // 'dockerfile' key is not strictly needed here if name check handles it first,
    // but can be a fallback if type is somehow 'dockerfile'
    'dockerfile': '#384D54'
  };
  return colorMap[type] || '#64748b'; // Default slate gray
};

const getFileIcon = (type: string, name: string) => {
  // Handle specific filenames first
  if (name.toLowerCase() === 'dockerfile') {
    return <Package className="h-4 w-4 text-white" />;
  }

  const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
    'ts': FileCode2,
    'tsx': Component, // React icon
    'js': FileCode2,
    'jsx': Component, // React icon
    'py': FileCode2,  // Python
    'vue': Component, // Vue
    'java': Coffee,   // Java (using Coffee as a common visual metaphor)
    'cs': FileCode2,    // C#
    'rb': FileCode2,    // Ruby
    'go': FileCode2,    // Go
    'swift': FileCode2, // Swift
    'kt': FileCode2,    // Kotlin
    'php': FileCode2,   // PHP
    'rs': Braces,   // Rust (using Braces for its unique syntax feel, FileCode2 is also fine)
    'yaml': ListTree, // YAML
    'yml': ListTree,  // YAML
    'conf': Settings2,// Nginx .conf or other .conf files
    'sh': Terminal, // Shell script (using Terminal as FileTerminal is not available)
    'sql': Database,  // SQL
    'css': FileCode,
    'scss': FileCode,
    'html': Globe,
    'json': FileJson,
    'md': FileText,
    'config': Settings, // Generic config files (e.g. webpack.config.js if type is 'config')
    'test': Eye,        // Test files
    // 'dockerfile' key is not strictly needed here if name check handles it first
    'dockerfile': Package
  };
  const Icon = iconMap[type] || FileQuestion; // Default to FileQuestion for unknown types
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
  all_todos?: Array<{ // Added all_todos to the interface
    file_path: string;
    line: number;
    type: string;
    content: string;
    priority?: string;
  }>;
  project_documentation?: DocFileInterface[]; // Added project_documentation
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

  const generateMarkdownContent = (documentation?: DocFileInterface[]): string => {
    if (!documentation || documentation.length === 0) {
      return "# Project Documentation\n\nNo documentation details found.\n";
    }

    let markdown = `# Project Documentation\n\n`;

    documentation.forEach(fileDoc => {
      markdown += `## File: \`${fileDoc.file_path}\`\n\n`;
      if (fileDoc.functions.length === 0) {
        markdown += "_No functions documented in this file._\n\n";
      } else {
        fileDoc.functions.forEach(func => {
          markdown += `### Function: \`${func.name}\` (${func.line_start ? `Lines: ${func.line_start}-${func.line_end || func.line_start}` : 'N/A'})\n`;
          if (func.description) {
            markdown += `**Description:** ${func.description}\n\n`;
          } else {
            markdown += "_No description provided._\n\n";
          }

          if (func.params && func.params.length > 0) {
            markdown += `**Parameters:**\n`;
            markdown += `| Name | Type | Description |\n`;
            markdown += `|------|------|-------------|\n`;
            func.params.forEach(param => {
              markdown += `| \`${param.name}\` | ${param.type ? `\`${param.type}\`` : '*N/A*'} | ${param.description || '*N/A*'} |\n`;
            });
            markdown += `\n`;
          }

          if (func.returns) {
            markdown += `**Returns:**\n`;
            markdown += `*   **Type:** ${func.returns.type ? `\`${func.returns.type}\`` : '*N/A*'}\n`;
            if (func.returns.description) {
              markdown += `*   **Description:** ${func.returns.description}\n`;
            }
            markdown += `\n`;
          }
        });
      }
      markdown += `---\n\n`; // Separator between files
    });
    return markdown;
  };

  const downloadMarkdownFile = (content: string, filename: string = "documentation.md") => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Fallback for browsers that don't support download attribute
      window.open(encodeURI('data:text/markdown;charset=utf-8,' + content));
    }
  };


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
                <div className="text-center p-2 rounded-md bg-slate-50 dark:bg-slate-800/70">
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {analysisResult.metrics.total_files}
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">Файлов</div>
                </div>
                <div className="text-center p-2 rounded-md bg-slate-50 dark:bg-slate-800/70">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {analysisResult.metrics.total_lines.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">Строк кода</div>
                </div>
                <div className="text-center p-2 rounded-md bg-slate-50 dark:bg-slate-800/70">
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {analysisResult.metrics.total_functions}
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">Функций</div>
                </div>
                <div className="text-center p-2 rounded-md bg-slate-50 dark:bg-slate-800/70">
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {Math.round(analysisResult.metrics.avg_lines_per_file)}
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">Строк/файл</div>
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
            <TabsList className="grid w-full grid-cols-5"> {/* Updated to 5 columns */}
              <TabsTrigger value="visualization" className="relative group">
                Визуализация
                <HelpCircle className="h-3 w-3 ml-1 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
                {/* Tooltip content remains the same */}
              </TabsTrigger>
              <TabsTrigger value="files" className="relative group">
                Файлы
                <HelpCircle className="h-3 w-3 ml-1 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
                {/* Tooltip content remains the same */}
              </TabsTrigger>
              <TabsTrigger value="dependencies" className="relative group">
                Зависимости
                <HelpCircle className="h-3 w-3 ml-1 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
                {/* Tooltip content remains the same */}
              </TabsTrigger>
              <TabsTrigger value="todos" className="relative group">
                TODO/FIXME
                <HelpCircle className="h-3 w-3 ml-1 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
                {/* Tooltip content remains the same */}
              </TabsTrigger>
              <TabsTrigger value="documentation" className="relative group"> {/* New Documentation Tab */}
                Документация
                <BookOpen className="h-3 w-3 ml-1 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
                <div className="absolute hidden group-hover:block top-0 left-full ml-2 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-10 w-48">
                  Автоматически извлеченная документация из комментариев в коде.
                </div>
              </TabsTrigger>
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
                          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: getFileIconColor(file.type, file.name) }}>
                            {getFileIcon(file.type, file.name)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">{file.name}</div>
                            <div className="text-sm text-slate-700 dark:text-slate-300">
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
                  <CardTitle>Задачи и исправления (TODO/FIXME/HACK)</CardTitle>
                  {/* Placeholder for filtering controls - to be added when UI components are available
                  <div className="mt-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Filtering controls will go here.</p>
                  </div>
                  */}
                  <CardDescription>
                    {analysisResult.all_todos && analysisResult.all_todos.length > 0
                      ? `Найдено ${analysisResult.all_todos.length} задач/замечаний`
                      : "В текущем анализе не найдено задач или исправлений"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysisResult.all_todos && analysisResult.all_todos.length > 0 ? (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                      {analysisResult.all_todos.map((todo, index) => {
                        let IconComponent = Lightbulb;
                        let iconColor = "text-blue-500 dark:text-blue-400";
                        if (todo.type === 'FIXME') {
                          IconComponent = AlertCircle;
                          iconColor = "text-red-500 dark:text-red-400";
                        } else if (todo.type === 'HACK') {
                          IconComponent = Wrench;
                          iconColor = "text-orange-500 dark:text-orange-400";
                        }

                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg shadow hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start gap-3">
                              <IconComponent className={`h-5 w-5 mt-0.5 ${iconColor} flex-shrink-0`} />
                              <div className="flex-grow">
                                <div className="flex items-center justify-between mb-1">
                                  <Badge
                                    variant={todo.type === 'FIXME' ? 'destructive' : (todo.type === 'HACK' ? 'outline' : 'secondary')}
                                    className="text-xs"
                                  >
                                    {todo.type}
                                  </Badge>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {todo.file_path.split('/').pop()} : {todo.line}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-800 dark:text-slate-200 mb-1">
                                  {todo.content}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-500 truncate" title={todo.file_path}>
                                  {todo.file_path}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center p-6 text-slate-600 dark:text-slate-400">
                      <p>В коде проекта не найдено комментариев TODO, FIXME или HACK.</p>
                      <p className="mt-2">При следующем анализе все такие комментарии будут отображаться здесь.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documentation Tab Content */}
            <TabsContent value="documentation" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Документация проекта</CardTitle>
                    {analysisResult.project_documentation && analysisResult.project_documentation.length > 0 && (
                       <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadMarkdownFile(generateMarkdownContent(analysisResult.project_documentation), `${analysisResult.project_path.split('/').pop() || 'project'}-documentation.md`)}
                        >
                         <Download className="h-4 w-4 mr-2" />
                         Export to Markdown
                       </Button>
                    )}
                  </div>
                  <CardDescription>
                    Автоматически извлеченная документация из комментариев в исходном коде.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysisResult.project_documentation && analysisResult.project_documentation.length > 0 ? (
                    <div className="space-y-6 max-h-[700px] overflow-y-auto custom-scrollbar pr-2">
                      {analysisResult.project_documentation.map((fileDoc, fileIndex) => (
                        <motion.div
                          key={fileIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: fileIndex * 0.1 }}
                          className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                        >
                          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3 pb-2 border-b border-slate-300 dark:border-slate-600">
                            Файл: <code className="text-sky-600 dark:text-sky-400">{fileDoc.file_path.replace(analysisResult.project_path + '/', '')}</code>
                          </h2>
                          {fileDoc.functions.length > 0 ? (
                            <div className="space-y-4">
                              {fileDoc.functions.map((func, funcIndex) => (
                                <Card key={funcIndex} className="bg-slate-50 dark:bg-slate-800/50 shadow-sm">
                                  <CardHeader className="pb-2 pt-3 px-4">
                                    <CardTitle className="text-md font-medium text-slate-700 dark:text-slate-200">
                                      <span className="text-purple-600 dark:text-purple-400">function</span> <span className="text-amber-700 dark:text-amber-500">{func.name}</span>
                                      {func.line_start && <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">(L{func.line_start}-{func.line_end || func.line_start})</span>}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="px-4 pb-3 text-xs">
                                    {func.description && (
                                      <p className="text-slate-600 dark:text-slate-300 mb-2 italic">
                                        {func.description}
                                      </p>
                                    )}
                                    {!func.description && <p className="text-slate-500 dark:text-slate-400 mb-2 italic">No description provided.</p>}

                                    {func.params && func.params.length > 0 && (
                                      <div className="mt-2">
                                        <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-1">Parameters:</h4>
                                        <ul className="list-disc list-inside pl-2 space-y-1">
                                          {func.params.map((param, pIndex) => (
                                            <li key={pIndex} className="text-slate-500 dark:text-slate-400">
                                              <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded text-slate-700 dark:text-slate-300">{param.name}</code>
                                              {param.type && <span className="text-sky-600 dark:text-sky-400 text-xs"> ({param.type})</span>}: {param.description || <span className="italic">No description</span>}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {func.returns && (
                                      <div className="mt-2">
                                        <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-1">Returns:</h4>
                                        <p className="text-slate-500 dark:text-slate-400">
                                          {func.returns.type && <span className="text-sky-600 dark:text-sky-400 text-xs">({func.returns.type}) </span>}
                                          {func.returns.description || <span className="italic">No return description</span>}
                                        </p>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400 italic">No documented functions found in this file.</p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 text-slate-600 dark:text-slate-400">
                      <BookOpen className="h-12 w-12 mx-auto text-slate-400 mb-3" />
                      <p className="font-semibold">Документация не найдена.</p>
                      <p className="mt-1 text-sm">В проекте не найдено комментариев в формате DocString или JSDoc.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
