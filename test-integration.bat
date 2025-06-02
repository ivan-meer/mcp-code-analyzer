@echo off
echo ========================================
echo 🚀 Интеграция рефакторинговых изменений
echo ========================================

echo.
echo 📁 Переход в директорию проекта...
cd /d "D:\.AI-DATA\code_projects\mcp-code-analyzer"

echo.
echo 🔧 Тестирование MCP сервера...
cd packages\mcp-servers
echo Сборка MCP сервера...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ Ошибка сборки MCP сервера
    pause
    exit /b 1
)

echo.
echo ✅ MCP сервер успешно собран!

echo.
echo 🌐 Тестирование Frontend...
cd ..\..\apps\web
echo Проверка компиляции frontend...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ Ошибка сборки frontend
    pause
    exit /b 1
)

echo.
echo ✅ Frontend успешно собран!

echo.
echo 🐍 Тестирование Backend API...
cd ..\api
echo Проверка Python dependencies...
pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo ❌ Ошибка установки Python зависимостей
    pause
    exit /b 1
)

echo.
echo ✅ Backend готов к работе!

echo.
echo 🎉 Интеграция завершена успешно!
echo.
echo Следующие шаги:
echo 1. Запустите: npm run dev (в корневой папке)
echo 2. Откройте: http://localhost:3000
echo 3. Протестируйте анализ проекта
echo.
pause
