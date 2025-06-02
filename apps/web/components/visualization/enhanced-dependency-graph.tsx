"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { ProjectAnalysis } from '@/types/analysis.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GitBranch, 
  Filter, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Search,
  Settings,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EnhancedDependencyGraphProps {
  data: ProjectAnalysis;
  onFileSelect?: (filePath: string) => void;
  className?: string;
}

interface GraphNode {
  id: string;
  path: string;
  type: string;
  size: number;
  category: string;
  group: number;
  functions: number;
  lines: number;
  dependencies: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'import' | 'export' | 'api' | 'config' | 'dependency';
  strength: number;
  value: number;
}

interface FilterOptions {
  fileTypes: Set<string>;
  connectionTypes: Set<string>;
  showLabels: boolean;
  showMetrics: boolean;
  minConnections: number;
}

const FILE_TYPE_COLORS = {
  'tsx': '#61DAFB',
  'ts': '#3178C6', 
  'js': '#F7DF1E',
  'jsx': '#61DAFB',
  'py': '#3776AB',
  'json': '#000000',
  'md': '#083FA1',
  'css': '#1572B6',
  'html': '#E34F26',
  'default': '#6B7280'
} as const;

const CONNECTION_TYPE_COLORS = {
  'import': '#10B981',
  'export': '#F59E0B', 
  'api': '#8B5CF6',
  'config': '#EF4444',
  'dependency': '#06B6D4'
} as const;

export const EnhancedDependencyGraph: React.FC<EnhancedDependencyGraphProps> = ({
  data,
  onFileSelect,
  className
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [simulation, setSimulation] = useState<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    fileTypes: new Set(['all']),
    connectionTypes: new Set(['all']),
    showLabels: true,
    showMetrics: false,
    minConnections: 0
  });

  // Transform project data to graph format
  const transformData = useCallback((): { nodes: GraphNode[], links: GraphLink[] } => {
    const nodes: GraphNode[] = data.files.map((file, index) => {
      const fileType = file.type || 'default';
      const pathParts = file.path.split('/');
      const fileName = pathParts[pathParts.length - 1];
      
      return {
        id: file.path,
        path: file.path,
        type: fileType,
        size: file.lines_of_code || 0,
        category: pathParts[0] || 'root',
        group: index % 8 + 1,
        functions: file.functions?.length || 0,
        lines: file.lines_of_code || 0,
        dependencies: file.imports?.length || 0
      };
    });

    const links: GraphLink[] = [];
    
    // Create links from dependencies
    data.dependencies.forEach(dep => {
      const sourceNode = nodes.find(n => n.path === dep.from);
      const targetNode = nodes.find(n => n.path === dep.to);
      
      if (sourceNode && targetNode) {
        links.push({
          source: dep.from,
          target: dep.to,
          type: (dep.type as any) || 'dependency',
          strength: 1,
          value: 1
        });
      }
    });

    // Add import relationships
    data.files.forEach(file => {
      if (file.imports) {
        file.imports.forEach(importPath => {
          const targetNode = nodes.find(n => 
            n.path.includes(importPath) || 
            n.path.endsWith(importPath + '.ts') ||
            n.path.endsWith(importPath + '.tsx') ||
            n.path.endsWith(importPath + '.js') ||
            n.path.endsWith(importPath + '.jsx')
          );
          
          if (targetNode) {
            links.push({
              source: file.path,
              target: targetNode.path,
              type: 'import',
              strength: 1,
              value: 1
            });
          }
        });
      }
    });

    return { nodes, links };
  }, [data]);

  const applyFilters = useCallback((nodes: GraphNode[], links: GraphLink[]): { nodes: GraphNode[], links: GraphLink[] } => {
    // Filter by search term
    let filteredNodes = nodes;
    if (searchTerm) {
      filteredNodes = nodes.filter(node => 
        node.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by file types
    if (!filters.fileTypes.has('all')) {
      filteredNodes = filteredNodes.filter(node => 
        filters.fileTypes.has(node.type)
      );
    }

    // Filter by minimum connections
    if (filters.minConnections > 0) {
      const nodeConnectionCount = new Map<string, number>();
      links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        nodeConnectionCount.set(sourceId, (nodeConnectionCount.get(sourceId) || 0) + 1);
        nodeConnectionCount.set(targetId, (nodeConnectionCount.get(targetId) || 0) + 1);
      });
      
      filteredNodes = filteredNodes.filter(node => 
        (nodeConnectionCount.get(node.id) || 0) >= filters.minConnections
      );
    }

    // Filter links based on visible nodes and connection types
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
    let filteredLinks = links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      const nodesVisible = visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
      const typeVisible = filters.connectionTypes.has('all') || filters.connectionTypes.has(link.type);
      
      return nodesVisible && typeVisible;
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [searchTerm, filters]);

  const initializeGraph = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();

    // Clear previous content
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const { nodes, links } = transformData();
    const { nodes: filteredNodes, links: filteredLinks } = applyFilters(nodes, links);

    // Create container group for zoom/pan
    const g = svg.append('g').attr('class', 'graph-container');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create force simulation
    const newSimulation = d3.forceSimulation<GraphNode>(filteredNodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(filteredLinks)
        .id(d => d.id)
        .distance(d => 80 + d.value * 20)
        .strength(0.1)
      )
      .force('charge', d3.forceManyBody<GraphNode>().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius(d => Math.sqrt(d.size) / 2 + 15));

    // Create links
    const linkElements = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(filteredLinks)
      .enter().append('line')
      .attr('stroke', d => CONNECTION_TYPE_COLORS[d.type] || '#666')
      .attr('stroke-width', d => Math.sqrt(d.value) * 2)
      .attr('stroke-opacity', 0.6)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        d3.select(this).attr('stroke-opacity', 1);
        showTooltip(event, `${getNodeId(d.source)} → ${getNodeId(d.target)}<br>Type: ${d.type}`);
      })
      .on('mouseleave', function() {
        d3.select(this).attr('stroke-opacity', 0.6);
        hideTooltip();
      });

    // Create nodes
    const nodeElements = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(filteredNodes)
      .enter().append('circle')
      .attr('r', d => Math.max(8, Math.sqrt(d.size) / 3 + 5))
      .attr('fill', d => FILE_TYPE_COLORS[d.type as keyof typeof FILE_TYPE_COLORS] || FILE_TYPE_COLORS.default)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(d3.drag<SVGCircleElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) newSimulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) newSimulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      )
      .on('mouseenter', function(event, d) {
        d3.select(this).attr('stroke-width', 4);
        showTooltip(event, `
          <strong>${d.path.split('/').pop()}</strong><br>
          Type: ${d.type}<br>
          Lines: ${d.lines}<br>
          Functions: ${d.functions}<br>
          Dependencies: ${d.dependencies}
        `);
      })
      .on('mouseleave', function() {
        d3.select(this).attr('stroke-width', 2);
        hideTooltip();
      })
      .on('click', (event, d) => {
        setSelectedNode(d);
        onFileSelect?.(d.path);
      });

    // Create labels (if enabled)
    let labelElements: d3.Selection<SVGTextElement, GraphNode, SVGGElement, unknown> | null = null;
    if (filters.showLabels) {
      labelElements = g.append('g')
        .attr('class', 'labels')
        .selectAll('text')
        .data(filteredNodes)
        .enter().append('text')
        .text(d => d.path.split('/').pop() || d.id)
        .attr('font-size', '10px')
        .attr('font-family', 'system-ui, sans-serif')
        .attr('fill', '#374151')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .style('pointer-events', 'none')
        .style('user-select', 'none');
    }

    // Update positions on simulation tick
    newSimulation.on('tick', () => {
      linkElements
        .attr('x1', d => (d.source as GraphNode).x || 0)
        .attr('y1', d => (d.source as GraphNode).y || 0)
        .attr('x2', d => (d.target as GraphNode).x || 0)
        .attr('y2', d => (d.target as GraphNode).y || 0);

      nodeElements
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0);

      if (labelElements) {
        labelElements
          .attr('x', d => d.x || 0)
          .attr('y', d => (d.y || 0) + 4);
      }
    });

    setSimulation(newSimulation);

    // Helper functions
    function getNodeId(node: string | GraphNode): string {
      return typeof node === 'string' ? node : node.id;
    }

    function showTooltip(event: MouseEvent, content: string) {
      const tooltip = d3.select('body').selectAll('.graph-tooltip').data([null]);
      const tooltipEnter = tooltip.enter().append('div').attr('class', 'graph-tooltip');
      
      tooltip.merge(tooltipEnter)
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', 'white')
        .style('padding', '8px 12px')
        .style('border-radius', '6px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '1000')
        .style('opacity', 0)
        .html(content)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .transition()
        .duration(200)
        .style('opacity', 1);
    }

    function hideTooltip() {
      d3.select('.graph-tooltip')
        .transition()
        .duration(200)
        .style('opacity', 0)
        .remove();
    }

  }, [transformData, applyFilters, filters.showLabels, onFileSelect]);

  // Initialize graph on mount and when data/filters change
  useEffect(() => {
    initializeGraph();
  }, [initializeGraph]);

  // Handle zoom controls
  const handleZoomIn = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.5
    );
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.67
    );
  };

  const handleReset = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity
    );
    if (simulation) {
      simulation.alpha(1).restart();
    }
  };

  // Get unique file types and connection types for filters
  const { nodes } = transformData();
  const uniqueFileTypes = Array.from(new Set(nodes.map(n => n.type)));
  const uniqueConnectionTypes = ['import', 'export', 'api', 'config', 'dependency'];

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Enhanced Dependency Graph
            <Badge variant="secondary" className="ml-2">
              {nodes.length} files
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-48"
              />
            </div>

            {/* Filters */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>File Types</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={filters.fileTypes.has('all')}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFilters(prev => ({ ...prev, fileTypes: new Set(['all']) }));
                    }
                  }}
                >
                  All Types
                </DropdownMenuCheckboxItem>
                {uniqueFileTypes.map(type => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={filters.fileTypes.has(type)}
                    onCheckedChange={(checked) => {
                      setFilters(prev => {
                        const newTypes = new Set(prev.fileTypes);
                        newTypes.delete('all');
                        if (checked) {
                          newTypes.add(type);
                        } else {
                          newTypes.delete(type);
                        }
                        if (newTypes.size === 0) {
                          newTypes.add('all');
                        }
                        return { ...prev, fileTypes: newTypes };
                      });
                    }}
                  >
                    {type.toUpperCase()}
                  </DropdownMenuCheckboxItem>
                ))}
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Display Options</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={filters.showLabels}
                  onCheckedChange={(checked) => {
                    setFilters(prev => ({ ...prev, showLabels: checked }));
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Show Labels
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.showMetrics}
                  onCheckedChange={(checked) => {
                    setFilters(prev => ({ ...prev, showMetrics: checked }));
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Show Metrics
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Zoom Controls */}
            <div className="flex border rounded-md">
              <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Export */}
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div ref={containerRef} className="relative w-full h-[600px] overflow-hidden">
          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{ background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.05) 0%, transparent 50%)' }}
          />
          
          {/* Selected Node Info */}
          {selectedNode && (
            <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm border">
              <h3 className="font-semibold text-sm mb-2">
                {selectedNode.path.split('/').pop()}
              </h3>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div>Type: <Badge variant="outline">{selectedNode.type}</Badge></div>
                <div>Lines: {selectedNode.lines.toLocaleString()}</div>
                <div>Functions: {selectedNode.functions}</div>
                <div>Dependencies: {selectedNode.dependencies}</div>
                <div className="pt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedNode(null)}
                  >
                    <EyeOff className="h-3 w-3 mr-1" />
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border">
            <div className="text-xs font-semibold mb-2">File Types</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(FILE_TYPE_COLORS).slice(0, -1).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs">{type.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedDependencyGraph;
