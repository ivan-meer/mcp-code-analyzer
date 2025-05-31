/**
 * Утилиты для определения иконок и цветов файлов
 * 
 * Эти функции помогают визуально различать типы файлов в интерфейсе.
 * Выделение этих утилит в отдельный файл дает нам несколько преимуществ:
 * 
 * 1. Переиспользование - эти функции можно использовать в любом месте приложения
 * 2. Тестируемость - легче написать unit-тесты для изолированных функций
 * 3. Расширяемость - легко добавлять новые типы файлов и иконки
 * 4. Поддержка - все изменения в логике иконок происходят в одном месте
 */

import React from 'react';
import {
  FileCode2, Component, Coffee, Braces, ListTree, Settings2, Terminal, 
  Database, FileCode, Globe, FileJson, FileText, Settings, Eye, 
  Package, FileQuestion, HelpCircle
} from 'lucide-react';

/**
 * Определяет цвет фона для иконки файла на основе типа файла
 * 
 * Мы используем ассоциативные цвета, которые помогают разработчикам
 * быстро визуально идентифицировать типы файлов. Например:
 * - TypeScript использует официальный синий цвет проекта
 * - JavaScript использует традиционный желтый
 * - Python использует синий из официального логотипа
 * 
 * @param type - расширение файла (js, ts, py, etc.)
 * @param name - полное имя файла (опционально, для особых случаев)
 * @returns строка с hex-кодом цвета
 */
export const getFileIconColor = (type: string, name?: string): string => {
  // Особые случаи: некоторые файлы определяются по имени, а не по расширению
  // Dockerfile не имеет расширения, но это важный файл инфраструктуры
  if (name && name.toLowerCase() === 'dockerfile') {
    return '#384D54'; // Docker использует темно-синий/серый цвет в своем брендинге
  }

  // Основная карта соответствий расширений и цветов
  // Эти цвета взяты из официальных стилей языков программирования
  const colorMap: { [key: string]: string } = {
    // Семейство JavaScript/TypeScript - современные веб-технологии
    'ts': '#3178c6',      // Официальный синий TypeScript
    'tsx': '#61dafb',     // React использует этот светло-синий цвет
    'js': '#f7df1e',      // Классический желтый JavaScript
    'jsx': '#61dafb',     // Тот же React-синий для JSX

    // Языки бэкенда
    'py': '#3776ab',      // Официальный синий Python
    'java': '#f89820',    // Оранжевый из логотипа Java
    'cs': '#239120',      // Зеленый Microsoft для C#
    'rb': '#CC342D',      // Красный Ruby
    'go': '#00ADD8',      // Голубой Go (язык от Google)
    'php': '#777BB4',     // Фиолетовый PHP
    'rs': '#DEA584',      // Оранжевый Rust

    // Мобильная разработка
    'swift': '#FFAC45',   // Оранжевый Swift (Apple)
    'kt': '#7F52FF',      // Фиолетовый Kotlin (JetBrains)

    // Фронтенд-технологии
    'vue': '#4FC08D',     // Зеленый Vue.js
    'css': '#1572b6',     // Синий CSS3
    'scss': '#c6538c',    // Розовый Sass
    'html': '#e34f26',    // Оранжевый HTML5

    // Конфигурационные файлы
    'yaml': '#CB171E',    // Красный для YAML
    'yml': '#CB171E',     // Тот же красный для .yml
    'json': '#292929',    // Темно-серый для JSON
    'conf': '#009639',    // Зеленый для конфигурационных файлов (как Nginx)

    // Системные файлы
    'sh': '#4EAA25',      // Зеленый для shell-скриптов
    'sql': '#CC2927',     // Красный для SQL

    // Документация
    'md': '#083fa1',      // Синий для Markdown

    // Универсальные типы
    'config': '#f59e0b',  // Оранжевый для общих конфигов
    'test': '#10b981',    // Зеленый для тестовых файлов
    'dockerfile': '#384D54' // Дублируем Docker цвет для надежности
  };

  // Возвращаем цвет из карты или серый по умолчанию
  // Серый цвет помогает понять, что для этого типа файла еще не настроена иконка
  return colorMap[type.toLowerCase()] || '#64748b';
};

/**
 * Определяет React-компонент иконки для типа файла
 * 
 * Мы выбираем иконки, которые семантически соответствуют типу файла.
 * Это помогает пользователям интуитивно понимать назначение файлов.
 * 
 * @param type - расширение файла
 * @param name - полное имя файла
 * @returns React-компонент иконки с предустановленными стилями
 */
export const getFileIcon = (type: string, name: string): React.ReactElement => {
  // Снова проверяем особые случаи по имени файла
  if (name.toLowerCase() === 'dockerfile') {
    // Package иконка хорошо отражает идею контейнеризации
    return React.createElement(Package, { className: "h-4 w-4 text-white" });
  }

  // Карта соответствий типов файлов и иконок
  // Каждая иконка выбрана для максимальной узнаваемости
  const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
    // Код - основные языки программирования
    'ts': FileCode2,      // TypeScript - код с дополнительными аннотациями типов
    'js': FileCode2,      // JavaScript - обычный код
    'py': FileCode2,      // Python - тоже код
    'cs': FileCode2,      // C# - код
    'rb': FileCode2,      // Ruby - код
    'go': FileCode2,      // Go - код
    'swift': FileCode2,   // Swift - код
    'kt': FileCode2,      // Kotlin - код
    'php': FileCode2,     // PHP - код

    // Компонентные технологии
    'tsx': Component,     // TSX - React компоненты с TypeScript
    'jsx': Component,     // JSX - React компоненты
    'vue': Component,     // Vue компоненты

    // Специальные языки с уникальными иконками
    'rs': Braces,         // Rust - Braces подчеркивает строгость синтаксиса
    'java': Coffee,       // Java - кофе это классическая ассоциация с Java

    // Конфигурационные файлы
    'yaml': ListTree,     // YAML - древовидная структура данных
    'yml': ListTree,      // То же для .yml
    'conf': Settings2,    // Конфигурационные файлы - настройки
    'config': Settings,   // Общие конфиги - простые настройки

    // Системные файлы
    'sh': Terminal,       // Shell скрипты - терминал
    'sql': Database,      // SQL - база данных

    // Веб-технологии
    'css': FileCode,      // CSS - код стилей
    'scss': FileCode,     // SCSS - тоже стили
    'html': Globe,        // HTML - веб (глобус)

    // Данные
    'json': FileJson,     // JSON - специальная иконка для JSON

    // Документация
    'md': FileText,       // Markdown - текстовые документы

    // Тестирование
    'test': Eye,          // Тестовые файлы - наблюдение/проверка

    // Docker
    'dockerfile': Package // Дублируем для надежности
  };

  // Получаем компонент иконки или используем вопросительный знак для неизвестных типов
  const IconComponent = iconMap[type.toLowerCase()] || FileQuestion;
  
  // Возвращаем компонент с предустановленными стилями
  // text-white обеспечивает хорошую контрастность на цветном фоне
  return React.createElement(IconComponent, { className: "h-4 w-4 text-white" });
};

/**
 * Определяет человекочитаемое описание типа файла
 * 
 * Эта функция полезна для tooltip'ов и accessibility.
 * Она помогает пользователям понять назначение файла даже если они
 * не знакомы с конкретным расширением.
 * 
 * @param type - расширение файла
 * @param name - полное имя файла
 * @returns описание типа файла
 */
export const getFileTypeDescription = (type: string, name?: string): string => {
  if (name && name.toLowerCase() === 'dockerfile') {
    return 'Docker контейнер конфигурация';
  }

  const descriptions: { [key: string]: string } = {
    'ts': 'TypeScript код',
    'tsx': 'React компонент с TypeScript',
    'js': 'JavaScript код',
    'jsx': 'React компонент',
    'py': 'Python скрипт',
    'java': 'Java исходный код',
    'cs': 'C# исходный код',
    'rb': 'Ruby скрипт',
    'go': 'Go исходный код',
    'swift': 'Swift исходный код',
    'kt': 'Kotlin исходный код',
    'php': 'PHP скрипт',
    'rs': 'Rust исходный код',
    'vue': 'Vue.js компонент',
    'css': 'Таблица стилей CSS',
    'scss': 'Sass стили',
    'html': 'HTML документ',
    'json': 'JSON данные',
    'yaml': 'YAML конфигурация',
    'yml': 'YAML конфигурация',
    'md': 'Markdown документация',
    'conf': 'Конфигурационный файл',
    'config': 'Файл конфигурации',
    'sh': 'Shell скрипт',
    'sql': 'SQL запрос',
    'test': 'Тестовый файл',
    'dockerfile': 'Docker конфигурация'
  };

  return descriptions[type.toLowerCase()] || `${type.toUpperCase()} файл`;
};

/**
 * Группирует файлы по типам для удобного отображения статистики
 * 
 * Эта функция анализирует массив файлов и создает сводку по типам.
 * Полезно для отображения диаграмм и общей статистики проекта.
 * 
 * @param files - массив файлов проекта
 * @returns объект с группировкой по типам файлов
 */
export const groupFilesByType = (files: any[]): { [type: string]: number } => {
  return files.reduce((acc, file) => {
    const type = file.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
};

/**
 * Сортирует типы файлов по популярности в проекте
 * 
 * Возвращает массив типов файлов, отсортированный по количеству файлов каждого типа.
 * Это помогает понять, какие технологии являются основными в проекте.
 * 
 * @param files - массив файлов проекта
 * @returns массив [тип, количество] отсортированный по убыванию количества
 */
export const getPopularFileTypes = (files: any[]): Array<[string, number]> => {
  const grouped = groupFilesByType(files);
  return Object.entries(grouped).sort(([, a], [, b]) => b - a);
};
