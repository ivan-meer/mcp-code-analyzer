let knowledgeGraphInstance = null;

class AdvancedKnowledgeGraph {
    constructor(containerId = 'main-graph', dataUrl = null) {
        this.containerId = containerId;
        this.svg = d3.select(`#${this.containerId}`);
        this.tooltip = d3.select("#tooltip");
        this.loadingOverlay = d3.select("#loading");

        // Ensure these elements exist before trying to select them
        this.nodesCountStat = d3.select("#nodes-count");
        this.edgesCountStat = d3.select("#edges-count");
        this.depthLevelValue = d3.select("#depth-level-value");
        this.chargeStrengthValue = d3.select("#charge-strength-value");
        this.linkDistanceValue = d3.select("#link-distance-value");
        this.gravityValue = d3.select("#gravity-value");
        this.collisionRadiusValue = d3.select("#collision-radius-value");

        if (this.svg.empty()) {
            console.error(`SVG container #${containerId} not found. Graph cannot be initialized.`);
            this.showLoading(false);
            return;
        }
        if (this.tooltip.empty()) console.warn("Tooltip element #tooltip not found.");
        if (this.loadingOverlay.empty()) console.warn("Loading overlay #loading not found.");


        this.width = parseInt(this.svg.style("width"));
        this.height = parseInt(this.svg.style("height"));

        this.simulation = null;
        this.nodes = [];
        this.links = [];
        this.graphData = { nodes: [], links: [] }; // Initialize with empty data

        this.nodeTypes = ["file", "function", "variable", "module", "class", "external"];
        this.linkTypes = ["dependency", "call", "reference", "include", "contains", "uses", "imports", "exports", "depends_on"];


        this.colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(this.nodeTypes);
        this.currentTransform = d3.zoomIdentity;
        this.showNodeLabels = true;
        this.showLinkArrows = true;
        this.minCollisionRadius = 5;
        this.highlightConnected = true;
        this.showOrphans = false;


        this.initSVG();
        this.initSimulation();
        this.initControls();
        this.initMinimap();

        this.showLoading(true);
        if (dataUrl) {
            this.loadData(dataUrl);
        } else {
            console.warn("No data URL provided. Loading dummy data.");
            this.loadDummyData();
        }
    }

    initSVG() {
        this.svg.selectAll("*").remove(); // Clear previous graph

        this.zoomLayer = this.svg.append("g").attr("class", "zoom-layer");
        this.svg.call(this.zoomBehavior());

        // Define arrowheads
        this.zoomLayer.append('defs').selectAll('marker')
            .data(this.linkTypes)
            .join('marker')
            .attr('id', d => `arrow-${d}`)
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 18) // Adjust based on node radius + desired spacing
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('fill', '#999') // Arrow color
            .attr('d', 'M0,-5L10,0L0,5');

        this.linkGroup = this.zoomLayer.append("g").attr("class", "links");
        this.nodeGroup = this.zoomLayer.append("g").attr("class", "nodes");
        this.labelGroup = this.zoomLayer.append("g").attr("class", "labels");
    }

    initSimulation() {
        this.simulation = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.links).id(d => d.id).distance(d => d.distance || 100))
            .force("charge", d3.forceManyBody().strength(d => d.charge || -150))
            .force("center", d3.forceCenter(this.width / 2, this.height / 2))
            .force("collision", d3.forceCollide().radius(d => (d.radius || 10) + this.minCollisionRadius))
            .force("x", d3.forceX(this.width / 2).strength(0.05))
            .force("y", d3.forceY(this.height / 2).strength(0.05))
            .on("tick", () => this.ticked());
    }

    initControls() {
        // Zoom controls
        d3.select("#zoom-in").on("click", () => this.svg.transition().call(this.zoom.scaleBy, 1.2));
        d3.select("#zoom-out").on("click", () => this.svg.transition().call(this.zoom.scaleBy, 0.8));
        d3.select("#zoom-reset").on("click", () => this.svg.transition().call(this.zoom.transform, d3.zoomIdentity));

        // Node type filter
        d3.select("#node-type-filter").on("change", (event) => this.filterByNodeType(event.target.value));

        // Depth level
        d3.select("#depth-level").on("input", (event) => {
            const value = +event.target.value;
            if(this.depthLevelValue && !this.depthLevelValue.empty()) this.depthLevelValue.text(value);
            this.updateDepth(value);
        });

        // Toggle labels
        d3.select("#toggle-labels").on("click", () => this.toggleLabels());
        d3.select("#toggle-arrows").on("click", () => this.toggleArrows());

        // Simulation parameters
        d3.select("#charge-strength").on("input", (event) => {
            const value = +event.target.value;
            if(this.chargeStrengthValue && !this.chargeStrengthValue.empty()) this.chargeStrengthValue.text(value);
            this.simulation.force("charge").strength(value);
            this.simulation.alpha(0.3).restart();
        });
        d3.select("#link-distance").on("input", (event) => {
            const value = +event.target.value;
            if(this.linkDistanceValue && !this.linkDistanceValue.empty()) this.linkDistanceValue.text(value);
            this.simulation.force("link").distance(value);
            this.simulation.alpha(0.3).restart();
        });
        d3.select("#gravity").on("input", (event) => {
            const value = +event.target.value;
             if(this.gravityValue && !this.gravityValue.empty()) this.gravityValue.text(value);
            this.simulation.force("x").strength(value);
            this.simulation.force("y").strength(value);
            this.simulation.alpha(0.3).restart();
        });
        d3.select("#collision-radius").on("input", (event) => {
            const value = +event.target.value;
            if(this.collisionRadiusValue && !this.collisionRadiusValue.empty()) this.collisionRadiusValue.text(value);
            this.minCollisionRadius = value;
            this.simulation.force("collision").radius(d => (d.radius || 10) + this.minCollisionRadius);
            this.simulation.alpha(0.3).restart();
        });
        d3.select("#highlight-connected-nodes").on("change", (event) => {
            this.highlightConnected = event.target.checked;
        });
        d3.select("#show-orphans").on("change", (event) => {
            this.showOrphans = event.target.checked;
            this.updateGraph();
        });
    }

    updateStats() {
      if (this.nodesCountStat && !this.nodesCountStat.empty()) {
        this.nodesCountStat.text(this.nodes.length);
      }
      if (this.edgesCountStat && !this.edgesCountStat.empty()) {
        this.edgesCountStat.text(this.links.length);
      }
    }

    loadData(url) {
        this.showLoading(true);
        d3.json(url).then(data => {
            this.graphData = data; // Store original data
            this.processData(data);
            this.showLoading(false);
        }).catch(error => {
            console.error("Error loading graph data:", error);
            this.tooltip.html("Ошибка загрузки данных: " + error.message).style("opacity", 1).style("color", "red");
            this.showLoading(false);
            this.loadDummyData(); // Load dummy data as fallback
        });
    }

    loadDummyData() {
        console.log("Loading dummy data...");
        const dummyNodes = [
            { id: "file1.js", name: "file1.js", type: "file", radius: 10, path: "src/file1.js", lines: 120, dependencies: 2, dependents: 1 },
            { id: "func1", name: "myFunction", type: "function", radius: 6, parent: "file1.js", signature: "myFunction(a,b)", complexity: 3 },
            { id: "var1", name: "myVar", type: "variable", radius: 4, parent: "func1", valueType: "String" },
            { id: "file2.py", name: "file2.py", type: "file", radius: 10, path: "src/file2.py", lines: 80 },
            { id: "classA", name: "ClassA", type: "class", radius: 8, parent: "file2.py", methods: 5 },
            { id: "externalLib", name: "lodash", type: "external", radius: 7, version: "4.17.21" }
        ];
        const dummyLinks = [
            { source: "file1.js", target: "func1", type: "contains", distance: 30, charge: -100 },
            { source: "func1", target: "var1", type: "defines", distance: 20, charge: -50 },
            { source: "file1.js", target: "file2.py", type: "imports", distance: 150, charge: -200 }, // Incorrect, just for example
            { source: "classA", target: "func1", type: "calls", distance: 100, charge: -150 }, // Incorrect
            { source: "file1.js", target: "externalLib", type: "depends_on", distance: 120, charge: -180 }
        ];
        this.graphData = { nodes: dummyNodes, links: dummyLinks };
        this.processData(this.graphData);
        this.showLoading(false);
        console.log("Dummy data loaded.");
    }

    processData(data) {
        this.nodes = data.nodes.map(d => ({...d, radius: d.radius || (d.type === 'file' ? 12 : (d.type === 'class' ? 10 : (d.type === 'function' ? 8 : 6)) ) }));
        this.links = data.links.map(d => ({...d, distance: d.distance || (d.type === 'contains' ? 30 : 80) }));

        // Filter out orphans if not shown
        if (!this.showOrphans) {
            const connectedNodeIds = new Set();
            this.links.forEach(l => {
                connectedNodeIds.add(l.source.id || l.source);
                connectedNodeIds.add(l.target.id || l.target);
            });
            this.nodes = this.nodes.filter(n => connectedNodeIds.has(n.id));
        }

        this.updateGraph();
        this.updateStats();
        this.simulation.alpha(1).restart();
    }

    createGraphContent() {
        // Nodes
        this.nodeElements = this.nodeGroup.selectAll("circle.node")
            .data(this.nodes, d => d.id)
            .join("circle")
            .attr("class", d => `node ${d.type}`)
            .attr("r", d => d.radius)
            .attr("fill", d => this.colorScale(d.type))
            .call(this.drag(this.simulation))
            .on("mouseover", (event, d) => {
                this.highlightNode(d);
                let tooltipContent = `<strong>${d.name}</strong> (ID: ${d.id})<br>Тип: ${d.type}`;
                if(d.path) tooltipContent += `<br>Путь: ${d.path}`;
                if(d.lines) tooltipContent += `<br>Строк: ${d.lines}`;
                if(d.signature) tooltipContent += `<br>Сигнатура: ${d.signature}`;

                this.tooltip.html(tooltipContent)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .style("opacity", 0.95);
            })
            .on("mouseout", (event, d) => {
                this.unhighlightNode(d);
                this.tooltip.style("opacity", 0);
            });

        // Links
        this.linkElements = this.linkGroup.selectAll("line.link")
            .data(this.links, d => `${d.source.id || d.source}-${d.target.id || d.target}`)
            .join("line")
            .attr("class", d => `link ${d.type}`)
            .attr("stroke", d => this.colorScale(d.type) || "#999") // Color links by type, fallback
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", d => Math.sqrt(d.value || 1.5))
            .attr('marker-end', d => this.showLinkArrows ? `url(#arrow-${d.type})` : null);

        // Labels
        this.labelElements = this.labelGroup.selectAll("text.label")
            .data(this.nodes, d => d.id)
            .join("text")
            .attr("class", "label")
            .attr("dy", ".35em") // Vertically center
            .attr("text-anchor", "middle")
            .text(d => d.name)
            .style("opacity", this.showNodeLabels ? 1 : 0)
            .style("pointer-events", "none");
    }

    ticked() {
        this.linkElements
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        this.nodeElements
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        this.labelElements
            .attr("x", d => d.x)
            .attr("y", d => d.y + d.radius + 8); // Position below node

        this.updateMinimapViewport();
    }

    updateGraph() {
        this.createGraphContent();
        this.simulation.nodes(this.nodes);
        this.simulation.force("link").links(this.links);
        this.simulation.alpha(0.3).restart();
        this.updateMinimap();
    }

    toggleLabels() {
        this.showNodeLabels = !this.showNodeLabels;
        this.labelGroup.selectAll(".label").style("opacity", this.showNodeLabels ? 1 : 0);
    }
    toggleArrows() {
        this.showLinkArrows = !this.showLinkArrows;
        this.linkGroup.selectAll(".link").attr('marker-end', d => this.showLinkArrows ? `url(#arrow-${d.type})` : null);
    }


    filterByNodeType(nodeType) {
        let filteredNodes = this.graphData.nodes;
        if (nodeType !== "all") {
            filteredNodes = this.graphData.nodes.filter(n => n.type === nodeType);
        }

        const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
        const filteredLinks = this.graphData.links.filter(l =>
            filteredNodeIds.has(l.source.id || l.source) &&
            filteredNodeIds.has(l.target.id || l.target)
        );

        this.nodes = filteredNodes;
        this.links = filteredLinks;
        this.updateGraph();
        this.updateStats();
    }

    updateDepth(depth) {
        // This requires a more complex traversal (BFS/DFS) from central nodes
        // For now, this is a placeholder. A real implementation would filter nodes/links
        // based on their distance from primary project files or a selected node.
        console.log(`Depth level set to ${depth}. Graph depth filtering needs implementation.`);
        // As a simple proxy, let's filter by some arbitrary property if depth is small
        if (depth < 2) {
           this.nodes = this.graphData.nodes.filter(n => (n.lines || 0) > 100); // Example: show only large files
        } else {
           this.nodes = [...this.graphData.nodes]; // Show all
        }
        const currentNodesIds = new Set(this.nodes.map(n => n.id));
        this.links = this.graphData.links.filter(l => currentNodesIds.has(l.source.id || l.source) && currentNodesIds.has(l.target.id || l.target));
        this.updateGraph();
        this.updateStats();
    }

    showLoading(isLoading) {
      if (this.loadingOverlay && !this.loadingOverlay.empty()) {
        this.loadingOverlay.classed('visible', isLoading);
      } else if (isLoading) {
        // console.warn("#loading overlay not found for showLoading");
      }
    }

    drag(simulation) {
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
        return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    }

    zoomBehavior() {
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 8]) // Min/max zoom levels
            .on("zoom", (event) => {
                this.currentTransform = event.transform;
                this.zoomLayer.attr("transform", this.currentTransform);
                this.updateMinimapViewport();
            });
        return this.zoom;
    }

    highlightNode(node) {
        if (!this.highlightConnected) return;
        this.nodeElements.style('opacity', .3);
        this.linkElements.style('stroke-opacity', .1);

        this.nodeElements.filter(d => d.id === node.id).style('opacity', 1);
        const { neighbors, connectedLinks } = this.getNeighbors(node.id);
        neighbors.forEach(neighborNode => {
            this.nodeElements.filter(d => d.id === neighborNode.id).style('opacity', 1);
        });
        connectedLinks.forEach(link => {
            this.linkElements.filter(l => (l.source.id === link.source.id && l.target.id === link.target.id) || (l.source.id === link.target.id && l.target.id === link.source.id))
                .style('stroke-opacity', 0.8)
                .style('stroke-width', 2.5);
        });
    }

    unhighlightNode() {
        if (!this.highlightConnected) return;
        this.nodeElements.style('opacity', 1);
        this.linkElements.style('stroke-opacity', 0.6).style('stroke-width', d => Math.sqrt(d.value || 1.5));
    }

    getNeighbors(nodeId) {
        const neighbors = new Set();
        const connectedLinks = [];
        this.links.forEach(link => {
            if (link.source.id === nodeId) {
                neighbors.add(this.nodes.find(n => n.id === link.target.id));
                connectedLinks.push(link);
            } else if (link.target.id === nodeId) {
                neighbors.add(this.nodes.find(n => n.id === link.source.id));
                connectedLinks.push(link);
            }
        });
        return { neighbors: Array.from(neighbors).filter(Boolean), connectedLinks };
    }

    // MINIMAP functionality
    initMinimap() {
        this.minimapContainer = d3.select(".minimap");
        if (this.minimapContainer.empty()) {
            console.warn("Minimap container .minimap not found.");
            return;
        }
        this.minimapSvg = this.minimapContainer.select("svg#minimap-svg");
        if (this.minimapSvg.empty()) {
            console.warn("Minimap SVG #minimap-svg not found.");
            return;
        }

        this.minimapWidth = parseInt(this.minimapSvg.style("width"));
        this.minimapHeight = parseInt(this.minimapSvg.style("height"));

        this.minimapZoomLayer = this.minimapSvg.append("g").attr("class", "minimap-zoom-layer");
        this.minimapViewport = this.minimapSvg.append("rect").attr("class", "minimap-viewport");

        this.minimapSvg.call(d3.drag()
            .on("start", (event) => this.minimapDragStart(event))
            .on("drag", (event) => this.minimapDrag(event))
        );
        this.updateMinimap();
    }

    updateMinimap() {
        if (!this.minimapZoomLayer || this.minimapZoomLayer.empty()) return;

        this.minimapZoomLayer.selectAll("*").remove(); // Clear previous minimap content

        // Determine bounding box of the main graph
        let minX = 0, minY = 0, maxX = this.width, maxY = this.height; // Default to SVG dimensions
        if (this.nodes.length > 0) {
            minX = d3.min(this.nodes, d => d.x - (d.radius || 0));
            minY = d3.min(this.nodes, d => d.y - (d.radius || 0));
            maxX = d3.max(this.nodes, d => d.x + (d.radius || 0));
            maxY = d3.max(this.nodes, d => d.y + (d.radius || 0));
        }
        const graphContentWidth = Math.max(1, maxX - minX); // Avoid division by zero
        const graphContentHeight = Math.max(1, maxY - minY);

        this.minimapScaleX = this.minimapWidth / graphContentWidth;
        this.minimapScaleY = this.minimapHeight / graphContentHeight;
        this.minimapScale = Math.min(this.minimapScaleX, this.minimapScaleY) * 0.9; // Add some padding

        const offsetX = (this.minimapWidth - graphContentWidth * this.minimapScale) / 2 - minX * this.minimapScale;
        const offsetY = (this.minimapHeight - graphContentHeight * this.minimapScale) / 2 - minY * this.minimapScale;

        this.minimapTransform = d3.zoomIdentity.translate(offsetX, offsetY).scale(this.minimapScale);
        this.minimapZoomLayer.attr("transform", this.minimapTransform);

        // Draw nodes on minimap
        this.minimapZoomLayer.selectAll(".minimap-node")
            .data(this.nodes, d => d.id)
            .enter().append("circle")
            .attr("class", "minimap-node")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => (d.radius || 5) * 0.5 ) // Smaller radius for minimap
            .attr("fill", d => this.colorScale(d.type));

        this.updateMinimapViewport();
    }

    updateMinimapViewport() {
        if (!this.minimapViewport || this.minimapViewport.empty() || !this.minimapTransform) return;

        const mainSvgWidth = this.width;
        const mainSvgHeight = this.height;

        // Calculate viewport in main graph coordinates
        const vx = -this.currentTransform.x / this.currentTransform.k;
        const vy = -this.currentTransform.y / this.currentTransform.k;
        const vw = mainSvgWidth / this.currentTransform.k;
        const vh = mainSvgHeight / this.currentTransform.k;

        // Transform viewport to minimap coordinates
        const minimapVx = vx * this.minimapScale + this.minimapTransform.x;
        const minimapVy = vy * this.minimapScale + this.minimapTransform.y;
        const minimapVw = vw * this.minimapScale;
        const minimapVh = vh * this.minimapScale;

        this.minimapViewport
            .attr("x", minimapVx)
            .attr("y", minimapVy)
            .attr("width", minimapVw)
            .attr("height", minimapVh);
    }

    minimapDragStart(event) {
        // Prevent main graph zoom/drag when interacting with minimap
        event.sourceEvent.stopPropagation();
    }

    minimapDrag(event) {
        if (!this.minimapTransform) return;
        // Calculate the center of the minimap viewport in minimap coordinates
        const minimapViewportCenterX = parseFloat(this.minimapViewport.attr("x")) + parseFloat(this.minimapViewport.attr("width")) / 2;
        const minimapViewportCenterY = parseFloat(this.minimapViewport.attr("y")) + parseFloat(this.minimapViewport.attr("height")) / 2;

        // Calculate how much the mouse has moved from the center of the viewport
        const dxMouseFromViewportCenter = event.x - minimapViewportCenterX;
        const dyMouseFromViewportCenter = event.y - minimapViewportCenterY;

        // Convert this delta to main graph coordinates
        const dxGraph = -dxMouseFromViewportCenter / this.minimapScale;
        const dyGraph = -dyMouseFromViewportCenter / this.minimapScale;

        // Apply this translation to the main graph's zoom behavior
        this.currentTransform.x += dxGraph * this.currentTransform.k;
        this.currentTransform.y += dyGraph * this.currentTransform.k;

        // Call zoom directly on the SVG to update and trigger 'zoom' event
        this.svg.call(this.zoom.transform, this.currentTransform);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const analyzeButton = document.getElementById('analyze-button');

    function switchTab(tabIdToActivate) {
        // Deactivate all tabs and content
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));

        // Activate clicked tab and its content
        const tabToActivateButton = document.querySelector(`.tab-link[data-tab="${tabIdToActivate}"]`);
        const contentToActivate = document.getElementById(tabIdToActivate);

        if (tabToActivateButton) tabToActivateButton.classList.add('active');
        if (contentToActivate) contentToActivate.classList.add('active');

        if (tabIdToActivate === 'graph' && !knowledgeGraphInstance) {
            console.log("Graph tab clicked, initializing AdvancedKnowledgeGraph...");
            knowledgeGraphInstance = new AdvancedKnowledgeGraph(); // Will use dummy data by default
        }
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabId = e.currentTarget.dataset.tab;
            switchTab(tabId);
        });
    });

    if (analyzeButton) {
        analyzeButton.addEventListener('click', () => {
            switchTab('graph');
            if (knowledgeGraphInstance) {
                // This is where you might trigger a real analysis and data load
                // For example: knowledgeGraphInstance.loadData('/api/project_analysis_graph_data');
                knowledgeGraphInstance.showLoading(true);
                console.log("Simulating analysis and reloading graph data...");
                setTimeout(() => {
                    // Replace with actual data loading logic
                    const sampleData = {
                        nodes: [
                            { id: "main.py", name: "main.py", type: "file", path: "main.py", lines: 200 },
                            { id: "utils.py", name: "utils.py", type: "file", path: "utils.py", lines: 75 },
                            { id: "helper_func", name: "helper_func", type: "function", parent: "utils.py" },
                            { id: "core_class", name: "CoreClass", type: "class", parent: "main.py" }
                        ],
                        links: [
                            { source: "main.py", target: "utils.py", type: "imports" },
                            { source: "main.py", target: "core_class", type: "defines" },
                            { source: "utils.py", target: "helper_func", type: "defines" },
                            { source: "core_class", target: "helper_func", type: "calls" }
                        ]
                    };
                    knowledgeGraphInstance.graphData = sampleData; // Update internal data store
                    knowledgeGraphInstance.processData(sampleData); // Process and render
                    knowledgeGraphInstance.showLoading(false);
                    console.log("Graph reloaded with new data after analysis.");
                }, 1500);
            } else {
                console.error("Graph instance not available for analysis button.");
            }
        });
    }

    // Activate the initial tab if specified in HTML, or default, and init graph if needed
    const activeTabLink = document.querySelector('.tab-link.active');
    let initialTabId = 'code-structure'; // Default
    if (activeTabLink) {
        initialTabId = activeTabLink.dataset.tab;
    } else {
        // If no tab is active in HTML, make the first one active
        const firstTabLink = document.querySelector('.tab-link');
        if (firstTabLink) {
            initialTabId = firstTabLink.dataset.tab;
            firstTabLink.classList.add('active');
            const firstTabContent = document.getElementById(initialTabId);
            if (firstTabContent) firstTabContent.classList.add('active');
        }
    }

    if (initialTabId === 'graph' && !knowledgeGraphInstance) {
        knowledgeGraphInstance = new AdvancedKnowledgeGraph();
    }
});
