'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';

interface ProjectVisualizationProps {
  data: {
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
  };
}

interface Node {
  id: string;
  name: string;
  type: string;
  size: number;
  linesOfCode?: number;
  functions: string[];
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string | Node;
  target: string | Node;
  type: string;
}

export function ProjectVisualization({ data }: ProjectVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });

  // Цвета для разных типов файлов
  const getFileColor = (type: string) => {
    const colors: Record<string, string> = {
      'js': '#f7df1e',
      'ts': '#3178c6',
      'tsx': '#61dafb',
      'jsx': '#61dafb',
      'py': '#3776ab',
      'css': '#1572b6',
      'html': '#e34f26',
      'json': '#000000',
      'md': '#083fa1',
      'unknown': '#6b7280'
    };
    return colors[type] || colors.unknown;
  };

  // Размер узла в зависимости от количества строк кода
  const getNodeSize = (file: any) => {
    const baseSize = 20;
    const lines = file.lines_of_code || 0;
    return Math.max(baseSize, Math.min(80, baseSize + lines / 20));
  };

  useEffect(() => {
    if (!svgRef.current || !data.files.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    // Подготавливаем данные для D3
    const nodes: Node[] = data.files.map(file => ({
      id: file.path,
      name: file.name,
      type: file.type,
      size: file.size,
      linesOfCode: file.lines_of_code,
      functions: file.functions
    }));

    const links: Link[] = data.dependencies.map(dep => ({
      source: dep.from,
      target: dep.to,
      type: dep.type
    }));

    // Создаем контейнер с zoom
    const container = svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('border', '1px solid #e2e8f0')
      .style('border-radius', '8px');

    const g = container.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setTransform({
          x: event.transform.x,
          y: event.transform.y,
          k: event.transform.k
        });
      });

    container.call(zoom);

    // Создаем симуляцию
    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links)
        .id(d => d.id)
        .distance(100)
        .strength(0.1)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => getNodeSize(d) + 5));

    // Добавляем стрелки для связей
    const defs = g.append('defs');
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#6b7280');

    // Рисуем связи
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#6b7280')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    // Рисуем узлы
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', d => getNodeSize(d))
      .attr('fill', d => getFileColor(d.type))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedNode(d);
      })
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke', '#000000')
          .attr('stroke-width', 3);
        
        // Показываем tooltip
        const tooltip = d3.select('body')
          .append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0, 0, 0, 0.8)')
          .style('color', 'white')
          .style('padding', '8px')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .html(`
            <strong>${d.name}</strong><br/>
            Тип: ${d.type}<br/>
            ${d.linesOfCode ? `Строк: ${d.linesOfCode}<br/>` : ''}
            Функций: ${d.functions.length}
          `);

        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);
        
        d3.selectAll('.tooltip').remove();
      });

    // Добавляем подписи к узлам
    const label = g.append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .text(d => d.name.length > 15 ? d.name.substring(0, 12) + '...' : d.name)
      .attr('font-size', '10px')
      .attr('font-family', 'Inter, sans-serif')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#1f2937')
      .style('pointer-events', 'none');

    // Drag behavior
    const drag = d3.drag<SVGCircleElement, Node>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag);

    // Обновление позиций при симуляции
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);

      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      label
        .attr('x', d => d.x!)
        .attr('y', d => d.y! + getNodeSize(d) + 15);
    });

    // Cleanup
    return () => {
      simulation.stop();
      d3.selectAll('.tooltip').remove();
    };
  }, [data]);

  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
      1.5
    );
  };

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
      1 / 1.5
    );
  };

  const handleReset = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity
    );
  };

  return (
    <div className="space-y-4">
      {/* Visualization Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                🗺️ Карта проекта
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Интерактивная визуализация структуры проекта и зависимостей
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid lg:grid-cols-4 gap-4">
            {/* Main Visualization */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-slate-800 rounded-lg p-4"
              >
                <svg ref={svgRef} className="w-full h-auto max-h-[600px]" />
              </motion.div>
              
              {/* Legend */}
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Легенда
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                    <span>JavaScript</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                    <span>TypeScript</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-cyan-400"></div>
                    <span>React</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-700"></div>
                    <span>Python</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span>CSS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-600"></div>
                    <span>HTML</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-600"></div>
                    <span>Другие</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                  <p><strong>Управление:</strong> Перетаскивайте узлы • Колесо мыши для масштабирования • Клик для деталей</p>
                  <p><strong>Размер узла:</strong> зависит от количества строк кода</p>
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <div className="space-y-4">
              {/* Selected File Details */}
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Детали файла</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-semibold">{selectedNode.name}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 break-all">
                          {selectedNode.id}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Тип:</span>
                          <Badge variant="outline">{selectedNode.type}</Badge>
                        </div>
                        
                        {selectedNode.linesOfCode && (
                          <div className="flex justify-between">
                            <span className="text-sm">Строк кода:</span>
                            <span className="text-sm font-medium">{selectedNode.linesOfCode}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-sm">Функций:</span>
                          <span className="text-sm font-medium">{selectedNode.functions.length}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm">Размер:</span>
                          <span className="text-sm font-medium">
                            {(selectedNode.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>

                      {selectedNode.functions.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2">Функции:</h5>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {selectedNode.functions.slice(0, 10).map((func, index) => (
                              <div key={index} className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                {func}
                              </div>
                            ))}
                            {selectedNode.functions.length > 10 && (
                              <div className="text-xs text-slate-500">
                                +{selectedNode.functions.length - 10} ещё...
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setSelectedNode(null)}
                      >
                        Закрыть
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* File Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Распределение файлов</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(
                      data.files.reduce((acc, file) => {
                        acc[file.type] = (acc[file.type] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort(([,a], [,b]) => b - a)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getFileColor(type) }}
                            />
                            <span className="text-sm">{type}</span>
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Статистика</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Zoom:</span>
                    <span>{(transform.k * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Узлов:</span>
                    <span>{data.files.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Связей:</span>
                    <span>{data.dependencies.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Средний размер:</span>
                    <span>{Math.round(data.metrics.avg_lines_per_file)} строк</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
