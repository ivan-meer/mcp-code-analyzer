"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface SuperInterfaceProps {
  projectData?: {
    files: number;
    lines: number;
    functions: number;
    dependencies: number;
  };
}

const SuperInterface: React.FC<SuperInterfaceProps> = ({ projectData }) => {
  const graphRef = useRef<HTMLDivElement>(null);
  const [currentTab, setCurrentTab] = useState('graph3d');
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    initializeParticles();
    initialize3DGraph();
    initializeRealTimeStats();
  }, []);

  const initializeParticles = () => {
    // Создание частиц (реализация из HTML версии)
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 15 + 's';
      particle.style.animationDuration = (15 + Math.random() * 10) + 's';
      
      const colors = ['var(--neon-blue)', 'var(--neon-purple)', 'var(--neon-green)', 'var(--neon-pink)'];
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      
      particlesContainer.appendChild(particle);
    }
  };

  const initialize3DGraph = () => {
    if (!graphRef.current) return;

    const width = graphRef.current.clientWidth;
    const height = graphRef.current.clientHeight;

    // Создание сцены
    const newScene = new THREE.Scene();
    newScene.background = new THREE.Color(0x0a0a0a);

    // Камера
    const newCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    newCamera.position.set(0, 0, 100);

    // Рендерер
    const newRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    newRenderer.setSize(width, height);
    newRenderer.shadowMap.enabled = true;
    newRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    graphRef.current.appendChild(newRenderer.domElement);

    setScene(newScene);
    setCamera(newCamera);
    setRenderer(newRenderer);

    // Создание узлов и связей
    create3DNodes(newScene);
    
    // Освещение
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    newScene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    newScene.add(directionalLight);

    // Запуск анимации
    animate3D(newScene, newCamera, newRenderer);
  };

  const create3DNodes = (scene: THREE.Scene) => {
    const nodeData = [
      { name: 'main.tsx', type: 'tsx', position: [0, 0, 0], color: 0x667eea },
      { name: 'App.tsx', type: 'tsx', position: [20, 10, -10], color: 0x667eea },
      { name: 'api/main.py', type: 'py', position: [-20, -10, 15], color: 0xf093fb },
      { name: 'ai_manager.py', type: 'py', position: [-30, 0, 20], color: 0xf093fb },
      { name: 'mcp-server.ts', type: 'ts', position: [15, -20, 10], color: 0x4facfe },
      { name: 'package.json', type: 'json', position: [0, 20, -20], color: 0x43e97b },
    ];

    nodeData.forEach(node => {
      const geometry = new THREE.SphereGeometry(2, 32, 32);
      const material = new THREE.MeshPhongMaterial({ 
        color: node.color,
        transparent: true,
        opacity: 0.8
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...node.position as [number, number, number]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      scene.add(mesh);
    });
  };

  const animate3D = (scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => {
    const animate = () => {
      requestAnimationFrame(animate);

      // Анимация узлов
      scene.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.rotation.y += 0.01;
        }
      });

      renderer.render(scene, camera);
    };

    animate();
  };

  const initializeRealTimeStats = () => {
    const updateStats = () => {
      // Обновление статистики в реальном времени
    };

    const interval = setInterval(updateStats, 3000);
    return () => clearInterval(interval);
  };

  const switchTab = (tabName: string) => {
    setCurrentTab(tabName);
  };

  const exportData = () => {
    const data = {
      project: 'mcp-code-analyzer',
      timestamp: new Date().toISOString(),
      metrics: projectData || {
        files: 51,
        lines: 40705,
        functions: 1629,
        dependencies: 119
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcp-analyzer-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="super-interface">
      {/* HTML контент будет здесь */}
      <div id="particles" className="particles"></div>
      
      <header className="super-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="super-logo glow-effect">
              <i className="fas fa-atom"></i>
            </div>
            <div>
              <h1>MCP Code Analyzer</h1>
              <div className="project-stats">
                <div className="stat-item">
                  <i className="fas fa-file-code"></i>
                  <span>{projectData?.files || 51} файлов</span>
                </div>
                <div className="stat-item">
                  <i className="fas fa-code"></i>
                  <span>{projectData?.lines || 40705} строк</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="super-btn secondary" onClick={exportData}>
              <i className="fas fa-download"></i>
              Экспорт
            </button>
            <button className="super-btn primary">
              <i className="fas fa-sync-alt"></i>
              Обновить анализ
            </button>
          </div>
        </div>
      </header>

      <div className="super-container">
        {/* Основной контент интерфейса */}
        <div className="main-panel">
          <div className="tab-content">
            <div className="content-panel active" id="graph3d">
              <div className="graph-3d">
                <div ref={graphRef} id="three-graph" style={{ width: '100%', height: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperInterface;
