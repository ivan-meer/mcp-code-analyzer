# 🚀 Быстрый старт MCP Code Analyzer

## 📋 Требования

### Обязательные:
- **Node.js** >= 18.0.0 ([скачать](https://nodejs.org/))
- **Python** >= 3.8 ([скачать](https://python.org/))
- **npm** >= 9.0.0 (устанавливается с Node.js)

### Рекомендуемые:
- **Git** для клонирования проекта
- **VS Code** для разработки

## ⚡ Автоматический запуск

### Windows:
```bash
# Перейдите в папку проекта
cd D:\.AI-DATA\code_projects\mcp-code-analyzer

# Запустите скрипт
start.bat
```

### Linux/Mac:
```bash
# Перейдите в папку проекта
cd D:/.AI-DATA/code_projects/mcp-code-analyzer

# Сделайте скрипт исполняемым
chmod +x start.sh

# Запустите скрипт
./start.sh
```

## 🔧 Ручной запуск

### 1. Установка зависимостей
```bash
# Корневые зависимости
npm install

# MCP сервер
cd packages/mcp-servers
npm install
npm run build
cd ../..

# Frontend
cd apps/web
npm install
cd ../..

# Backend
cd apps/api
pip install -r requirements.txt
cd ../..
```

### 2. Запуск сервисов

**Backend (терминал 1):**
```bash
cd apps/api
python main.py
```

**Frontend (терминал 2):**
```bash
cd apps/web
npm run dev
```

## 🌐 Доступ к приложению

После запуска откройте в браузере:

- **Главное приложение:** http://localhost:3000
- **API документация:** http://localhost:8000/docs
- **API статус:** http://localhost:8000/api/health

## 🧪 Тестирование

### Анализ тестового проекта:

1. Откройте http://localhost:3000
2. В поле "Путь к проекту" введите путь к любой папке с кодом, например:
   - `C:\Users\YourName\Projects\my-app`
   - `/home/user/projects/react-app`
   - Или путь к этому проекту: `D:\.AI-DATA\code_projects\mcp-code-analyzer`

3. Нажмите кнопку "Анализировать"
4. Изучите результаты:
   - 📊 Метрики проекта
   - 🗺️ Интерактивную карту файлов
   - 📈 Граф зависимостей

## 🎯 Основные функции

### ✅ Что работает сейчас:
- 📁 Сканирование структуры проекта
- 📊 Подсчет метрик (файлы, строки, функции)
- 🎨 Интерактивная визуализация D3.js
- 🔍 Анализ зависимостей между файлами
- 🏗️ Определение архитектурных паттернов
- 📱 Адаптивный интерфейс

### 🚧 В разработке:
- 🤖 AI объяснения кода
- 🎓 Интерактивные уроки
- 💡 Предложения улучшений
- 🔌 MCP интеграция с внешними AI

## 🐛 Устранение проблем

### Ошибка "Port already in use":
```bash
# Найти процесс
netstat -ano | findstr :3000  # Windows
lsof -ti:3000 | xargs kill -9  # Linux/Mac

# Или измените порт в apps/web/package.json
"dev": "next dev -p 3001"
```

### Ошибка Python модулей:
```bash
# Убедитесь что используете правильную версию Python
python --version

# Переустановите зависимости
pip install --upgrade -r requirements.txt
```

### Ошибки TypeScript:
```bash
# Очистите кэш и переустановите
rm -rf node_modules package-lock.json
npm install
```

## 📚 Дополнительные команды

```bash
# Проверка линтинга
npm run lint

# Форматирование кода  
npm run format

# Сборка для продакшена
npm run build

# Запуск тестов
npm run test

# Очистка всех зависимостей
npm run clean
```

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте версии Node.js и Python
2. Убедитесь что все порты свободны (3000, 8000)
3. Проверьте логи в терминалах
4. Перезапустите проекта с чистой установкой

Удачного анализа кода! 🎉
