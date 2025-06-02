@echo off
REM 🚀 MCP Code Analyzer - Супер запуск

echo 🚀 Запуск MCP Code Analyzer - Супер Интерфейс
echo ==============================================

REM Проверка Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js не найден! Установите Node.js 18+ и попробуйте снова.
    pause
    exit /b 1
)

REM Проверка Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    python3 --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Python не найден! Установите Python 3.8+ и попробуйте снова.
        pause
        exit /b 1
    )
)

echo ✅ Все зависимости найдены

REM Установка пакетов если нужно
if not exist "node_modules" (
    echo 📦 Установка зависимостей...
    call npm run install:all
)

REM Запуск всех сервисов
echo 🚀 Запуск всех сервисов...
echo.
echo 🌐 Frontend:  http://localhost:3000
echo 🔧 Backend:   http://localhost:8000
echo ⚡ MCP:       http://localhost:3001
echo.

REM Запуск
start /b npm run start

echo.
echo ✨ Все сервисы запущены!
echo Откройте браузер и перейдите на http://localhost:3000
echo.
echo Для остановки нажмите Ctrl+C
pause
