#!/bin/bash

# 🚀 MCP Code Analyzer - Супер запуск

echo "🚀 Запуск MCP Code Analyzer - Супер Интерфейс"
echo "=============================================="

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден! Установите Node.js 18+ и попробуйте снова."
    exit 1
fi

# Проверка Python
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "❌ Python не найден! Установите Python 3.8+ и попробуйте снова."
    exit 1
fi

echo "✅ Все зависимости найдены"

# Установка пакетов если нужно
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    npm run install:all
fi

# Запуск всех сервисов
echo "🚀 Запуск всех сервисов..."
echo ""
echo "🌐 Frontend:  http://localhost:3000"
echo "🔧 Backend:   http://localhost:8000"
echo "⚡ MCP:       http://localhost:3001"
echo ""

# Запуск в фоне
npm run start

echo ""
echo "✨ Все сервисы запущены!"
echo "Откройте браузер и перейдите на http://localhost:3000"
echo ""
echo "Для остановки нажмите Ctrl+C"
