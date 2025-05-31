'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Network, RotateCcw, Eye, EyeOff, Maximize2, FileText, Code, GitBranch, Settings, Filter, ChevronRight, ChevronLeft } from 'lucide-react';

interface ProjectData {
  files: Array<{
    path: string;
    name?: string;
    type?: string;
    size: number;
    lines_of_code?: number;
    functions?: string[];
    imports?: string[];
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
    languages: string[];
    complexity_score?: number;
  };
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: string;
  size: number;
  group: string;
  lines?: number;
  functions: string[];
  imports?: string[];
  exports?: string[];
  complexity?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  type: string;
  weight?: number;
}

export function ProjectVisualization({ data }: { data: ProjectData }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Enhanced color schemes for different file types and relationships
  const getNodeColor = useCallback((node: Node) => {
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
      'test': '#10b981',
      'react': '#61dafb',
      'vue': '#42b983',
      'angular': '#dd0031',
      'node': '#68a063',
      'express': '#259dff',
      'django': '#092e20',
      'flask': '#000000'
    };
    
    // Determine node category for more sophisticated coloring
    if (node.name && (node.name.includes('test') || node.name.includes('spec'))) {
      return colorMap.test;
    }
    if (node.name && (node.name.includes('config') || node.name.includes('.config.'))) {
      return colorMap.config;
    }
    if (node.name && node.name.toLowerCase().includes('react')) {
      return colorMap.react;
    }
    if (node.name && node.name.toLowerCase().includes('vue')) {
      return colorMap.vue;
    }
    if (node.name && node.name.toLowerCase().includes('angular')) {
      return colorMap.angular;
    }
    if (node.name && node.name.toLowerCase().includes('node')) {
      return colorMap.node;
    }
    if (node.name && node.name.toLowerCase().includes('express')) {
      return colorMap.express;
    }
    if (node.name && node.name.toLowerCase().includes('django')) {
      return colorMap.django;
    }
    if (node.name && node.name.toLowerCase().includes('flask')) {
      return colorMap.flask;
    }
    
    return colorMap[node.type] || '#64748b';
  }, []);

  const getNodeIcon = useCallback((type: string) => {
    const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
      'ts': Code,
      'tsx': Code,
      'js': Code,
      'jsx': Code,
      'py': FileText,
      'css': FileText,
      'scss': FileText,
      'html': FileText,
      'json': FileText,
      'md': FileText,
      'config': Settings,
      'test': Eye,
      'react': Code,
      'vue': Code,
      'angular': Code,
      'node': GitBranch,
      'express': GitBranch,
      'django': GitBranch,
      'flask': GitBranch
    };
    return iconMap[type] || FileText;
  }, []);

  const getNodeSize = useCallback((node: Node) => {
    // Calculate node size based on lines of code and complexity
    const baseSize = 8;
    const sizeFromLines = Math.min(30, (node.lines || 0) / 50);
    const sizeFromComplexity = Math.min(15, (node.complexity || 0) * 2);
    return Math.max(baseSize, baseSize + sizeFromLines + sizeFromComplexity);
  }, []);

  const resetZoom = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    svg.transition()
      .duration(750)
      .call(
        // @ts-ignore - D3 zoom types can be complex
        d3.zoom().transform,
        d3.zoomIdentity
      );
    setZoomLevel(1);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data || !data.files.length) return;

    // Clear any existing visualization to prevent memory leaks
    d3.select(svgRef.current).selectAll('*').remove();

    const containerRect = svgRef.current.parentElement?.getBoundingClientRect();
    const width = containerRect?.width || 800;
    const height = isFullscreen ? window.innerHeight - 100 : 600;

    // Transform the project data into nodes and links for D3
    const nodes: Node[] = data.files
      .filter(file => filterType === 'all' || file.type === filterType)
      .map(file => ({
        id: file.path,
        name: file.name || 'Unnamed',
        type: file.type || 'unknown',
        size: file.lines_of_code || 10,
        group: file.type || 'unknown',
        lines: file.lines_of_code,
        functions: file.functions || [],
        imports: file.imports || [],
        exports: file.exports || [],
        complexity: file.complexity || 1
      }));

    const links: Link[] = data.dependencies
      .filter(dep => 
        nodes.some(n => n.id === dep.from) && 
        nodes.some(n => n.id === dep.to)
      )
      .map(dep => ({
        source: dep.from,
        target: dep.to,
        type: dep.type,
        weight: dep.weight || 1
      }));

    // Create the SVG container with zoom and pan capabilities
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Add a subtle grid pattern for better spatial awareness
    const defs = svg.append('defs');
    
    // Define gradient for links
    const linkGradient = defs.append('linearGradient')
      .attr('id', 'linkGradient')
      .attr('gradientUnits', 'userSpaceOnUse');
    
    linkGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#8b5cf6')
      .attr('stop-opacity', 0.8);
    
    linkGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#06b6d4')
      .attr('stop-opacity', 0.4);

    // Add grid pattern for better visual organization
    const pattern = defs.append('pattern')
      .attr('id', 'grid')
      .attr('width', 50)
      .attr('height', 50)
      .attr('patternUnits', 'userSpaceOnUse');
    
    pattern.append('path')
      .attr('d', 'M 50 0 L 0 0 0 50')
      .attr('fill', 'none')
      .attr('stroke', '#374151')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.1);

    // Add the grid background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#grid)');

    // Create the main group for zoom/pan transformations - using clear, unique variable name
    const visualizationGroup = svg.append('g');

    // Setup the force simulation with enhanced physics
    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links)
        .id(d => d.id)
        .distance(d => 80 + (d.weight || 1) * 20)
        .strength(0.3)
      )
      .force('charge', d3.forceManyBody<Node>()
        .strength(d => -200 - ((d as Node).size * 2))
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<Node>()
        .radius(d => getNodeSize(d as Node) + 5)
      )
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1));

    // Create enhanced links with directional arrows and animations
    const linkContainer = visualizationGroup.append('g').attr('class', 'links');
    
    const linkElements = linkContainer
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', 'url(#linkGradient)')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt((d.weight || 1) * 2))
      .attr('marker-end', 'url(#arrowhead)')
      .style('cursor', 'pointer');

    // Add arrowheads for directed relationships
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#06b6d4')
      .attr('opacity', 0.7);

    // Create sophisticated nodes with enhanced visual design
    const nodeContainer = visualizationGroup.append('g').attr('class', 'nodes');
    
    const nodeElements = nodeContainer
      .selectAll('g')
      .data(nodes)
      .join('g')
      // @ts-ignore - TypeScript issue with D3 drag types
      .call(d3.drag<SVGGElement, Node, unknown>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          (d as Node).fx = (d as Node).x;
          (d as Node).fy = (d as Node).y;
        })
        .on('drag', (event, d) => {
          (d as Node).fx = event.x;
          (d as Node).fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          (d as Node).fx = null;
          (d as Node).fy = null;
        })
      )
      .style('cursor', 'pointer');

    // Add node circles
    nodeElements.append('circle')
      .attr('r', d => getNodeSize(d))
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))');

    // Add node icons (simplified as text here, can be replaced with actual icons)
    nodeElements.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .text(d => d.type.slice(0, 2).toUpperCase())
      .style('font-size', '8px')
      .style('pointer-events', 'none');

    // Add interactive hover effects that provide immediate visual feedback
    nodeElements
      .on('mouseover', function(event, d) {
        // Highlight the current node and its connections
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('stroke-width', 4)
          .attr('r', getNodeSize(d) + 3);
          
        // Highlight connected links
        linkElements
          .transition()
          .duration(200)
          .attr('stroke-opacity', l => 
            ((l.source as Node).id === d.id || (l.target as Node).id === d.id) ? 1 : 0.2
          );
          
        // Show tooltip with basic information
        const tooltip = visualizationGroup.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${d.x! + getNodeSize(d) + 10}, ${d.y! - 10})`);
          
        const tooltipRect = tooltip.append('rect')
          .attr('fill', 'rgba(0, 0, 0, 0.9)')
          .attr('stroke', getNodeColor(d))
          .attr('stroke-width', 1)
          .attr('rx', 6);
          
        const tooltipText = tooltip.append('text')
          .attr('fill', 'white')
          .attr('font-size', '12px')
          .attr('x', 8)
          .attr('y', 16);
          
        tooltipText.append('tspan')
          .text(d.name)
          .attr('font-weight', 'bold');
          
        tooltipText.append('tspan')
          .text(`${d.lines || 0} lines`)
          .attr('x', 8)
          .attr('dy', '1.2em');
          
        const bbox = tooltipText.node()?.getBBox();
        if (bbox) {
          tooltipRect
            .attr('width', bbox.width + 16)
            .attr('height', bbox.height + 12);
        }
      })
      .on('mouseout', function(event, d) {
        // Reset visual states when hover ends
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('stroke-width', 2)
          .attr('r', getNodeSize(d));
          
        linkElements
          .transition()
          .duration(200)
          .attr('stroke-opacity', 0.6);
          
        visualizationGroup.selectAll('.tooltip').remove();
      })
      .on('click', (event, d) => {
        // Set the selected node for detailed information panel
        setSelectedNode(d);
        event.stopPropagation();
      });

    // Add labels that appear conditionally based on zoom level and user preference
    const labelContainer = visualizationGroup.append('g').attr('class', 'labels');
    
    const labelElements = labelContainer
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text(d => {
        // Intelligently truncate long filenames while preserving important information
        if (d.name.length > 15) {
          const parts = d.name.split('.');
          const extension = parts.pop();
          const baseName = parts.join('.');
          return baseName.slice(0, 12) + '...' + (extension ? `.${extension}` : '');
        }
        return d.name;
      })
      .attr('font-size', '11px')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .attr('stroke', 'rgba(0,0,0,0.5)')
      .attr('stroke-width', 3)
      .attr('paint-order', 'stroke')
      .style('pointer-events', 'none')
      .style('user-select', 'none')
      .style('display', showLabels ? 'block' : 'none');

    // Implement smooth zoom and pan functionality with intelligent constraints
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5])
      .on('zoom', (event) => {
        const transform = event.transform;
        visualizationGroup.attr('transform', transform);
        setZoomLevel(transform.k);
        
        // Intelligently adjust label visibility based on zoom level
        labelElements.style('display', (showLabels && transform.k > 0.6) ? 'block' : 'none');
        
        // Adjust font size dynamically for better readability at different zoom levels
        labelElements.attr('font-size', Math.max(8, Math.min(14, 11 * transform.k)));
      });

    svg.call(zoomBehavior);

    // Create a smooth animation loop that updates all visual elements
    simulation.on('tick', () => {
      // Update link positions with smooth interpolation
      linkElements
        .attr('x1', d => ((d.source as Node).x || 0))
        .attr('y1', d => ((d.source as Node).y || 0))
        .attr('x2', d => ((d.target as Node).x || 0))
        .attr('y2', d => ((d.target as Node).y || 0));

      // Update node positions
      nodeElements
        .attr('transform', d => `translate(${d.x! - getNodeSize(d)/2}, ${d.y! - getNodeSize(d)/2})`);

      // Update label positions to follow their corresponding nodes
      labelElements
        .attr('x', d => d.x!)
        .attr('y', d => d.y! + getNodeSize(d) + 15);
    });

    // Add click handler to deselect nodes when clicking on empty space
    svg.on('click', () => {
      setSelectedNode(null);
    });

    // Cleanup function to prevent memory leaks and ensure smooth transitions
    return () => {
      simulation.stop();
      d3.select(svgRef.current).selectAll('*').remove();
    };
  }, [data, filterType, showLabels, isFullscreen, getNodeColor, getNodeSize]);

  // Early return with helpful message if no data is available
  if (!data || !data.files.length) {
    return (
      <Card className="glass">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Network className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Нет данных для визуализации
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Загрузите проект для анализа и построения графа зависимостей
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md p-6' : ''}`}>
      {/* Enhanced Header with Advanced Controls */}
      <Card className="glass border-purple-500/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse-glow">
                <Network className="h-5 w-5 text-white" />
              </div>
              <div>
              <CardTitle className="text-xl text-white font-bold">
                Граф знаний проекта
              </CardTitle>
              <CardDescription className="text-slate-200 font-medium">
                Интерактивная визуализация архитектуры и связей между компонентами
              </CardDescription>
              </div>
            </div>
            
            {/* Advanced Control Panel */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLabels(!showLabels)}
                className="glass border-white/20 hover:bg-white/10"
              >
                {showLabels ? <Eye className="h-4 w-4 text-white" /> : <EyeOff className="h-4 w-4 text-white" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="glass border-white/20 hover:bg-white/10"
              >
                <Maximize2 className="h-4 w-4 text-white" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={resetZoom}
                className="glass border-white/20 hover:bg-white/10"
              >
                <RotateCcw className="h-4 w-4 text-white" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="glass border-white/20 hover:bg-white/10"
              >
                {isSidebarOpen ? <ChevronRight className="h-4 w-4 text-white" /> : <ChevronLeft className="h-4 w-4 text-white" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Enhanced Project Statistics and File Type Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <FileText className="h-4 w-4 text-blue-400" />
              <span className="font-medium">{data.metrics.total_files} файлов</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Code className="h-4 w-4 text-green-400" />
              <span className="font-medium">{data.metrics.total_lines.toLocaleString()} строк</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <GitBranch className="h-4 w-4 text-purple-400" />
              <span className="font-medium">{data.dependencies.length} связей</span>
            </div>
            
            {data.metrics.complexity_score && (
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <Settings className="h-4 w-4 text-yellow-400" />
                <span className="font-medium">Сложность: {data.metrics.complexity_score}</span>
              </div>
            )}
          </div>
          
          {/* File Type Filters with Enhanced Design */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <Filter className="h-4 w-4 text-cyan-400" />
              Фильтр по типу:
            </div>
            
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
              className="h-7 px-3 text-xs"
            >
              Все типы
            </Button>
            
            {data.metrics.languages.map(lang => {
              const fileCount = data.files.filter(f => f.type === lang).length;
              return (
                <Button
                  key={lang}
                  variant={filterType === lang ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType(lang)}
                  className="h-7 px-3 text-xs glass"
                >
                  <span className="w-2 h-2 rounded-full mr-2" 
                        style={{ backgroundColor: getNodeColor({ type: lang } as Node) }} />
                  {lang.toUpperCase()} ({fileCount})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Visualization Container */}
      <div className="grid grid-cols-1 gap-6 relative">
        {/* Enhanced Graph Visualization */}
        <Card className={`glass border-purple-500/20 ${isSidebarOpen ? 'col-span-1' : 'col-span-full'}`}>
          <CardContent className="p-0">
            <div className="relative">
              <svg 
                ref={svgRef} 
                className="w-full border-0 rounded-lg bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900"
                style={{ minHeight: isFullscreen ? 'calc(100vh - 200px)' : '600px' }}
              />
              
              {/* Zoom Level Indicator */}
              <div className="absolute top-4 left-4 glass rounded-lg px-3 py-1">
              <span className="text-xs text-white font-bold">
                Масштаб: {Math.round(zoomLevel * 100)}%
              </span>
              </div>
              
              {/* Interactive Help Overlay */}
              <div className="absolute bottom-4 left-4 glass rounded-lg p-3 max-w-xs">
                <div className="text-xs text-slate-200 font-medium space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Перетаскивайте узлы для изменения расположения</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    <span>Кликните на узел для подробной информации</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Используйте колесо мыши для масштабирования</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced File Information Sidebar */}
        {selectedNode && isSidebarOpen && (
          <Card className="glass border-cyan-500/20 col-span-1 lg:col-span-1 max-w-xs absolute right-0 top-0 h-full overflow-y-auto shadow-xl z-10">
            <CardHeader className="pb-4 bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: getNodeColor(selectedNode) }}
                >
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-medium truncate text-white">
                    {selectedNode.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-300">
                    {selectedNode.type.toUpperCase()} файл
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 pt-4">
              {/* File Metrics */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Строк кода:</span>
                  <Badge variant="secondary" className="font-mono bg-slate-700 text-slate-200">
                    {selectedNode.lines?.toLocaleString() || 0}
                  </Badge>
                </div>
                
                {selectedNode.functions && selectedNode.functions.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Функций:</span>
                    <Badge variant="outline" className="bg-slate-700 text-slate-200">
                      {selectedNode.functions.length}
                    </Badge>
                  </div>
                )}
                
                {selectedNode.complexity && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Сложность:</span>
                    <Badge 
                      variant={selectedNode.complexity > 5 ? "destructive" : "secondary"}
                      className="bg-slate-700 text-slate-200"
                    >
                      {selectedNode.complexity}
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* Function List */}
              {selectedNode.functions && selectedNode.functions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-slate-200">
                    Функции ({selectedNode.functions.length}):
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedNode.functions.slice(0, 10).map((func, index) => (
                      <div 
                        key={index}
                        className="text-xs font-mono bg-slate-800 rounded px-2 py-1 truncate text-slate-300"
                        title={func}
                      >
                        {func}
                      </div>
                    ))}
                    {selectedNode.functions.length > 10 && (
                      <div className="text-xs text-slate-400 text-center pt-1">
                        +{selectedNode.functions.length - 10} больше...
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Import/Export Information */}
              {selectedNode.imports && selectedNode.imports.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-slate-200">
                    Импорты ({selectedNode.imports.length}):
                  </h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {selectedNode.imports.slice(0, 5).map((imp, index) => (
                      <div 
                        key={index}
                        className="text-xs font-mono bg-blue-900/20 rounded px-2 py-1 truncate text-slate-300"
                        title={imp || 'Unnamed Import'}
                      >
                        {imp || 'Unnamed Import'}
                      </div>
                    ))}
                    {selectedNode.imports.length > 5 && (
                      <div className="text-xs text-slate-400 text-center pt-1">
                        +{selectedNode.imports.length - 5} больше...
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* File Path */}
              <div>
                <h4 className="text-sm font-medium mb-2 text-slate-200">
                  Путь к файлу:
                </h4>
                <div className="text-xs font-mono bg-slate-800 rounded p-2 break-all text-slate-300">
                  {selectedNode.id}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
