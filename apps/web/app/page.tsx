import React from 'react';
import SuperInterface from '../components/SuperInterface';
import '../styles/super-interface.css';

export default function HomePage() {
  // Данные проекта (можно получать из API)
  const projectData = {
    files: 51,
    lines: 40705,
    functions: 1629,
    dependencies: 119
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Анимированный фон */}
      <div className="animated-bg"></div>
      
      {/* Частицы */}
      <div className="particles" id="particles"></div>
      
      {/* Основной интерфейс */}
      <SuperInterface projectData={projectData} />
      
      {/* Дополнительные элементы UI */}
      <div className="fixed bottom-8 right-8">
        <button className="fab">
          <i className="fas fa-plus"></i>
        </button>
      </div>
    </div>
  );
}
