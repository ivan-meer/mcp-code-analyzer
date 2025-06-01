/**
 * Временная заглушка для компонента результатов анализа
 */

"use client"

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Added Button
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog'; // Added Dialog
import { FileCode, GitBranch, Users, Clock, ListTree, BarChart3, Network, Zap, AlertTriangle, Loader2, XCircle, ExternalLink } from 'lucide-react'; // Added more icons
import { getFileIcon, getFileIconColor } from '@/utils/file-icons.utils';
import ReactFlow, {
  Controls,
  Background,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  MarkerType, // For arrowheads
} from 'reactflow';
import 'reactflow/dist/style.css';
import ELK from 'elkjs/lib/elk.bundled.js';

// Syntax Highlighting
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup'; // For HTML, XML etc.
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/themes/prism-tomorrow.css'; // Theme for Prism

const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT', // Layout direction: UP, DOWN, LEFT, RIGHT
  'nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'spacing.nodeNode': '80', // Spacing between nodes
  'spacing.edgeNode': '30',
  'spacing.nodeNodeBetweenLayers': '100',
  'spacing.edgeEdgeBetweenLayers': '30',
  'layering.strategy': 'LONGEST_PATH',
};

const elk = new ELK();

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

// Custom Node for React Flow
const CustomNode = React.memo(({ data }: { data: { label: string; type: string; icon: React.FC<any>; iconColor: string } }) => {
  return (
    <div className="flex items-center p-2 rounded-md shadow-md" style={{ backgroundColor: data.iconColor, border: `1px solid ${data.iconColor}` }}>
      <div
        className="w-6 h-6 rounded-sm flex items-center justify-center mr-2 flex-shrink-0"
        style={{ backgroundColor: 'rgba(255,255,255,0.2)'}}
      >
        <data.icon className="h-4 w-4 text-white" />
      </div>
      <div className="text-white text-xs truncate" title={data.label}>
        {data.label}
      </div>
    </div>
  );
});
CustomNode.displayName = 'CustomNode';

const nodeTypes = {
  custom: CustomNode,
};


export function AnalysisResults({ data }: AnalysisResultsProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLayouting, setIsLayouting] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);

  // State for Code Viewing
  const [selectedFileForViewing, setSelectedFileForViewing] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isFetchingContent, setIsFetchingContent] = useState<boolean>(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);


  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  // Effect for Graph Layout
  useEffect(() => {
    if (!data || !data.files || !data.dependencies) {
      console.warn("Data for graph is incomplete:", data);
      setNodes([]); // Clear nodes if data is incomplete
      setEdges([]); // Clear edges if data is incomplete
      return;
    }
    setIsLayouting(true);
    setLayoutError(null);

    const currentInitialNodes: Node[] = data.files.map((file) => {
      const IconComponent = getFileIcon(file.type, file.name);
      const iconBgColor = getFileIconColor(file.type, file.name);
      return {
        id: file.path,
        type: 'custom',
        data: {
          label: file.name,
          type: file.type,
          icon: IconComponent,
          iconColor: iconBgColor,
        },
        position: { x: Math.random() * 400, y: Math.random() * 400 },
      };
    });

    const currentInitialEdges: Edge[] = data.dependencies.map((dep, index) => ({
      id: `e-${dep.from}-${dep.to}-${index}`,
      source: dep.from,
      target: dep.to,
      type: 'smoothstep',
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#FF0072' },
      style: { strokeWidth: 1.5, stroke: '#FF0072' },
    }));

    const graph = {
      id: 'root',
      layoutOptions: elkOptions,
      children: currentInitialNodes.map(node => ({
        id: node.id,
        width: 180,
        height: 40,
        layoutOptions: { 'portConstraints': 'FIXED_ORDER' },
      })),
      edges: currentInitialEdges.map(edge => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      })),
    };

    elk.layout(graph)
      .then((layoutedGraph) => {
        const layoutedNodes = layoutedGraph.children?.map((node: any) => ({
          ...currentInitialNodes.find(n => n.id === node.id)!,
          position: { x: node.x, y: node.y },
        })) || [];
        setNodes(layoutedNodes);
        setEdges(currentInitialEdges);
        setIsLayouting(false);
      })
      .catch((e) => {
        console.error('ELK layout error:', e);
        setLayoutError(`Error during graph layout: ${e.message}. Displaying with initial positions.`);
        setNodes(currentInitialNodes); // Fallback to initial positions
        setEdges(currentInitialEdges);
        setIsLayouting(false);
      });

  }, [data]);


  // Fetch File Content Function
  const fetchFileContent = async (filePath: string) => {
    setSelectedFileForViewing(filePath);
    setIsFetchingContent(true);
    setFileContent(null);
    setContentError(null);
    setIsModalOpen(true); // Open modal immediately

    try {
      // The mcp-server runs on port 8001 by default for its HTTP services (SSE, and now file content)
      const response = await fetch(`http://localhost:8001/api/file-content?path=${encodeURIComponent(filePath)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error ${response.status}` }));
        throw new Error(errorData.error || `Failed to fetch file content. Status: ${response.status}`);
      }
      const result = await response.json();
      setFileContent(result.content);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error("Error fetching file content:", errorMessage);
      setContentError(errorMessage);
      setFileContent(null); // Ensure no stale content is shown
    } finally {
      setIsFetchingContent(false);
    }
  };

  const getFileExtension = (filePath: string | null): string => {
    if (!filePath) return 'clike'; // Default if no path
    const name = filePath.split(/[/\\]/).pop() || '';
    const ext = name.split('.').pop() || '';
    if (languages[ext]) return ext;
    if (ext === 'tsx' || ext === 'jsx') return 'javascript'; // Prism uses 'javascript' for JSX/TSX
    return 'clike'; // Default for unknown extensions
  };


  const MemoizedFileIcon = React.memo(({ fileType, fileName }: { fileType: string, fileName: string }) => {
    const IconComponent = getFileIcon(fileType, fileName);
    const iconColor = getFileIconColor(fileType, fileName);
    return (
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center mr-3 flex-shrink-0"
        style={{ backgroundColor: iconColor }}
      >
        <IconComponent className="h-4 w-4 text-white" />
      </div>
    );
  });
  MemoizedFileIcon.displayName = 'MemoizedFileIcon';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="glass border-blue-500/20 bg-slate-900/80 backdrop-blur-xl shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-white text-2xl">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center shadow-md">
              <FileCode className="h-5 w-5 text-white" />
            </div>
            Результаты анализа
          </CardTitle>
          <CardDescription className="text-slate-300 pt-1">
            Интеллектуальный анализ структуры проекта завершен. Проект: {data.project_path}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 bg-slate-800/60 border-slate-700/50">
              <TabsTrigger value="overview" className="text-slate-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Users className="w-4 h-4 mr-2" /> Обзор
              </TabsTrigger>
              <TabsTrigger value="files" className="text-slate-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <ListTree className="w-4 h-4 mr-2" /> Файлы проекта
              </TabsTrigger>
              <TabsTrigger value="dependencies" className="text-slate-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Network className="w-4 h-4 mr-2" /> Зависимости
              </TabsTrigger>
              <TabsTrigger value="statistics" className="text-slate-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <BarChart3 className="w-4 h-4 mr-2" /> Статистика
              </TabsTrigger>
            </TabsList>

            {/* Обзор Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-lg text-sky-300">Основные метрики</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 rounded-lg bg-slate-700/30">
                      <div className="text-3xl font-bold text-gradient mb-1">
                        {data.metrics.total_files}
                      </div>
                      <div className="text-sm text-slate-400">Файлов</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-slate-700/30">
                      <div className="text-3xl font-bold text-gradient mb-1">
                        {data.metrics.total_lines.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-400">Строк кода</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-slate-700/30">
                      <div className="text-3xl font-bold text-gradient mb-1">
                        {data.metrics.total_functions}
                      </div>
                      <div className="text-sm text-slate-400">Функций</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-slate-700/30">
                      <div className="text-3xl font-bold text-gradient mb-1">
                        {data.dependencies.length}
                      </div>
                      <div className="text-sm text-slate-400">Связей</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-sky-300 flex items-center">
                      <GitBranch className="h-5 w-5 mr-2" /> Технологический стек
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {data.metrics.languages.map(language => (
                        <Badge
                          key={language}
                          variant="secondary"
                          className="bg-sky-500/20 text-sky-300 border-sky-500/30 hover:bg-sky-500/30 transition-colors"
                        >
                          {language}
                        </Badge>
                      ))}
                       {data.metrics.languages.length === 0 && <p className="text-slate-400 text-sm">Технологии не определены.</p>}
                    </div>
                  </CardContent>
                </Card>

                {data.architecture_patterns.length > 0 && (
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-lg text-sky-300 flex items-center">
                        <Users className="h-5 w-5 mr-2" /> Архитектурные паттерны
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {data.architecture_patterns.map(pattern => (
                          <Badge
                            key={pattern}
                            variant="outline"
                            className="border-purple-500/30 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
                          >
                            {pattern}
                          </Badge>
                        ))}
                      </div>
                       {data.architecture_patterns.length === 0 && <p className="text-slate-400 text-sm">Архитектурные паттерны не определены.</p>}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Файлы проекта Tab */}
            <TabsContent value="files">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-lg text-sky-300">Список файлов проекта ({data.files.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
                    {data.files.map((file, index) => (
                      <motion.div
                        key={file.path}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02, duration: 0.3 }}
                        className="flex items-center justify-between p-3 rounded-md bg-slate-700/40 hover:bg-slate-700/60 transition-colors border border-slate-600/50 cursor-pointer group"
                        onClick={() => fetchFileContent(file.path)}
                      >
                        <div className="flex items-center min-w-0">
                          <MemoizedFileIcon fileType={file.type} fileName={file.name} />
                          <div className="flex-grow min-w-0">
                            <div className="font-medium text-white truncate group-hover:text-blue-400" title={file.name}>{file.name}</div>
                            <div className="text-xs text-slate-400 truncate" title={file.path}>{file.path}</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className="text-sm text-slate-300">
                            {file.lines_of_code != null ? `${file.lines_of_code} строк` : 'N/A'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {file.functions?.length || 0} функций
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {data.files.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Файлы не найдены.</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Зависимости Tab (Placeholder) */}
            <TabsContent value="dependencies">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-lg text-sky-300 flex items-center">
                    <Network className="w-5 h-5 mr-2" /> Карта зависимостей
                  </CardTitle>
                </CardHeader>
                <CardContent style={{ height: '600px', minHeight: '400px' }} className="relative">
                  {isLayouting && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/50 z-10">
                      <Zap className="w-12 h-12 text-blue-500 animate-ping mb-4" />
                      <p className="text-slate-300 text-lg">Построение графа зависимостей...</p>
                    </div>
                  )}
                  {layoutError && !isLayouting && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/80 z-10 p-4">
                        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-3" />
                        <p className="text-yellow-300 text-center font-semibold mb-2">Ошибка при автоматическом расположении узлов</p>
                        <p className="text-slate-400 text-xs text-center">{layoutError}</p>
                        <p className="text-slate-400 text-xs text-center mt-1">Граф может отображаться некорректно.</p>
                    </div>
                  )}
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes} // Register custom node types
                    fitView
                    className="bg-slate-900/50 rounded-md"
                  >
                    <Controls className="react-flow-controls" />
                    <Background gap={16} color="#334155" />
                  </ReactFlow>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Статистика Tab (Placeholder) */}
            <TabsContent value="statistics">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-lg text-sky-300 flex items-center">
                     <BarChart3 className="w-5 h-5 mr-2" /> Дополнительная статистика
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-60 flex items-center justify-center">
                  <p className="text-slate-400">Более детальная статистика появится здесь.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal for File Content Viewing */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl w-[90vw] h-[80vh] bg-slate-900/90 backdrop-blur-md border-slate-700 text-white flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate text-lg text-sky-300" title={selectedFileForViewing || "Просмотр файла"}>
              {selectedFileForViewing ? selectedFileForViewing.split(/[/\\]/).pop() : "Просмотр файла"}
            </DialogTitle>
            <p className="text-xs text-slate-400 truncate">{selectedFileForViewing}</p>
          </DialogHeader>

          <div className="flex-grow overflow-y-auto relative border border-slate-700 rounded-md bg-slate-850">
            {isFetchingContent && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/70 z-10">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                <p className="text-slate-300">Загрузка содержимого файла...</p>
              </div>
            )}
            {contentError && !isFetchingContent && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/90 z-10 p-6">
                <XCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-red-400 font-semibold text-lg mb-2">Ошибка загрузки файла</p>
                <p className="text-slate-400 text-sm text-center bg-red-900/30 p-3 rounded-md">{contentError}</p>
              </div>
            )}
            {fileContent && !isFetchingContent && !contentError && (
              <Editor
                value={fileContent}
                onValueChange={() => {}} // Read-only
                highlight={code => {
                    const extension = getFileExtension(selectedFileForViewing);
                    const grammar = languages[extension] || languages.clike;
                    return highlight(code, grammar, extension);
                }}
                padding={10}
                style={{
                  fontFamily: '"Fira Code", "Fira Mono", monospace',
                  fontSize: 14,
                  backgroundColor: 'transparent', // Editor itself is transparent, parent div has bg
                  minHeight: '100%', // Ensure it fills the parent for scrolling
                }}
                readOnly
                className="code-editor-textarea" // For potential global styling
              />
            )}
             {!fileContent && !isFetchingContent && !contentError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                    <p>Содержимое файла не было загружено.</p>
                </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white">
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
