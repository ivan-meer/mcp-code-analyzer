/**
 * Калькулятор метрик проекта
 */

import { FileAnalysis, ProjectMetrics } from '../types/analysis.types.js';

export class MetricsCalculator {
  
  calculateProjectMetrics(files: FileAnalysis[]): ProjectMetrics {
    const totalFiles = files.length;
    const totalLines = files.reduce((sum, file) => sum + (file.linesOfCode || 0), 0);
    const totalFunctions = files.reduce((sum, file) => sum + file.functions.length, 0);
    const totalComplexity = files.reduce((sum, file) => sum + (file.complexity || 0), 0);
    
    const languages = [...new Set(files.map(file => file.type))].filter(Boolean);
    
    const avgLinesPerFile = totalFiles > 0 ? totalLines / totalFiles : 0;
    const avgComplexity = totalFiles > 0 ? totalComplexity / totalFiles : 0;

    return {
      totalFiles,
      totalLines,
      totalFunctions,
      avgLinesPerFile: Math.round(avgLinesPerFile * 100) / 100,
      avgComplexity: Math.round(avgComplexity * 100) / 100,
      languages,
      testCoverage: this.calculateTestCoverage(files)
    };
  }

  private calculateTestCoverage(files: FileAnalysis[]): number {
    const testFiles = files.filter(file => 
      file.name.includes('.test.') || 
      file.name.includes('.spec.') ||
      file.path.includes('/test/') ||
      file.path.includes('/tests/') ||
      file.path.includes('/__tests__/')
    );

    const sourceFiles = files.filter(file => 
      !testFiles.includes(file) && 
      ['js', 'ts', 'jsx', 'tsx', 'py'].includes(file.type)
    );

    if (sourceFiles.length === 0) return 0;

    // Простая эвристика: процент исходных файлов, у которых есть соответствующие тесты
    const testedFiles = sourceFiles.filter(sourceFile => {
      const baseName = sourceFile.name.replace(/\.(js|ts|jsx|tsx|py)$/, '');
      return testFiles.some(testFile => 
        testFile.name.includes(baseName) || 
        testFile.path.includes(baseName)
      );
    });

    return Math.round((testedFiles.length / sourceFiles.length) * 100);
  }

  /**
   * Рассчитывает распределение размеров файлов
   */
  calculateFileSizeDistribution(files: FileAnalysis[]): {
    small: number;    // < 100 строк
    medium: number;   // 100-500 строк  
    large: number;    // 500-1000 строк
    huge: number;     // > 1000 строк
  } {
    const distribution = { small: 0, medium: 0, large: 0, huge: 0 };

    files.forEach(file => {
      const lines = file.linesOfCode || 0;
      if (lines < 100) {
        distribution.small++;
      } else if (lines < 500) {
        distribution.medium++;
      } else if (lines < 1000) {
        distribution.large++;
      } else {
        distribution.huge++;
      }
    });

    return distribution;
  }

  /**
   * Рассчитывает индекс технического долга
   */
  calculateTechnicalDebtIndex(files: FileAnalysis[]): number {
    let debtScore = 0;
    let totalFiles = 0;

    files.forEach(file => {
      if (!file.todos) return;
      
      totalFiles++;
      const todos = file.todos;
      
      // Веса для разных типов TODO
      const weights = { FIXME: 3, TODO: 2, HACK: 1, NOTE: 0.5 };
      
      todos.forEach(todo => {
        debtScore += weights[todo.type] || 1;
      });

      // Дополнительные штрафы за сложность
      if (file.complexity && file.complexity > 10) {
        debtScore += (file.complexity - 10) * 0.1;
      }

      // Штраф за большие файлы
      if (file.linesOfCode && file.linesOfCode > 500) {
        debtScore += (file.linesOfCode - 500) / 1000;
      }
    });

    return totalFiles > 0 ? Math.round((debtScore / totalFiles) * 100) / 100 : 0;
  }

  /**
   * Анализирует качество кода
   */
  calculateCodeQualityScore(files: FileAnalysis[]): {
    overall: number;
    complexity: number;
    documentation: number;
    maintainability: number;
  } {
    const metrics = this.calculateProjectMetrics(files);
    const sizeDistribution = this.calculateFileSizeDistribution(files);
    const debtIndex = this.calculateTechnicalDebtIndex(files);

    // Оценка сложности (0-100, чем меньше сложность, тем лучше)
    const complexityScore = Math.max(0, 100 - (metrics.avgComplexity * 5));

    // Оценка документации (на основе комментариев и README файлов)
    const documentationScore = this.calculateDocumentationScore(files);

    // Оценка поддерживаемости (на основе размеров файлов и структуры)
    const maintainabilityScore = Math.max(0, 100 - (
      (sizeDistribution.huge * 10) + 
      (sizeDistribution.large * 3) +
      debtIndex
    ));

    const overall = Math.round(
      (complexityScore + documentationScore + maintainabilityScore) / 3
    );

    return {
      overall,
      complexity: Math.round(complexityScore),
      documentation: Math.round(documentationScore),
      maintainability: Math.round(maintainabilityScore)
    };
  }

  private calculateDocumentationScore(files: FileAnalysis[]): number {
    let score = 0;

    // Проверяем наличие README
    const hasReadme = files.some(file => 
      file.name.toLowerCase().includes('readme')
    );
    if (hasReadme) score += 30;

    // Проверяем наличие документации
    const hasDocumentation = files.some(file =>
      file.type === 'md' && file.name !== 'README.md'
    );
    if (hasDocumentation) score += 20;

    // Эвристика для комментариев в коде
    const codeFiles = files.filter(file => 
      ['js', 'ts', 'jsx', 'tsx', 'py'].includes(file.type)
    );

    if (codeFiles.length > 0) {
      // Предполагаем, что файлы с функциями имеют некоторую документацию
      const documentedFiles = codeFiles.filter(file => 
        file.functions.length > 0 && file.linesOfCode && file.linesOfCode > 20
      );
      
      const documentationRatio = documentedFiles.length / codeFiles.length;
      score += documentationRatio * 50;
    }

    return Math.min(100, score);
  }
}
