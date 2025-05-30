@echo off
echo Запуск бэкенд API...
start "Backend" /D apps\api npm run dev
timeout /t 5
echo Запуск фронтенд приложения...
start "Frontend" /D apps\web npm run dev
echo Оба сервера запущены!
pause
