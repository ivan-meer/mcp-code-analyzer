@echo off
chcp 65001 >nul
echo 🚀 Запуск MCP Code Analyzer...

REM Проверяем зависимости
echo 📦 Проверяем зависимости...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js не установлен!
    pause
    exit /b 1
)

where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python не установлен!
    pause
    exit /b 1
)

echo ✅ Все зависимости найдены!

REM Очищаем и устанавливаем зависимости
echo 🧹 Очищаем кэш...
call npm cache clean --force

echo 📦 Устанавливаем зависимости с исправлениями...
call npm install --legacy-peer-deps

REM Собираем MCP сервер
echo 🔨 Собираем MCP сервер...
cd packages\mcp-servers
call npm install --legacy-peer-deps
call npx tsc
cd ..\..

REM Запускаем FastAPI backend
echo 🐍 Запускаем FastAPI backend...
cd apps\api
pip install -r requirements.txt
start "FastAPI Backend" python main.py
cd ..\..

REM Ждем пока backend запустится
echo ⏳ Ждем запуска backend...
timeout /t 7 /nobreak >nul

REM Запускаем Next.js frontend
echo ⚛️ Запускаем Next.js frontend...
cd apps\web
call npm install --legacy-peer-deps
start "Next.js Frontend" npm run dev
cd ..\..

echo ✅ Все сервисы запущены!
echo 🌐 Frontend: http://localhost:3000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo Для остановки закройте окна терминалов
pause
