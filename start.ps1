# Скрипт автозапуска для MCP Code Analyzer

# Запуск бэкенд API
Set-Location "d:\.AI-DATA\code_projects\mcp-code-analyzer\apps\backend"
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run dev"

# Ждем 10 секунд для инициализации API
Start-Sleep -Seconds 10

# Запуск фронтенд приложения
Set-Location "d:\.AI-DATA\code_projects\mcp-code-analyzer\apps\web"
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run dev"
