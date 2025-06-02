/**
 * AI Insights Generator - Генератор умных инсайтов для анализа кода
 * 
 * Анализирует структуру проекта и генерирует полезные рекомендации
 * на основе паттернов, метрик качества и лучших практик.
 */

import { ProjectAnalysis } from '@/types/analysis.types';

export interface AIInsights {
  codeQuality: number;
  architectureScore: number;
  maintainabilityIndex: number;
  technicalDebt: number;
  recommendations: string[];
  patterns: string[];
  risks: string[];
  opportunities: string[];
  complexity: 'low' | 'medium' | 'high' | 'extreme';
  maintainabilityLevel: 'excellent' | 'good' | 'fair' | 'poor';
}

export function generateAIInsights(analysis: ProjectAnalysis): AIInsights {
  const insights: AIInsights = {
    codeQuality: 0,
    architectureScore: 0,
    maintainabilityIndex: 0,
    technicalDebt: 0,
    recommendations: [],
    patterns: [],
    risks: [],
    opportunities: [],
    complexity: 'low',
    maintainabilityLevel: 'excellent'
  };

  // Анализ базовых метрик
  const files = analysis.files;
  const todos = analysis.all_todos || [];
  const dependencies = analysis.dependencies;
  const docs = analysis.project_documentation || [];
  const duplicates = analysis.file_duplicates || [];

  // 1. Оценка качества кода (0-100)
  insights.codeQuality = calculateCodeQuality(files, todos, docs, duplicates);

  // 2. Архитектурная оценка (0-100)
  insights.architectureScore = calculateArchitectureScore(analysis, dependencies);

  // 3. Индекс поддерживаемости (0-100)
  insights.maintainabilityIndex = calculateMaintainabilityIndex(files, todos, docs);

  // 4. Технический долг (0-100, где больше = хуже)
  insights.technicalDebt = calculateTechnicalDebt(todos, duplicates, files);

  // 5. Уровень сложности
  insights.complexity = determineComplexity(files, dependencies);

  // 6. Уровень поддерживаемости
  insights.maintainabilityLevel = determineMaintainabilityLevel(insights.maintainabilityIndex);

  // 7. Генерация рекомендаций
  insights.recommendations = generateRecommendations(analysis, insights);

  // 8. Обнаружение паттернов
  insights.patterns = detectPatterns(analysis);

  // 9. Выявление рисков
  insights.risks = identifyRisks(analysis, insights);

  // 10. Поиск возможностей улучшения
  insights.opportunities = findOpportunities(analysis, insights);

  return insights;
}

function calculateCodeQuality(
  files: ProjectAnalysis['files'], 
  todos: ProjectAnalysis['all_todos'], 
  docs: ProjectAnalysis['project_documentation'],
  duplicates: ProjectAnalysis['file_duplicates']
): number {
  let score = 80; // Базовая оценка

  // Снижение за TODO/FIXME
  const criticalTodos = todos?.filter(t => t.type === 'FIXME').length || 0;
  const totalTodos = todos?.length || 0;
  score -= Math.min(30, criticalTodos * 5 + totalTodos * 1);

  // Снижение за дубликаты
  const duplicateCount = duplicates?.length || 0;
  score -= Math.min(20, duplicateCount * 3);

  // Увеличение за документацию
  const totalFunctions = docs?.reduce((sum, doc) => sum + doc.functions.length, 0) || 0;
  const documentedFunctions = docs?.reduce((sum, doc) => 
    sum + doc.functions.filter(f => f.description).length, 0) || 0;
  
  if (totalFunctions > 0) {
    const docCoverage = (documentedFunctions / totalFunctions) * 100;
    score += Math.min(20, docCoverage * 0.2);
  }

  // Анализ размеров файлов
  const avgFileSize = files.length > 0 ? files.reduce((sum, f) => sum + f.size, 0) / files.length : 0;
  const largeFiles = files.filter(f => f.size > 10000).length;
  
  if (avgFileSize > 5000) {
    score -= Math.min(10, (avgFileSize - 5000) / 1000);
  }
  if (largeFiles > files.length * 0.2) {
    score -= 15; // Много крупных файлов
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateArchitectureScore(
  analysis: ProjectAnalysis, 
  dependencies: ProjectAnalysis['dependencies']
): number {
  let score = 60; // Базовая оценка

  // Бонус за архитектурные паттерны
  const patterns = analysis.architecture_patterns;
  score += Math.min(25, patterns.length * 8);

  // Анализ зависимостей
  const dependencyRatio = dependencies.length / Math.max(1, analysis.files.length);
  
  if (dependencyRatio < 0.5) {
    score += 10; // Слабая связанность
  } else if (dependencyRatio > 2) {
    score -= 15; // Сильная связанность
  }

  // Проверка на циклические зависимости
  const hasCycles = detectCircularDependencies(dependencies);
  if (hasCycles) {
    score -= 20;
  }

  // Анализ структуры директорий
  const directoryStructure = analyzeDirectoryStructure(analysis.files);
  if (directoryStructure.isWellOrganized) {
    score += 10;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateMaintainabilityIndex(
  files: ProjectAnalysis['files'],
  todos: ProjectAnalysis['all_todos'],
  docs: ProjectAnalysis['project_documentation']
): number {
  let score = 70; // Базовая оценка

  // Факторы, влияющие на поддерживаемость
  const avgFileSize = files.length > 0 ? files.reduce((sum, f) => sum + f.size, 0) / files.length : 0;
  const avgFunctionsPerFile = files.length > 0 ? files.reduce((sum, f) => sum + f.functions.length, 0) / files.length : 0;
  
  // Размер файлов
  if (avgFileSize < 1000) {
    score += 15; // Маленькие файлы легче поддерживать
  } else if (avgFileSize > 5000) {
    score -= 20;
  }

  // Количество функций на файл
  if (avgFunctionsPerFile < 10) {
    score += 10;
  } else if (avgFunctionsPerFile > 25) {
    score -= 15;
  }

  // Технический долг
  const criticalTodos = todos?.filter(t => t.type === 'FIXME').length || 0;
  score -= Math.min(25, criticalTodos * 4);

  // Документация
  const totalFunctions = docs?.reduce((sum, doc) => sum + doc.functions.length, 0) || 0;
  const documentedFunctions = docs?.reduce((sum, doc) => 
    sum + doc.functions.filter(f => f.description).length, 0) || 0;
  
  if (totalFunctions > 0) {
    const docCoverage = (documentedFunctions / totalFunctions) * 100;
    score += Math.min(15, docCoverage * 0.15);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateTechnicalDebt(
  todos: ProjectAnalysis['all_todos'],
  duplicates: ProjectAnalysis['file_duplicates'],
  files: ProjectAnalysis['files']
): number {
  let debt = 0;

  // Долг от TODO/FIXME
  const todoDebt = (todos?.length || 0) * 2;
  const fixmeDebt = todos?.filter(t => t.type === 'FIXME').length * 8 || 0;
  debt += todoDebt + fixmeDebt;

  // Долг от дубликатов
  const duplicateDebt = (duplicates?.length || 0) * 10;
  debt += duplicateDebt;

  // Долг от больших файлов
  const largeFiles = files.filter(f => f.size > 10000);
  const largeFileDebt = largeFiles.length * 5;
  debt += largeFileDebt;

  // Долг от отсутствия документации
  const undocumentedFiles = files.filter(f => f.functions.length > 5).length;
  debt += undocumentedFiles * 3;

  return Math.min(100, debt);
}

function determineComplexity(
  files: ProjectAnalysis['files'], 
  dependencies: ProjectAnalysis['dependencies']
): 'low' | 'medium' | 'high' | 'extreme' {
  const fileCount = files.length;
  const totalLines = files.reduce((sum, f) => sum + (f.lines_of_code || 0), 0);
  const dependencyCount = dependencies.length;

  const complexityScore = 
    (fileCount > 1000 ? 30 : fileCount > 500 ? 20 : fileCount > 100 ? 10 : 0) +
    (totalLines > 100000 ? 30 : totalLines > 50000 ? 20 : totalLines > 10000 ? 10 : 0) +
    (dependencyCount > 500 ? 20 : dependencyCount > 200 ? 15 : dependencyCount > 50 ? 10 : 0);

  if (complexityScore >= 60) return 'extreme';
  if (complexityScore >= 40) return 'high';
  if (complexityScore >= 20) return 'medium';
  return 'low';
}

function determineMaintainabilityLevel(maintainabilityIndex: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (maintainabilityIndex >= 85) return 'excellent';
  if (maintainabilityIndex >= 70) return 'good';
  if (maintainabilityIndex >= 50) return 'fair';
  return 'poor';
}

function generateRecommendations(analysis: ProjectAnalysis, insights: AIInsights): string[] {
  const recommendations: string[] = [];

  // Рекомендации по качеству кода
  if (insights.codeQuality < 70) {
    recommendations.push('Улучшите качество кода: устраните FIXME комментарии и рефакторите дублирующийся код');
  }

  // Рекомендации по архитектуре
  if (insights.architectureScore < 60) {
    recommendations.push('Рассмотрите применение архитектурных паттернов для улучшения структуры проекта');
  }

  // Рекомендации по документации
  const docs = analysis.project_documentation || [];
  const totalFunctions = docs.reduce((sum, doc) => sum + doc.functions.length, 0);
  const documentedFunctions = docs.reduce((sum, doc) => 
    sum + doc.functions.filter(f => f.description).length, 0);
  
  if (totalFunctions > 0 && (documentedFunctions / totalFunctions) < 0.5) {
    recommendations.push('Добавьте документацию к функциям для улучшения читаемости кода');
  }

  // Рекомендации по размеру файлов
  const largeFiles = analysis.files.filter(f => f.size > 10000);
  if (largeFiles.length > analysis.files.length * 0.2) {
    recommendations.push('Разбейте крупные файлы на более мелкие модули для улучшения поддерживаемости');
  }

  // Рекомендации по техническому долгу
  if (insights.technicalDebt > 30) {
    recommendations.push('Приоритизируйте устранение технического долга для повышения скорости разработки');
  }

  // Рекомендации по зависимостям
  const dependencyRatio = analysis.dependencies.length / Math.max(1, analysis.files.length);
  if (dependencyRatio > 2) {
    recommendations.push('Оптимизируйте зависимости между модулями для снижения сложности');
  }

  // Рекомендации по дубликатам
  if ((analysis.file_duplicates?.length || 0) > 0) {
    recommendations.push('Устраните дублирующиеся файлы путем создания общих модулей');
  }

  return recommendations.slice(0, 6); // Ограничиваем количество рекомендаций
}

function detectPatterns(analysis: ProjectAnalysis): string[] {
  const patterns: string[] = [];

  // Добавляем обнаруженные архитектурные паттерны
  patterns.push(...analysis.architecture_patterns);

  // Анализ структуры файлов для обнаружения паттернов
  const files = analysis.files;
  const fileTypes = files.reduce((acc, file) => {
    acc[file.type] = (acc[file.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Паттерны по типам файлов
  if (fileTypes['tsx'] || fileTypes['jsx']) {
    patterns.push('React Components');
  }
  if (fileTypes['vue']) {
    patterns.push('Vue.js Components');
  }
  if (fileTypes['py'] && files.some(f => f.name.includes('model'))) {
    patterns.push('Python Models');
  }
  if (fileTypes['ts'] || fileTypes['js']) {
    patterns.push('JavaScript/TypeScript Modules');
  }

  // Паттерны по именованию
  const hasControllers = files.some(f => f.name.toLowerCase().includes('controller'));
  const hasServices = files.some(f => f.name.toLowerCase().includes('service'));
  const hasModels = files.some(f => f.name.toLowerCase().includes('model'));

  if (hasControllers && hasServices && hasModels) {
    patterns.push('MVC Architecture');
  }

  return [...new Set(patterns)]; // Убираем дубликаты
}

function identifyRisks(analysis: ProjectAnalysis, insights: AIInsights): string[] {
  const risks: string[] = [];

  // Риски качества кода
  if (insights.codeQuality < 50) {
    risks.push('Низкое качество кода может привести к увеличению багов');
  }

  // Риски архитектуры
  if (insights.architectureScore < 40) {
    risks.push('Слабая архитектура затрудняет масштабирование проекта');
  }

  // Риски сложности
  if (insights.complexity === 'extreme') {
    risks.push('Экстремальная сложность проекта усложняет онбординг новых разработчиков');
  }

  // Риски технического долга
  if (insights.technicalDebt > 50) {
    risks.push('Высокий технический долг замедляет разработку новых функций');
  }

  // Риски зависимостей
  const hasCycles = detectCircularDependencies(analysis.dependencies);
  if (hasCycles) {
    risks.push('Циклические зависимости могут привести к проблемам с тестированием');
  }

  // Риски документации
  const docs = analysis.project_documentation || [];
  if (docs.length === 0) {
    risks.push('Отсутствие документации затрудняет понимание кода');
  }

  return risks.slice(0, 5);
}

function findOpportunities(analysis: ProjectAnalysis, insights: AIInsights): string[] {
  const opportunities: string[] = [];

  // Возможности улучшения качества
  if (insights.codeQuality > 70 && insights.codeQuality < 90) {
    opportunities.push('Автоматизируйте тестирование для поддержания высокого качества кода');
  }

  // Возможности оптимизации
  if (insights.complexity === 'low' || insights.complexity === 'medium') {
    opportunities.push('Рассмотрите добавление новых функций или оптимизацию производительности');
  }

  // Возможности документации
  const docs = analysis.project_documentation || [];
  if (docs.length > 0) {
    opportunities.push('Создайте автоматическую генерацию API документации');
  }

  // Возможности архитектуры
  if (analysis.architecture_patterns.length > 0) {
    opportunities.push('Используйте существующие паттерны для стандартизации новых модулей');
  }

  // Возможности рефакторинга
  if ((analysis.file_duplicates?.length || 0) === 0) {
    opportunities.push('Отличная работа! Продолжайте следить за отсутствием дубликатов');
  }

  return opportunities.slice(0, 4);
}

// Вспомогательные функции
function detectCircularDependencies(dependencies: ProjectAnalysis['dependencies']): boolean {
  const graph = new Map<string, string[]>();
  
  // Строим граф зависимостей
  dependencies.forEach(dep => {
    if (!graph.has(dep.from)) {
      graph.set(dep.from, []);
    }
    graph.get(dep.from)!.push(dep.to);
  });

  // Проверяем на циклы с помощью DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(node: string): boolean {
    if (recursionStack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    recursionStack.add(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) return true;
    }

    recursionStack.delete(node);
    return false;
  }

  for (const node of graph.keys()) {
    if (hasCycle(node)) return true;
  }

  return false;
}

function analyzeDirectoryStructure(files: ProjectAnalysis['files']): { isWellOrganized: boolean } {
  const directories = new Set<string>();
  
  files.forEach(file => {
    const pathParts = file.path.split('/');
    if (pathParts.length > 1) {
      directories.add(pathParts[0]);
    }
  });

  // Простая эвристика: хорошо организованный проект имеет 3-10 основных директорий
  const isWellOrganized = directories.size >= 3 && directories.size <= 10;
  
  return { isWellOrganized };
}

export default generateAIInsights;
