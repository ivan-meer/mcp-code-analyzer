/**
 * Централизованные типы для анализа проектов
 * 
 * Этот файл содержит все TypeScript интерфейсы, используемые в системе анализа кода.
 * Выделение типов в отдельный файл дает нам несколько преимуществ:
 * 
 * 1. Единственный источник истины - все компоненты используют одинаковые определения
 * 2. Легче поддерживать консистентность данных во всем приложении
 * 3. Упрощает рефакторинг - изменения типов автоматически проверяются TypeScript
 * 4. Улучшает читаемость кода - разработчики сразу понимают структуру данных
 */

// Основные строительные блоки для представления файлов проекта
export interface ProjectFile {
  path: string;                    // Полный путь к файлу от корня проекта
  name: string;                    // Имя файла без пути (например, "index.ts")
  type: string;                    // Расширение файла (js, ts, py, etc.)
  size: number;                    // Размер файла в байтах
  lines_of_code?: number;          // Количество строк кода (может отсутствовать для бинарных файлов)
  functions: string[];             // Список названий функций, найденных в файле
  imports: string[];               // Список импортируемых модулей/библиотек
}

// Представление связей между файлами и модулями
export interface ProjectDependency {
  from: string;                    // Файл, который импортирует зависимость
  to: string;                      // Что именно импортируется (файл, модуль, библиотека)
  type: string;                    // Тип зависимости (import, require, include и т.д.)
}

// Агрегированная статистика по проекту
export interface ProjectMetrics {
  total_files: number;             // Общее количество файлов в проекте
  total_lines: number;             // Общее количество строк кода
  total_functions: number;         // Общее количество функций во всех файлах
  avg_lines_per_file: number;     // Средний размер файла в строках
  languages: string[];             // Список языков программирования, используемых в проекте
}

// Представление задач и заметок разработчиков в коде
export interface ProjectTodo {
  file_path: string;               // Файл, где найден TODO/FIXME/HACK
  line: number;                    // Номер строки в файле
  type: string;                    // Тип заметки (TODO, FIXME, HACK, NOTE)
  content: string;                 // Текст заметки
  priority?: string;               // Приоритет (high, medium, low) - может быть добавлен в будущем
}

// Документация функций, извлеченная из комментариев
export interface DocFunctionParam {
  name: string;                    // Название параметра
  type?: string | null;           // Тип параметра (если указан в комментариях)
  description?: string | null;     // Описание параметра
}

export interface DocFunctionReturn {
  type?: string | null;           // Тип возвращаемого значения
  description?: string | null;     // Описание того, что возвращает функция
}

export interface DocFunction {
  name: string;                    // Название функции
  description?: string | null;     // Общее описание функции
  params: DocFunctionParam[];      // Список параметров функции
  returns?: DocFunctionReturn | null;  // Информация о возвращаемом значении
  line_start?: number | null;      // Начальная строка функции в файле
  line_end?: number | null;        // Конечная строка функции в файле
}

export interface DocFile {
  file_path: string;               // Путь к файлу
  functions: DocFunction[];        // Список задокументированных функций в файле
}

// Главная структура, содержащая все результаты анализа проекта
export interface ProjectAnalysis {
  project_path: string;            // Абсолютный путь к анализируемому проекту
  files: ProjectFile[];            // Все файлы, найденные в проекте
  dependencies: ProjectDependency[]; // Все зависимости между файлами
  metrics: ProjectMetrics;         // Агрегированная статистика
  architecture_patterns: string[]; // Найденные архитектурные паттерны (MVC, MVVM, etc.)
  all_todos?: ProjectTodo[];       // Все найденные TODO/FIXME комментарии
  project_documentation?: DocFile[]; // Извлеченная документация из кода
  file_duplicates?: DuplicateGroup[]; // Группы дублирующихся файлов (файлы с одинаковым содержимым)
}

// Дополнительные типы для улучшенного UI

// Настройки фильтрации данных
export interface FilterState {
  fileTypes: string[];            // Фильтр по типам файлов (js, ts, py)
  sizeRange: [number, number];    // Диапазон размеров файлов в байтах
  languageFilter: string[];       // Фильтр по языкам программирования
  hasComments: boolean;           // Показывать только файлы с комментариями
  todoTypes: string[];           // Фильтр по типам TODO (TODO, FIXME, HACK)
}

// Настройки сортировки
export interface SortConfig {
  field: keyof ProjectFile | keyof ProjectTodo; // Поле для сортировки
  direction: 'asc' | 'desc';      // Направление сортировки
}

// Состояние поиска
export interface SearchState {
  query: string;                  // Поисковый запрос
  searchFields: string[];         // Поля для поиска (name, path, content)
  caseSensitive: boolean;         // Учитывать регистр при поиске
}

// Конфигурация виртуализации для больших списков
export interface VirtualizationConfig {
  itemHeight: number;             // Высота одного элемента в пикселях
  containerHeight: number;        // Высота контейнера
  overscan: number;               // Количество дополнительных элементов для рендеринга
}

// Типы для экспорта данных
export type ExportFormat = 'json' | 'csv' | 'markdown' | 'xlsx';

export interface ExportOptions {
  format: ExportFormat;           // Формат экспорта
  includeMetrics: boolean;        // Включать ли статистику в экспорт
  includeDependencies: boolean;   // Включать ли зависимости
  includeTodos: boolean;          // Включать ли TODO комментарии
  includeDocumentation: boolean;  // Включать ли документацию
}

// Enum для типов вкладок анализа
export enum AnalysisTab {
  VISUALIZATION = 'visualization',
  FILES = 'files',
  DEPENDENCIES = 'dependencies',
  TODOS = 'todos',
  DOCUMENTATION = 'documentation',
  DUPLICATES = 'duplicates'
}

// Конфигурация вкладки
export interface DuplicateFile {
  path: string; // Относительный путь
  lines: number[]; // Номера строк с дубликатами
}

export interface DuplicateGroup {
  hash: string; // SHA-256 хеш содержимого
  size: number; // Размер файла в байтах
  files: DuplicateFile[];
}

export interface TabConfig {
  id: AnalysisTab;
  label: string;
  icon: string;                   // Название иконки для отображения
  description: string;            // Описание содержимого вкладки
  enabled: boolean;               // Доступна ли вкладка (зависит от наличия данных)
}
