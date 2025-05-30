# MCP Code Analyzer - PowerShell Start Script
Write-Host "🚀 Запуск MCP Code Analyzer..." -ForegroundColor Green

# Проверяем зависимости
Write-Host "📦 Проверяем зависимости..." -ForegroundColor Yellow

# Проверка Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js не установлен!" -ForegroundColor Red
    Write-Host "📥 Скачайте с https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Нажмите Enter для выхода"
    exit 1
}

# Проверка Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python не установлен!" -ForegroundColor Red
    Write-Host "📥 Скачайте с https://python.org/" -ForegroundColor Yellow
    Read-Host "Нажмите Enter для выхода"
    exit 1
}

Write-Host "✅ Все зависимости найдены!" -ForegroundColor Green

# Устанавливаем зависимости для монорепо
Write-Host "📦 Устанавливаем зависимости..." -ForegroundColor Yellow
npm install

# Собираем MCP сервер
Write-Host "🔨 Собираем MCP сервер..." -ForegroundColor Yellow
Set-Location "packages\mcp-servers"
npm install
npm run build
Set-Location "..\..\"

# Запускаем FastAPI backend
Write-Host "🐍 Запускаем FastAPI backend..." -ForegroundColor Yellow
Set-Location "apps\api"
pip install -r requirements.txt

# Запускаем backend в новом окне
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location "apps\api"
    python main.py
}

Set-Location "..\..\"

# Ждем пока backend запустится
Write-Host "⏳ Ждем запуска backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Запускаем Next.js frontend
Write-Host "⚛️ Запускаем Next.js frontend..." -ForegroundColor Yellow
Set-Location "apps\web"
npm install

# Запускаем frontend в новом окне
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location "apps\web"
    npm run dev
}

Set-Location "..\..\"

Write-Host ""
Write-Host "✅ Все сервисы запущены!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📚 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Для остановки нажмите Ctrl+C" -ForegroundColor Yellow

# Функция для остановки процессов
function Stop-Services {
    Write-Host ""
    Write-Host "🛑 Останавливаем сервисы..." -ForegroundColor Yellow
    
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    
    Stop-Job $frontendJob -ErrorAction SilentlyContinue  
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
    
    # Убиваем процессы на портах
    try {
        $processes = Get-NetTCPConnection -LocalPort 3000,8000 -ErrorAction SilentlyContinue
        if ($processes) {
            $processes | ForEach-Object {
                Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {
        # Игнорируем ошибки
    }
    
    Write-Host "✅ Готово!" -ForegroundColor Green
}

# Перехватываем Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Проверяем статус задач
        if ($backendJob.State -eq "Failed") {
            Write-Host "❌ Backend завершился с ошибкой!" -ForegroundColor Red
            Receive-Job $backendJob
            break
        }
        
        if ($frontendJob.State -eq "Failed") {
            Write-Host "❌ Frontend завершился с ошибкой!" -ForegroundColor Red
            Receive-Job $frontendJob
            break
        }
    }
} catch [System.Management.Automation.PipelineStoppedException] {
    # Пользователь нажал Ctrl+C
} finally {
    Stop-Services
}
