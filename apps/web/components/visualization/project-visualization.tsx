'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Network, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ProjectData {
  files: Array<{
    path: string;
    name: string;
    type: string;
    size: number;
    lines_of_code?: number;
    functions: string[];
  }>;
  dependencies: Array<{
    from: string;
    to: string;
    type: string;
  }>;
  metrics: {
    total_files: number;
    total_lines: number;
    languages: string[];
  };
}

interface Node {
  id: string;
  name: string;
  type: string;
  size: number;
  group: string;
}

interface Link {
  source: string;
  target: string;
  type: string;
}

export function ProjectVisualization({ data }: { data: ProjectData }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    // Очищаем предыдущую визуализацию
    d3.select(svgRef.current).selectAll('*').remove();

    const width = 800;
    const height = 600;

    // Создаем данные для D3
    const nodes: Node[] = data.files.map(file => ({
      id: file.path,
      name: file.name,
      type: file.type,
      size: file.lines_of_code || 10,
      group: file.type
    }));

    const links: Link[] = data.dependencies
      .filter(dep => nodes.some(n => n.id === dep.from))
      .map(dep => ({
        source: dep.from,
        target: dep.to,
        type: dep.type
      }));

    // Создаем SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Определение маркера для стрелок
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10') // Координаты маркера
      .attr('refX', 15) // Смещение маркера от конца линии (зависит от радиуса узла)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6) // Размер стрелки
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#6B7280') // Цвет стрелки (серый для светлой темы)
      .style('stroke','none');

    // Создаем симуляцию
    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Цветовая схема для типов файлов
    const colorScale = d3.scaleOrdinal()
      .domain(['ts', 'tsx', 'js', 'jsx', 'py', 'css', 'html', 'json'])
      .range(['#3178c6', '#61dafb', '#f7df1e', '#61dafb', '#3776ab', '#1572b6', '#e34f26', '#000000']);

    // Добавляем масштабирование
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Создаем группу для элементов графа
    const g = svg.append('g');

    // Добавляем связи
    const link = svg.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 1);

    // Добавляем узлы
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d: Node) => Math.max(5, Math.min(20, d.size / 20))
      .attr('fill', (d: Node) => { {
        const color = colorScale(d.type);
        return typeof color === 'string' ? color : '#cccccc';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(d3.drag<SVGCircleElement, Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          (d as any).fx = (d as any).x;
          (d as any).fy = (d as any).y;
        })
        .on('drag', (event, d) => {
          (d as any).fx = event.x;
          (d as any).fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          (d as any).fx = null;
          (d as any).fy = null;
        })
      ));

    // Добавляем подписи
    const label = g.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text((d: Node) => d.name.length > 15 ? d.name.slice(0, 12) + '...' : d.name)
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('pointer-events', 'none');

    // Обработчики событий
    node.on('click', (event, d) => {
      setSelectedNode(d);
    });

    node.on('mouseover', function(event, d) {
      d3.select(this).attr('stroke-width', 4);
    });

    node.on('mouseout', function(event, d) {
      d3.select(this).attr('stroke-width', 2);
    });

    // Обновляем позиции при симуляции
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    // Очистка при размонтировании
    return () => {
      simulation.stop();
    };
  }, [data]);

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Нет данных для визуализации</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Граф зависимостей проекта
          </CardTitle>
          <CardDescription>
            Интерактивная визуализация файлов и их взаимосвязей
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="text-sm text-slate-600 dark:text-slate-400">Типы файлов:</div>
            {data.metrics.languages.map(lang => (
              <Badge key={lang} variant="outline" className="text-xs">
                {lang}
              </Badge>
            ))}
          </div>
          
          <div className="relative">
            <svg ref={svgRef} className="border rounded-lg bg-white dark:bg-slate-900"></svg>
            
            {selectedNode && (
              <div className="absolute top-4 right-4 bg-white dark:bg-slate-800 border rounded-lg p-3 shadow-lg max-w-xs">
                <h4 className="font-semibold text-sm mb-2">{selectedNode.name}</h4>
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <div>Тип: <span className="font-medium">{selectedNode.type}</span></div>
                  <div>Размер: <span className="font-medium">{selectedNode.size} строк</span></div>
                  <div>Путь: <span className="font-mono text-xs">{selectedNode.id}</span></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-xs text-slate-500">
            💡 Кликните на узел для подробной информации. Перетаскивайте узлы для изменения расположения.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
