/**
 * Утилиты для экспорта данных анализа в различные форматы
 * 
 * Эти функции позволяют пользователям сохранять результаты анализа
 * в удобных для них форматах. Разделение логики экспорта в отдельный
 * файл позволяет легко добавлять новые форматы и поддерживать существующие.
 * 
 * Принципы, которые мы используем здесь:
 * 1. Чистые функции - не изменяют входные данные
 * 2. Композиция - сложные функции строятся из простых
 * 3. Типобезопасность - все входы и выходы четко типизированы
 */

import { ProjectAnalysis, ProjectFile, ProjectTodo, DocFile, ExportOptions } from '@/types/analysis.types';

/**
 * Создает и скачивает файл с указанным содержимым
 * 
 * Эта вспомогательная функция инкапсулирует сложную логику браузера
 * для создания и скачивания файлов. Она работает как "мост" между
 * нашими данными и файловой системой пользователя.
 * 
 * @param content - содержимое файла
 * @param filename - имя файла для скачивания
 * @param mimeType - MIME тип файла (определяет, как браузер обработает файл)
 */
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  // Создаем Blob - это способ браузера представить данные как файл
  const blob = new Blob([content], { type: mimeType });
  
  // Создаем временную ссылку для скачивания
  const link = document.createElement('a');
  
  // Проверяем, поддерживает ли браузер атрибут download
  if (link.download !== undefined) {
    // Современный подход - используем URL.createObjectURL
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    // Добавляем ссылку в DOM, кликаем и сразу удаляем
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Освобождаем память, удаляя временный URL
    URL.revokeObjectURL(url);
  } else {
    // Fallback для старых браузеров
    const encodedContent = encodeURIComponent(content);
    window.open(`data:${mimeType};charset=utf-8,${encodedContent}`);
  }
};

/**
 * Экспортирует данные в формате JSON
 * 
 * JSON удобен для программного использования данных и обмена
 * с другими системами. Мы используем pretty-printing для читаемости.
 * 
 * @param data - данные анализа проекта
 * @param options - настройки экспорта
 * @returns строка с JSON данными
 */
export const exportToJson = (data: ProjectAnalysis, options: ExportOptions): string => {
  // Создаем объект только с теми данными, которые пользователь хочет экспортировать
  const exportData: Partial<ProjectAnalysis> = {
    project_path: data.project_path,
    files: data.files, // Файлы экспортируем всегда - это основа анализа
  };

  // Условно добавляем дополнительные данные на основе настроек
  if (options.includeMetrics) {
    exportData.metrics = data.metrics;
    exportData.architecture_patterns = data.architecture_patterns;
  }

  if (options.includeDependencies && data.dependencies) {
    exportData.dependencies = data.dependencies;
  }

  if (options.includeTodos && data.all_todos) {
    exportData.all_todos = data.all_todos;
  }

  if (options.includeDocumentation && data.project_documentation) {
    exportData.project_documentation = data.project_documentation;
  }

  // Преобразуем в JSON с отступами для читаемости
  return JSON.stringify(exportData, null, 2);
};

/**
 * Экспортирует данные в формате CSV
 * 
 * CSV удобен для работы в Excel и других программах обработки данных.
 * Мы экспортируем основную информацию о файлах в табличном виде.
 * 
 * @param data - данные анализа проекта
 * @param options - настройки экспорта
 * @returns строка с CSV данными
 */
export const exportToCsv = (data: ProjectAnalysis, options: ExportOptions): string => {
  const csvRows: string[] = [];
  
  // Заголовки CSV файла
  const headers = ['File Path', 'File Name', 'Type', 'Size (bytes)', 'Lines of Code', 'Functions Count'];
  csvRows.push(headers.join(','));

  // Преобразуем каждый файл в строку CSV
  data.files.forEach(file => {
    const row = [
      `"${file.path}"`,                           // Кавычки защищают от запятых в путях
      `"${file.name}"`,
      file.type,
      file.size.toString(),
      (file.lines_of_code || 0).toString(),
      file.functions.length.toString()
    ];
    csvRows.push(row.join(','));
  });

  // Если пользователь хочет включить TODO комментарии, добавляем их в отдельную секцию
  if (options.includeTodos && data.all_todos && data.all_todos.length > 0) {
    csvRows.push(''); // Пустая строка для разделения секций
    csvRows.push('TODO/FIXME Comments:');
    csvRows.push('File Path,Line,Type,Content');
    
    data.all_todos.forEach(todo => {
      const row = [
        `"${todo.file_path}"`,
        todo.line.toString(),
        todo.type,
        `"${todo.content.replace(/"/g, '""')}"` // Экранируем кавычки в содержимом
      ];
      csvRows.push(row.join(','));
    });
  }

  return csvRows.join('\n');
};

/**
 * Экспортирует данные в формате Markdown
 * 
 * Markdown отлично подходит для документации и отчетов.
 * Он читаем как в текстовом виде, так и при рендеринге.
 * 
 * @param data - данные анализа проекта
 * @param options - настройки экспорта
 * @returns строка с Markdown документом
 */
export const exportToMarkdown = (data: ProjectAnalysis, options: ExportOptions): string => {
  let markdown = '';
  
  // Создаем заголовок документа
  const projectName = data.project_path.split('/').pop() || 'Unknown Project';
  markdown += `# Анализ проекта: ${projectName}\n\n`;
  markdown += `**Путь проекта:** \`${data.project_path}\`\n\n`;
  markdown += `**Дата анализа:** ${new Date().toLocaleDateString('ru-RU')}\n\n`;

  // Добавляем метрики, если пользователь их запросил
  if (options.includeMetrics) {
    markdown += '## 📊 Общая статистика\n\n';
    markdown += `- **Файлов:** ${data.metrics.total_files}\n`;
    markdown += `- **Строк кода:** ${data.metrics.total_lines.toLocaleString('ru-RU')}\n`;
    markdown += `- **Функций:** ${data.metrics.total_functions}\n`;
    markdown += `- **Среднее строк на файл:** ${Math.round(data.metrics.avg_lines_per_file)}\n`;
    markdown += `- **Языки программирования:** ${data.metrics.languages.join(', ')}\n\n`;

    if (data.architecture_patterns.length > 0) {
      markdown += `- **Архитектурные паттерны:** ${data.architecture_patterns.join(', ')}\n\n`;
    }
  }

  // Добавляем список файлов
  markdown += '## 📁 Файлы проекта\n\n';
  markdown += '| Файл | Тип | Размер | Строк кода | Функций |\n';
  markdown += '|------|-----|--------|------------|----------|\n';
  
  data.files.forEach(file => {
    const fileName = file.name;
    const fileType = file.type || 'unknown';
    const fileSize = `${(file.size / 1024).toFixed(1)} KB`;
    const linesOfCode = file.lines_of_code || 0;
    const functionsCount = file.functions.length;
    
    markdown += `| \`${fileName}\` | ${fileType} | ${fileSize} | ${linesOfCode} | ${functionsCount} |\n`;
  });
  markdown += '\n';

  // Добавляем зависимости, если запрошены
  if (options.includeDependencies && data.dependencies && data.dependencies.length > 0) {
    markdown += '## 🔗 Зависимости между файлами\n\n';
    markdown += '| Источник | Цель | Тип |\n';
    markdown += '|----------|------|-----|\n';
    
    data.dependencies.forEach(dep => {
      const from = dep.from.split('/').pop() || dep.from;
      const to = dep.to;
      const type = dep.type;
      markdown += `| \`${from}\` | \`${to}\` | ${type} |\n`;
    });
    markdown += '\n';
  }

  // Добавляем TODO комментарии, если запрошены
  if (options.includeTodos && data.all_todos && data.all_todos.length > 0) {
    markdown += '## 📝 TODO/FIXME комментарии\n\n';
    
    data.all_todos.forEach(todo => {
      const fileName = todo.file_path.split('/').pop();
      const icon = todo.type === 'FIXME' ? '🔴' : todo.type === 'HACK' ? '🟠' : '💡';
      
      markdown += `### ${icon} ${todo.type} в \`${fileName}\`\n\n`;
      markdown += `**Строка:** ${todo.line}\n\n`;
      markdown += `**Комментарий:** ${todo.content}\n\n`;
      markdown += `**Полный путь:** \`${todo.file_path}\`\n\n`;
      markdown += '---\n\n';
    });
  }

  // Добавляем документацию, если запрошена
  if (options.includeDocumentation && data.project_documentation && data.project_documentation.length > 0) {
    markdown += '## 📖 Документация из кода\n\n';
    
    data.project_documentation.forEach(fileDoc => {
      const fileName = fileDoc.file_path.split('/').pop();
      markdown += `### Файл: \`${fileName}\`\n\n`;
      
      if (fileDoc.functions.length === 0) {
        markdown += '_В этом файле не найдено задокументированных функций._\n\n';
      } else {
        fileDoc.functions.forEach(func => {
          markdown += `#### Функция: \`${func.name}\`\n\n`;
          
          if (func.description) {
            markdown += `**Описание:** ${func.description}\n\n`;
          }
          
          if (func.params && func.params.length > 0) {
            markdown += '**Параметры:**\n\n';
            func.params.forEach(param => {
              const typeInfo = param.type ? ` (${param.type})` : '';
              markdown += `- \`${param.name}\`${typeInfo}: ${param.description || 'Описание отсутствует'}\n`;
            });
            markdown += '\n';
          }
          
          if (func.returns) {
            const returnType = func.returns.type ? ` (${func.returns.type})` : '';
            markdown += `**Возвращает${returnType}:** ${func.returns.description || 'Описание отсутствует'}\n\n`;
          }
          
          if (func.line_start) {
            markdown += `**Расположение:** строки ${func.line_start}-${func.line_end || func.line_start}\n\n`;
          }
          
          markdown += '---\n\n';
        });
      }
    });
  }

  return markdown;
};

/**
 * Определяет подходящее имя файла для экспорта
 * 
 * Создает осмысленное имя файла на основе пути проекта и формата экспорта.
 * Это помогает пользователям легко находить экспортированные файлы.
 * 
 * @param projectPath - путь к анализируемому проекту
 * @param format - формат экспорта
 * @returns имя файла для скачивания
 */
export const generateExportFilename = (projectPath: string, format: string): string => {
  const projectName = projectPath.split('/').pop() || 'project';
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD формат
  const extension = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'md';
  
  return `${projectName}-analysis-${timestamp}.${extension}`;
};

/**
 * Главная функция экспорта - координирует весь процесс
 * 
 * Эта функция работает как "дирижер оркестра", выбирая правильный
 * формат экспорта и запуская процесс скачивания файла.
 * 
 * @param data - данные анализа проекта
 * @param options - настройки экспорта
 */
export const exportAnalysisData = (data: ProjectAnalysis, options: ExportOptions): void => {
  let content: string;
  let mimeType: string;
  
  // Выбираем правильную функцию экспорта и MIME тип на основе формата
  switch (options.format) {
    case 'json':
      content = exportToJson(data, options);
      mimeType = 'application/json;charset=utf-8';
      break;
    case 'csv':
      content = exportToCsv(data, options);
      mimeType = 'text/csv;charset=utf-8';
      break;
    case 'markdown':
      content = exportToMarkdown(data, options);
      mimeType = 'text/markdown;charset=utf-8';
      break;
    default:
      console.error(`Неподдерживаемый формат экспорта: ${options.format}`);
      return;
  }
  
  // Генерируем имя файла и запускаем скачивание
  const filename = generateExportFilename(data.project_path, options.format);
  downloadFile(content, filename, mimeType);
};

/**
 * Создает настройки экспорта по умолчанию
 * 
 * Предоставляет разумные значения по умолчанию для экспорта.
 * Пользователи могут изменить эти настройки по своему усмотрению.
 * 
 * @param format - желаемый формат экспорта
 * @returns объект с настройками экспорта по умолчанию
 */
export const createDefaultExportOptions = (format: 'json' | 'csv' | 'markdown'): ExportOptions => ({
  format,
  includeMetrics: true,        // Метрики полезны в большинстве случаев
  includeDependencies: true,   // Зависимости показывают архитектуру
  includeTodos: true,          // TODO помогают понять состояние проекта
  includeDocumentation: true   // Документация всегда ценна
});
