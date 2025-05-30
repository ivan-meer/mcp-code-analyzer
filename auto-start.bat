@echo off
start "Backend" cmd /k "cd apps/api && python -m uvicorn main:app --reload --port 8000"
timeout /t 5 /nobreak > NUL
start "Frontend" cmd /k "cd apps/web && npm run dev"
echo Оба сервера запущены! Откройте http://localhost:3002