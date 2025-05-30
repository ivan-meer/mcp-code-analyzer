'use client';

import React from 'react';

export function DiagnosticComponent() {
  return (
    <div className="p-8 bg-red-500 text-white border-4 border-blue-500 rounded-lg shadow-lg">
      <h1 className="text-4xl font-bold text-yellow-300 mb-4">
        🔍 ДИАГНОСТИКА TAILWIND CSS
      </h1>
      <div className="space-y-4">
        <p className="text-lg bg-green-600 p-4 rounded">
          Если вы видите этот текст на зеленом фоне, Tailwind CSS работает частично
        </p>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
            Кнопка с hover эффектом
          </button>
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full animate-pulse">
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-indigo-400 rounded flex items-center justify-center text-white font-bold">
            Grid 1
          </div>
          <div className="h-20 bg-teal-400 rounded flex items-center justify-center text-white font-bold">
            Grid 2  
          </div>
          <div className="h-20 bg-rose-400 rounded flex items-center justify-center text-white font-bold">
            Grid 3
          </div>
        </div>
        <div className="text-sm text-gray-300 mt-6">
          <strong>Что проверяется:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Цветовые классы (bg-red-500, text-white)</li>
            <li>Размеры и отступы (p-8, text-4xl)</li>
            <li>Flexbox и Grid</li>
            <li>Hover эффекты и анимации</li>
            <li>Градиенты и скругления</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
