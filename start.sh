#!/bin/bash

echo "🚀 Запуск MCP Code Analyzer..."

# Проверяем зависимости
echo "📦 Проверяем зависимости..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен!"
    exit 1
fi

if ! command -v python &> /dev/null; then
    echo "❌ Python не установлен!"
    exit 1
fi

# Устанавливаем зависимости для монорепо
echo "📦 Устанавливаем зависимости..."
npm install

# Собираем MCP сервер
echo "🔨 Собираем MCP сервер..."
cd packages/mcp-servers
npm install
npm run build
cd ../..

# Запускаем FastAPI backend в фоне
echo "🐍 Запускаем FastAPI backend..."
cd apps/api
pip install -r requirements.txt
python main.py &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ../..

# Ждем пока backend запустится
echo "⏳ Ждем запуска backend..."
sleep 5

# Запускаем Next.js frontend
echo "⚛️ Запускаем Next.js frontend..."
cd apps/web
npm install
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ../..

echo "✅ Все сервисы запущены!"
echo "🌐 Frontend: http://localhost:3000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Для остановки нажмите Ctrl+C"

# Функция для остановки всех процессов
cleanup() {
    echo ""
    echo "🛑 Останавливаем сервисы..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Готово!"
    exit 0
}

# Перехватываем сигнал остановки
trap cleanup SIGINT SIGTERM

# Ждем
wait
