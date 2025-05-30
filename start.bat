@echo off
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

REM Устанавливаем зависимости для монорепо
echo 📦 Устанавливаем зависимости...
call npm install

REM Собираем MCP сервер
echo 🔨 Собираем MCP сервер...
cd packages\mcp-servers
call npm install
call npm run build
cd ..\..

REM Запускаем FastAPI backend
echo 🐍 Запускаем FastAPI backend...
cd apps\api
pip install -r requirements.txt
start "FastAPI Backend" python main.py
cd ..\..

REM Ждем пока backend запустится
echo ⏳ Ждем запуска backend...
timeout /t 5 /nobreak >nul

REM Запускаем Next.js frontend
echo ⚛️ Запускаем Next.js frontend...
cd apps\web
call npm install
start "Next.js Frontend" npm run dev
cd ..\..

echo ✅ Все сервисы запущены!
echo 🌐 Frontend: http://localhost:3000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo Для остановки закройте окна терминалов
pause
