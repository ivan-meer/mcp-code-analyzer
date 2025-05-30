# 🚀 MCP Code Analyzer

![Banner](assets/mcp-code-analyzer-banner.jpg)

<div align="center">

<!-- Language Navigation -->
<p align="center">
  <a href="README.md">
    <img src="./assets/ENG.png" alt="English" width="62" height="48" style="margin: 0 10px;"/>
  </a>
  <a href="README.ru.md">
    <img src="./assets/RUS.png" alt="Русский" width="64" height="48" style="margin: 0 10px;"/>
  </a>
</p>



[![Experimental](https://img.shields.io/badge/Статус-Экспериментальный-orange?style=for-the-badge&logo=flask)](https://github.com)
[![MCP](https://img.shields.io/badge/MCP-Включен-blue?style=for-the-badge&logo=protocol)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![AI Powered](https://img.shields.io/badge/AI-Powered-ff6b6b?style=for-the-badge&logo=openai)](https://openai.com/)
![License: MIT](https://img.shields.io/badge/Лицензия-MIT-yellow.svg)

*Интеллектуальный анализ и визуализация кода на основе Model Context Protocol*

[🎯 Возможности](#-возможности) • [🏗️ Архитектура](#️-архитектура) • [🚀 Быстрый старт](#-быстрый-старт) • [📖 Документация](#-документация) • [🤝 Участие](#-участие)

</div>

---
## ❓ Зачем нужен MCP Code Analyzer?

> Традиционные статические анализаторы кода пассивны.  
> MCP Code Analyzer активен, адаптивен и интерактивен.  
> Он не просто говорит *что* — он показывает *почему*.

С помощью Model Context Protocol и интеграции ИИ:
- Разработчики получают контекстно-осведомленную обратную связь в режиме реального времени.
- Сложные проекты разбиваются визуально.
- Обучение персонализировано и геймифицировано.

## 🧪 **Уведомление об экспериментальном проекте**

> ⚠️ **Это экспериментальный проект!** 
> 
> Мы исследуем передовое пересечение ИИ-анализа кода и интерактивной визуализации с использованием Model Context Protocol (MCP). Этот проект служит исследовательской площадкой для разработки инструментов разработчика нового поколения.

---

## 📋 **Обзор проекта**

MCP Code Analyzer — это инновационный помощник разработчика, который превращает статический код в интерактивные визуальные впечатления. Построенный на Model Context Protocol, он обеспечивает интеллектуальный анализ кода, визуализацию в реальном времени и персонализированные обучающие модули, помогающие разработчикам понимать, навигировать и улучшать свои кодовые базы.
[![Доска проекта](https://img.shields.io/badge/GitHub-Доска%20проекта-blueviolet?style=flat-square&logo=github)](https://github.com/ivan-meer/mcp-code-analyzer/projects)

### 🎯 **Основная концепция**
Преобразовать способ взаимодействия разработчиков с кодом, предоставляя:
- 🔍 **Интеллектуальный анализ** - Глубокое понимание структуры и паттернов кода
- 📊 **Интерактивная визуализация** - Красивые, интерактивные карты кода и графы зависимостей
- 🎓 **Адаптивное обучение** - Персонализированные объяснения и туториалы
- 🔗 **Бесшовная интеграция** - Нативная поддержка протокола MCP для расширяемости

---

## ✨ **Возможности**

<table>
<tr>
<td width="50%">

### 🔍 **Движок анализа кода**
- 📁 **Картирование структуры проекта**
- 🕸️ **Генерация графа зависимостей**
- 🏗️ **Обнаружение архитектурных паттернов**
- 📈 **Оценка качества кода**
- 🔍 **Семантический поиск по коду**

</td>
<td width="50%">

### 📊 **Интерактивная визуализация**
- 🗺️ **3D карты проектов**
- 📈 **Графы зависимостей в реальном времени**
- 🎨 **Подсветка кода с учетом синтаксиса**
- 📱 **Отзывчивый визуальный интерфейс**
- 🎭 **Настраиваемые темы**

</td>
</tr>
<tr>
<td width="50%">

### 🎓 **Помощник в обучении**
- 💡 **Интерактивные объяснения кода**
- 🧩 **Обучение распознаванию паттернов**
- 📚 **Контекстная документация**
- 🎯 **Рекомендации на основе навыков**
- 🏆 **Отслеживание прогресса**

</td>
<td width="50%">

### 🔧 **Опыт разработчика**
- ⚡ **Анализ в реальном времени**
- 🔌 **Интеграция с протоколом MCP**
- 🌐 **Поддержка множества языков**
- 📦 **Архитектура плагинов**
- 🔄 **Возможности горячей перезагрузки**

</td>
</tr>
</table>

---

## 🏗️ **Архитектура**

<div align="center">

```mermaid
graph TB
    A[🌐 Веб-интерфейс] --> B[🧠 ИИ движок чата]
    B --> C[🔧 MCP клиент]
    C --> D[📊 Сервер анализатора кода]
    C --> E[🎓 Сервер помощника обучения]
    C --> F[📈 Сервер визуализации]
    
    D --> G[📁 Сканер файловой системы]
    D --> H[🌳 AST парсер]
    D --> I[🕸️ Анализатор зависимостей]
    
    E --> J[💡 Объяснитель кода]
    E --> K[🧪 Интерактивные туториалы]
    E --> L[📊 Трекер прогресса]
    
    F --> M[🗺️ Карты проектов]
    F --> N[📈 Рендерер графов]
    F --> O[🎨 Движок тем]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#fce4ec
    style F fill:#f1f8e9
```

</div>

### 🏛️ **Основные компоненты**

| Компонент | Описание | Технология |
|-----------|----------|------------|
| 🌐 **Веб-интерфейс** | Современный отзывчивый UI | Next.js 15, React 19, Tailwind CSS |
| 🧠 **ИИ движок** | Интеллектуальное понимание кода | Anthropic Claude, OpenAI GPT |
| 🔧 **MCP интеграция** | Коммуникация инструментов на основе протокола | Model Context Protocol |
| 📊 **Движок анализа** | Парсинг и анализ кода | AST парсеры, статический анализ |
| 🎨 **Визуализация** | Интерактивная графика и диаграммы | D3.js, Three.js, Canvas API |
| 💾 **Слой данных** | Постоянное хранилище | PostgreSQL, Drizzle ORM |

---

## 🛠️ **Технологический стек**

<div align="center">

### **Фронтенд**
[![Next.js](https://img.shields.io/badge/Next.js-15.3.1-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.1.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

### **Бэкенд и ИИ**
[![Node.js](https://img.shields.io/badge/Node.js-Latest-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Anthropic](https://img.shields.io/badge/Anthropic-Claude-FF6B6B?style=flat-square&logo=anthropic)](https://www.anthropic.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT-412991?style=flat-square&logo=openai)](https://openai.com/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-4A90E2?style=flat-square&logo=protocol)](https://modelcontextprotocol.io/)

### **Данные и хранилище**
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=flat-square&logo=drizzle)](https://orm.drizzle.team/)

### **Инструменты разработки**
[![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat-square&logo=eslint)](https://eslint.org/)
[![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=flat-square&logo=prettier&logoColor=black)](https://prettier.io/)
[![Husky](https://img.shields.io/badge/Husky-Git%20Hooks-FF6B6B?style=flat-square&logo=git)](https://typicode.github.io/husky/)

</div>

---

## 🚀 **Быстрый старт**

### 📋 **Требования**

```bash
# Требуемые версии
Node.js >= 18.0.0
npm >= 9.0.0
PostgreSQL >= 14.0
```

### ⚡ **Установка**

```bash
# Клонирование репозитория
git clone https://github.com/ivan-meer/mcp-code-analyzer.git
cd mcp-code-analyzer

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env.local
# Отредактируйте .env.local с вашими настройками

# Запуск в режиме разработки
npm run dev
```

### 🌍 **Переменные окружения**

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL="postgresql://username:password@localhost:5432/mcp_analyzer"
ANTHROPIC_API_KEY="your_anthropic_key"
OPENAI_API_KEY="your_openai_key"
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 🚀 **Запуск**

```bash
# Разработка
npm run dev          # Запуск dev сервера
npm run build        # Сборка для продакшена
npm run start        # Запуск продакшен сервера
npm run lint         # Проверка кода
npm run type-check   # Проверка типов TypeScript
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

---

## 📖 **Документация**

### 📚 **Руководства**
- [📋 Быстрый старт](docs/quick-start.md)
- [🏗️ Архитектура](docs/architecture.md)
- [🔌 MCP интеграция](docs/mcp-integration.md)
- [🎨 Настройка UI](docs/ui-customization.