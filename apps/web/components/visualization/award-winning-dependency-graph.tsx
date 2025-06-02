            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                  className="bg-black/80 border-white/20 text-white hover:bg-white/20"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Сбросить вид</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExport}
                  className="bg-black/80 border-white/20 text-white hover:bg-white/20"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Экспорт SVG</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setGraphState(prev => ({ ...prev, showStats: !prev.showStats }))}
                  className="bg-black/80 border-white/20 text-white hover:bg-white/20"
                >
                  {graphState.showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{graphState.showStats ? 'Скрыть статистику' : 'Показать статистику'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setGraphState(prev => ({ ...prev, autoLayout: !prev.autoLayout }))}
                  className="bg-black/80 border-white/20 text-white hover:bg-white/20"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Настройки макета</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Zoom Indicator */}
      <div className="absolute bottom-4 right-4 z-10">
        <Badge className="bg-black/80 border-white/20 text-white">
          Zoom: {Math.round(graphState.zoom * 100)}%
        </Badge>
      </div>

      {/* Loading State */}
      <AnimatePresence>
        {graphState.isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-white text-sm">Построение графа зависимостей...</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SVG Container */}
      <div ref={containerRef} className="w-full h-full">
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ background: COLORS.background }}
        />
      </div>

      {/* Selected Node Details */}
      <AnimatePresence>
        {graphState.selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-4 right-4 mt-32 w-80 z-30"
          >
            <Card className="backdrop-blur-lg bg-black/90 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>{graphState.selectedNode.id}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setGraphState(prev => ({ ...prev, selectedNode: null }))}
                    className="text-white hover:bg-white/20"
                  >
                    ×
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-300">Тип:</div>
                  <div className="text-white font-medium">{graphState.selectedNode.type.toUpperCase()}</div>
                  
                  <div className="text-gray-300">Категория:</div>
                  <div className="text-white font-medium">{graphState.selectedNode.category}</div>
                  
                  <div className="text-gray-300">Размер:</div>
                  <div className="text-white font-medium">{graphState.selectedNode.size} строк</div>
                  
                  {graphState.selectedNode.functions && (
                    <>
                      <div className="text-gray-300">Функции:</div>
                      <div className="text-white font-medium">{graphState.selectedNode.functions}</div>
                    </>
                  )}
                </div>

                {graphState.selectedNode.path && (
                  <div>
                    <div className="text-gray-300 text-sm mb-1">Путь:</div>
                    <code className="text-xs bg-white/10 px-2 py-1 rounded text-green-400 break-all block">
                      {graphState.selectedNode.path}
                    </code>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => onNodeClick?.(graphState.selectedNode!)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Открыть файл
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/20"
                    onClick={() => {
                      // Center graph on selected node
                      const svg = d3.select(svgRef.current);
                      const zoom = (svg.node() as any)?.__zoom__;
                      if (zoom && graphState.selectedNode) {
                        const { x = 0, y = 0 } = graphState.selectedNode;
                        svg.transition().duration(500).call(
                          zoom.transform,
                          d3.zoomIdentity
                            .translate(dimensions.width / 2, dimensions.height / 2)
                            .scale(1.5)
                            .translate(-x, -y)
                        );
                      }
                    }}
                  >
                    Центрировать
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="backdrop-blur-lg bg-black/80 border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Легенда</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Node Types */}
              <div>
                <div className="text-xs font-medium text-gray-300 mb-1">Типы файлов:</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(COLORS.nodes).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full border border-white"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-gray-300">{type.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Link Types */}
              <div>
                <div className="text-xs font-medium text-gray-300 mb-1">Типы связей:</div>
                <div className="space-y-1">
                  {Object.entries(COLORS.links).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-0.5"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-gray-300">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AwardWinningDependencyGraph;