/**
 * Анализатор проектов - координирует анализ всех файлов
 */

import { glob } from 'glob';
import { promises as fs } from 'node:fs';
import { ProjectAnalysis, FileAnalysis, AnalysisConfig, ProjectMetrics } from '../types/analysis.types.js';
import { FileAnalyzer } from './FileAnalyzer.js';
import { MetricsCalculator } from './MetricsCalculator.js';
import { ArchitectureDetector } from './ArchitectureDetector.js';

export class ProjectAnalyzer {
  private fileAnalyzer: FileAnalyzer;
  private metricsCalculator: MetricsCalculator;
  private architectureDetector: ArchitectureDetector;

  constructor(private config: AnalysisConfig) {
    this.fileAnalyzer = new FileAnalyzer(config);
    this.metricsCalculator = new MetricsCalculator();
    this.architectureDetector = new ArchitectureDetector();
  }

  /**
   * Алиас для analyzeProject для обратной совместимости
   */
  async analyze(projectPath: string, options?: { includeTests?: boolean }): Promise<ProjectAnalysis> {
    if (options?.includeTests) {
      this.updateConfig({ includeTests: true });
    }
    return this.analyzeProject(projectPath);
  }

  async analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
    // Проверяем существование папки
    try {
      await fs.access(projectPath);
    } catch {
      throw new Error(`Project path does not exist: ${projectPath}`);
    }

    // Получаем список файлов для анализа
    const files = await this.getProjectFiles(projectPath);
    
    // Анализируем файлы параллельно с ограничением concurrency
    const fileAnalyses = await this.analyzeFilesInBatches(files, 10);
    
    // Вычисляем метрики проекта
    const metrics = this.metricsCalculator.calculateProjectMetrics(fileAnalyses);
    
    // Определяем архитектурные паттерны
    const architecturePatterns = this.architectureDetector.detectPatterns(fileAnalyses);
    
    // Собираем зависимости
    const dependencies = this.extractDependencies(fileAnalyses);
    
    // Собираем все TODO комментарии
    const todos = fileAnalyses.flatMap(file => 
      file.todos?.map(todo => ({
        ...todo,
        file_path: file.path
      })) || []
    );

    return {
      projectPath,
      files: fileAnalyses,
      dependencies,
      metrics,
      architecturePatterns,
      todos
    };
  }

  private async getProjectFiles(projectPath: string): Promise<string[]> {
    const patterns = [
      '**/*.js',
      '**/*.ts',
      '**/*.jsx',
      '**/*.tsx',
      '**/*.py',
      '**/*.html',
      '**/*.css',
      '**/*.json'
    ];

    const ignorePatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/coverage/**',
      ...this.config.ignorePatterns
    ];

    if (!this.config.includeTests) {
      ignorePatterns.push(
        '**/*.test.*',
        '**/*.spec.*',
        '**/test/**',
        '**/tests/**',
        '**/__tests__/**'
      );
    }

    const allFiles: string[] = [];

    for (const pattern of patterns) {
      const foundFiles = await glob(pattern, {
        cwd: projectPath,
        ignore: ignorePatterns,
        absolute: true
      });
      allFiles.push(...foundFiles);
    }

    return [...new Set(allFiles)]; // Remove duplicates
  }

  private async analyzeFilesInBatches(
    files: string[], 
    batchSize: number
  ): Promise<FileAnalysis[]> {
    const results: FileAnalysis[] = [];
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (filePath) => {
        try {
          return await this.fileAnalyzer.analyzeFile(filePath);
        } catch (error) {
          console.warn(`Ошибка анализа файла ${filePath}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(Boolean) as FileAnalysis[]);

      // Небольшая задержка между батчами для избежания перегрузки
      if (i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    return results;
  }

  private extractDependencies(files: FileAnalysis[]): Array<{
    from: string;
    to: string;
    type: string;
  }> {
    const dependencies: Array<{ from: string; to: string; type: string }> = [];
    
    for (const file of files) {
      // Зависимости через импорты
      for (const importPath of file.imports) {
        dependencies.push({
          from: file.path,
          to: importPath,
          type: 'import'
        });
      }

      // Зависимости через экспорты (обратные связи)
      for (const exportItem of file.exports) {
        dependencies.push({
          from: file.path,
          to: exportItem,
          type: 'export'
        });
      }
    }

    return dependencies;
  }

  /**
   * Создает отчет о прогрессе анализа
   */
  async analyzeProjectWithProgress(
    projectPath: string,
    onProgress?: (progress: number, currentFile?: string) => void
  ): Promise<ProjectAnalysis> {
    const files = await this.getProjectFiles(projectPath);
    const total = files.length;
    
    if (onProgress) {
      onProgress(0, 'Начинаем анализ...');
    }

    const fileAnalyses: FileAnalysis[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const filePath = files[i];
      
      try {
        const analysis = await this.fileAnalyzer.analyzeFile(filePath);
        fileAnalyses.push(analysis);
        
        if (onProgress) {
          const progress = ((i + 1) / total) * 100;
          onProgress(progress, filePath);
        }
      } catch (error) {
        console.warn(`Ошибка анализа файла ${filePath}:`, error);
      }
    }

    // Завершаем анализ
    const metrics = this.metricsCalculator.calculateProjectMetrics(fileAnalyses);
    const architecturePatterns = this.architectureDetector.detectPatterns(fileAnalyses);
    const dependencies = this.extractDependencies(fileAnalyses);
    const todos = fileAnalyses.flatMap(file => 
      file.todos?.map(todo => ({
        ...todo,
        file_path: file.path
      })) || []
    );

    if (onProgress) {
      onProgress(100, 'Анализ завершен!');
    }

    return {
      projectPath,
      files: fileAnalyses,
      dependencies,
      metrics,
      architecturePatterns,
      todos
    };
  }

  /**
   * Обновляет конфигурацию анализатора
   */
  updateConfig(newConfig: Partial<AnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.fileAnalyzer = new FileAnalyzer(this.config);
  }

  /**
   * Получает статистику по проекту без полного анализа
   */
  async getQuickStats(projectPath: string): Promise<{
    fileCount: number;
    languages: string[];
    estimatedSize: number;
  }> {
    const files = await this.getProjectFiles(projectPath);
    const languages = new Set<string>();
    let estimatedSize = 0;

    for (const filePath of files.slice(0, 100)) { // Анализируем только первые 100 файлов
      try {
        const stats = await fs.stat(filePath);
        const ext = filePath.split('.').pop()?.toLowerCase();
        if (ext) languages.add(ext);
        estimatedSize += stats.size;
      } catch (error) {
        // Игнорируем ошибки при быстром анализе
      }
    }

    return {
      fileCount: files.length,
      languages: Array.from(languages),
      estimatedSize
    };
  }
}
