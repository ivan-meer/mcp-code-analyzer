'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as ReactDOM from 'react-dom/client'; // Import ReactDOM
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Network, RotateCcw, Eye, EyeOff, Maximize2, FileText, Code, GitBranch, Settings, Filter, ChevronRight, ChevronLeft,
  Component, FileCode2, Database, Terminal, Settings2, Package, ListTree, Shell, FileQuestion, Braces, Coffee,
  ClipboardCopy, Check, ChevronDown, ChevronUp // Added new icons for sidebar
} from 'lucide-react';

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

  // State for sidebar enhancements
  const [isFunctionsExpanded, setIsFunctionsExpanded] = useState(false);
  const [isImportsExpanded, setIsImportsExpanded] = useState(false);
  const [isExportsExpanded, setIsExportsExpanded] = useState(false);
  const [pathCopied, setPathCopied] = useState(false);

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Enhanced color schemes for different file types and relationships
  const getNodeColor = useCallback((node: Node) => {
    // Specific name matches first
    if (node.name.toLowerCase() === 'dockerfile') return '#384D54';
    if (node.name && (node.name.includes('test') || node.name.includes('spec'))) return '#10b981'; // Test green
    if (node.name && (node.name.includes('config') || node.name.includes('.config.'))) return '#f59e0b'; // Generic config orange
    // Keywords for primary technologies (can override type-based)
    if (node.name && node.name.toLowerCase().includes('react')) return '#61dafb'; // React blue
    if (node.name && node.name.toLowerCase().includes('vue')) return '#4FC08D';   // Vue green
    if (node.name && node.name.toLowerCase().includes('angular')) return '#dd0031';// Angular red
    // Backend framework keywords
    if (node.name && node.name.toLowerCase().includes('node')) return '#68a063';    // Node green
    if (node.name && node.name.toLowerCase().includes('express')) return '#259dff'; // Express blue
    if (node.name && node.name.toLowerCase().includes('django')) return '#092e20';  // Django dark green
    if (node.name && node.name.toLowerCase().includes('flask')) return '#333333';   // Flask dark gray

    const colorMap: { [key: string]: string } = {
      'ts': '#3178c6',    // TypeScript blue
      'tsx': '#61dafb',   // React blue (often TSX is React)
      'js': '#f7df1e',    // JavaScript yellow
      'jsx': '#61dafb',   // React blue (often JSX is React)
      'py': '#3776ab',    // Python blue
      'vue': '#4FC08D',  // Vue green
      'java': '#f89820',  // Java orange
      'cs': '#239120',    // C# green
      'rb': '#CC342D',    // Ruby red
      'go': '#00ADD8',    // Go blue
      'swift': '#FFAC45', // Swift orange
      'kt': '#7F52FF',    // Kotlin purple
      'php': '#777BB4',   // PHP purple
      'rs': '#DEA584',    // Rust orange
      'yaml': '#CB171E',  // YAML red
      'yml': '#CB171E',   // YAML red
      'conf': '#009639',  // Nginx green (for .conf)
      'sh': '#4EAA25',    // Shell green
      'sql': '#CC2927',   // SQL/database red
      'css': '#1572b6',   // CSS blue
      'scss': '#c6538c',  // SCSS pink
      'html': '#e34f26',  // HTML orange
      'json': '#292929',  // JSON dark gray/black
      'md': '#083fa1',    // Markdown blue
      'config': '#f59e0b',// Generic config orange (fallback)
      'test': '#10b981',  // Test green (fallback)
      'dockerfile': '#384D54' // Docker blue/gray
    };
    return colorMap[node.type] || '#64748b'; // Default slate gray
  }, []);

  const getNodeIcon = useCallback((type: string, name: string): React.ComponentType<{ className?: string }> => {
    if (name.toLowerCase() === 'dockerfile') {
      return Package;
    }
    const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
      'ts': FileCode2,
      'tsx': Component,
      'js': FileCode2,
      'jsx': Component,
      'py': FileCode2,
      'vue': Component,
      'java': Coffee,
      'cs': FileCode2,
      'rb': FileCode2,
      'go': FileCode2,
      'swift': FileCode2,
      'kt': FileCode2,
      'php': FileCode2,
      'rs': Braces,
      'yaml': ListTree,
      'yml': ListTree,
      'conf': Settings2,
      'sh': FileTerminal,
      'sql': Database,
      'css': FileCode,
      'scss': FileCode,
      'html': Globe,
      'json': FileJson,
      'md': FileText,
      'config': Settings,
      'test': Eye,
      'dockerfile': Package
    };
    return iconMap[type] || FileQuestion; // Default to FileQuestion for unknown types
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
      .attr('stroke', 'url(#linkGradient)') // Using gradient for links
      .attr('stroke-opacity', 0.7) // Adjusted opacity for gradient
      .attr('stroke-width', d => 1.5 + Math.sqrt((d.weight || 1) * 3)) // Adjusted thickness
      .attr('marker-end', 'url(#arrowhead)')
      .classed('animate-data-flow', true) // Apply data flow animation class
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke-opacity', 0.9) // Slightly more opaque on hover
          .attr('stroke-width', (1.5 + Math.sqrt((d.weight || 1) * 3)) + 2);
        
        // Highlight connected nodes
        nodeElements
          .transition()
          .duration(200)
          .attr('opacity', n => 
            (n.id === (d.source as Node).id || n.id === (d.target as Node).id) ? 1 : 0.3
          );
        
        // Show tooltip with link type
        const tooltip = visualizationGroup.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${(event.pageX)}, ${(event.pageY - 10)})`);
          
        const tooltipRect = tooltip.append('rect')
          .attr('fill', 'rgba(0, 0, 0, 0.9)')
          .attr('stroke', '#ff0000')
          .attr('stroke-width', 1)
          .attr('rx', 6);
          
        const tooltipText = tooltip.append('text')
          .attr('fill', 'white')
          .attr('font-size', '12px')
          .attr('x', 8)
          .attr('y', 16)
          .text(`Связь: ${d.type}`);
          
        const bbox = tooltipText.node()?.getBBox();
        if (bbox) {
          tooltipRect
            .attr('width', bbox.width + 16)
            .attr('height', bbox.height + 12);
        }
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke-opacity', 0.7) // Restore original opacity
          .attr('stroke-width', 1.5 + Math.sqrt((d.weight || 1) * 3)); // Restore original thickness
        
        nodeElements
          .transition()
          .duration(200)
          .attr('opacity', 1);
          
        visualizationGroup.selectAll('.tooltip').remove();
      });

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
      .attr('stroke', d => d3.color(getNodeColor(d))?.darker(0.5).toString() || '#ffffff') // Darker border
      .attr('stroke-width', 1.5) // Adjusted stroke width
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'); // Adjusted shadow


    // Add node icons using foreignObject
    const iconSizePercentage = 0.7; // % of node radius for icon size
    nodeElements.select('foreignObject').remove(); // Clear existing foreignObjects if any during re-render

    nodeElements.append('foreignObject')
      .attr('width', d => getNodeSize(d) * iconSizePercentage * 2)
      .attr('height', d => getNodeSize(d) * iconSizePercentage * 2)
      .attr('x', d => -(getNodeSize(d) * iconSizePercentage)) // Center the foreignObject
      .attr('y', d => -(getNodeSize(d) * iconSizePercentage)) // Center the foreignObject
      .style('pointer-events', 'none')
      .each(function(dNode) { // Use 'each' to operate on each foreignObject
        const foreignObject = this;
        // Ensure the container div exists or create it
        let iconContainer = foreignObject.querySelector('div');
        if (!iconContainer) {
          iconContainer = document.createElement('div');
          // Style container for centering, flex is good for this
          iconContainer.style.width = '100%';
          iconContainer.style.height = '100%';
          iconContainer.style.display = 'flex';
          iconContainer.style.alignItems = 'center';
          iconContainer.style.justifyContent = 'center';
          foreignObject.appendChild(iconContainer);
        }

        const IconComponent = getNodeIcon(dNode.type, dNode.name);
        // Use ReactDOM.createRoot to render the React component into the div
        const root = ReactDOM.createRoot(iconContainer);
        root.render(React.createElement(IconComponent, {
          className: "h-full w-full text-white" // Icon itself will be white
        }));
      });

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
      .attr('transform', d => `translate(${d.x!}, ${d.y!})`); // Nodes are now centered at (x,y)

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
            <CardHeader className="pb-3 bg-slate-800/50">
              <div className="flex items-start gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ backgroundColor: getNodeColor(selectedNode) }}
                >
                  {React.createElement(getNodeIcon(selectedNode.type, selectedNode.name), { className: "h-5 w-5 text-white" })}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold truncate text-white" title={selectedNode.name}>
                    {selectedNode.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-300">
                    {selectedNode.type.toUpperCase()} файл
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-white h-8 w-8"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="pt-3 space-y-4 text-sm">
              {/* --- Basic Information (Path) --- */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Path:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedNode.id);
                      setPathCopied(true);
                      setTimeout(() => setPathCopied(false), 2000);
                    }}
                    className="h-7 px-2 text-xs text-slate-400 hover:text-slate-200"
                  >
                    {pathCopied ? <Check className="h-3 w-3 mr-1 text-green-400" /> : <ClipboardCopy className="h-3 w-3 mr-1" />}
                    {pathCopied ? 'Copied!' : 'Copy Path'}
                  </Button>
                </div>
                <div className="text-xs font-mono bg-slate-800 rounded p-2 break-all text-slate-300 mt-1">
                  {selectedNode.id}
                </div>
              </div>

              <hr className="my-3 border-slate-600 dark:border-slate-700" />

              {/* --- Metrics --- */}
              <div>
                <h4 className="text-base font-semibold mb-2 text-slate-100">Metrics</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Lines of Code:</span>
                    <Badge variant="secondary" className="font-mono bg-slate-700 text-slate-200 px-1.5 py-0.5">
                      {selectedNode.lines?.toLocaleString() || 'N/A'}
                    </Badge>
                  </div>
                  {selectedNode.complexity !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-300">Complexity:</span>
                      <Badge variant={selectedNode.complexity > 10 ? "destructive" : "secondary"} className="font-mono bg-slate-700 text-slate-200 px-1.5 py-0.5">
                        {selectedNode.complexity}
                      </Badge>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-300">Size:</span>
                    <Badge variant="secondary" className="font-mono bg-slate-700 text-slate-200 px-1.5 py-0.5">
                      {selectedNode.size ? formatBytes(selectedNode.size) : 'N/A'}
                    </Badge>
                  </div>
                </div>
              </div>

              <hr className="my-3 border-slate-600 dark:border-slate-700" />

              {/* --- Contents --- */}
              <div>
                <h4 className="text-base font-semibold mb-2 text-slate-100">Contents</h4>

                {/* Functions List */}
                {selectedNode.functions && selectedNode.functions.length > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <h5 className="text-xs font-medium text-slate-300">Functions ({selectedNode.functions.length})</h5>
                      {selectedNode.functions.length > 5 && (
                        <Button variant="ghost" size="xs" onClick={() => setIsFunctionsExpanded(!isFunctionsExpanded)} className="h-6 px-1.5 text-xs text-slate-400 hover:text-slate-200">
                          {isFunctionsExpanded ? <ChevronUp className="h-3 w-3 mr-1"/> : <ChevronDown className="h-3 w-3 mr-1"/>}
                          {isFunctionsExpanded ? 'Show less' : 'Show more'}
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                      {(isFunctionsExpanded ? selectedNode.functions : selectedNode.functions.slice(0, 5)).map((func, index) => (
                        <div key={index} className="text-xs font-mono bg-slate-800 rounded px-2 py-1 truncate text-slate-300" title={func}>
                          {func}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Imports List */}
                {selectedNode.imports && selectedNode.imports.length > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <h5 className="text-xs font-medium text-slate-300">Imports ({selectedNode.imports.length})</h5>
                      {selectedNode.imports.length > 5 && (
                        <Button variant="ghost" size="xs" onClick={() => setIsImportsExpanded(!isImportsExpanded)} className="h-6 px-1.5 text-xs text-slate-400 hover:text-slate-200">
                          {isImportsExpanded ? <ChevronUp className="h-3 w-3 mr-1"/> : <ChevronDown className="h-3 w-3 mr-1"/>}
                          {isImportsExpanded ? 'Show less' : 'Show more'}
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                      {(isImportsExpanded ? selectedNode.imports : selectedNode.imports.slice(0, 5)).map((imp, index) => (
                        <div key={index} className="text-xs font-mono bg-slate-800/70 rounded px-2 py-1 truncate text-slate-400" title={imp || 'Unnamed Import'}>
                          {imp || 'Unnamed Import'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exports List */}
                {selectedNode.exports && selectedNode.exports.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h5 className="text-xs font-medium text-slate-300">Exports ({selectedNode.exports.length})</h5>
                      {selectedNode.exports.length > 5 && (
                        <Button variant="ghost" size="xs" onClick={() => setIsExportsExpanded(!isExportsExpanded)} className="h-6 px-1.5 text-xs text-slate-400 hover:text-slate-200">
                          {isExportsExpanded ? <ChevronUp className="h-3 w-3 mr-1"/> : <ChevronDown className="h-3 w-3 mr-1"/>}
                          {isExportsExpanded ? 'Show less' : 'Show more'}
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                      {(isExportsExpanded ? selectedNode.exports : selectedNode.exports.slice(0, 5)).map((exp, index) => (
                        <div key={index} className="text-xs font-mono bg-slate-800/70 rounded px-2 py-1 truncate text-slate-400" title={exp || 'Unnamed Export'}>
                          {exp || 'Unnamed Export'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(!selectedNode.functions || selectedNode.functions.length === 0) &&
                 (!selectedNode.imports || selectedNode.imports.length === 0) &&
                 (!selectedNode.exports || selectedNode.exports.length === 0) && (
                  <p className="text-xs text-slate-500 italic">No functions, imports, or exports found in this file.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
