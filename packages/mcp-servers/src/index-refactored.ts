#!/usr/bin/env node

/**
 * Рефакторинговая версия MCP Code Analyzer Server
 * Разбит на модули для лучшей поддержки и производительности
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { ProjectAnalyzer } from './analyzers/ProjectAnalyzer.js';
import { FileAnalyzer } from './analyzers/FileAnalyzer.js';
import { AnalysisConfig } from './types/analysis.types.js';

export class CodeAnalyzerServer {
  private server: Server;
  private projectAnalyzer: ProjectAnalyzer;
  private analysisCache = new Map<string, any>();

  constructor() {
    this.server = new Server({
      name: 'code-analyzer-server',
      version: '2.0.0',
    });

    // Настройка по умолчанию
    const defaultConfig: AnalysisConfig = {
      includeTests: true,
      analysisDepth: 'medium',
      languages: ['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json'],
      ignorePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/coverage/**'
      ],
      maxFileSize: 1024 * 1024 // 1MB
    };

    this.projectAnalyzer = new ProjectAnalyzer(defaultConfig);
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze_project',
          description: 'Комплексный анализ структуры проекта с оптимизированной производительностью',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Путь к корневой папке проекта'
              },
              includeTests: {
                type: 'boolean',
                description: 'Включать ли тестовые файлы в анализ',
                default: true
              },
              analysisDepth: {
                type: 'string',
                enum: ['basic', 'medium', 'deep'],
                description: 'Глубина анализа (basic - быстро, deep - подробно)',
                default: 'medium'
              },
              useCache: {
                type: 'boolean',
                description: 'Использовать кеширование результатов',
                default: true
              }
            },
            required: ['projectPath']
          }
        },
        {
          name: 'analyze_file',
          description: 'Детальный анализ отдельного файла',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'Путь к файлу для анализа'
              },
              analysisDepth: {
                type: 'string',
                enum: ['basic', 'medium', 'deep'],
                description: 'Глубина анализа файла',
                default: 'medium'
              }
            },
            required: ['filePath']
          }
        },
        {
          name: 'get_quick_stats',
          description: 'Быстрая статистика по проекту без полного анализа',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Путь к корневой папке проекта'
              }
            },
            required: ['projectPath']
          }
        },
        {
          name: 'clear_cache',
          description: 'Очистить кеш анализа',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Путь к проекту для очистки кеша (опционально)'
              }
            }
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze_project':
            return await this.handleAnalyzeProject(args);
          
          case 'analyze_file':
            return await this.handleAnalyzeFile(args);
          
          case 'get_quick_stats':
            return await this.handleGetQuickStats(args);
          
          case 'clear_cache':
            return await this.handleClearCache(args);
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        console.error(`Error in ${name}:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Error in ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async handleAnalyzeProject(args: {
    projectPath: string;
    includeTests?: boolean;
    analysisDepth?: 'basic' | 'medium' | 'deep';
    useCache?: boolean;
  }) {
    const { projectPath, includeTests = true, analysisDepth = 'medium', useCache = true } = args;

    // Проверяем кеш
    const cacheKey = `${projectPath}-${includeTests}-${analysisDepth}`;
    if (useCache && this.analysisCache.has(cacheKey)) {
      const cachedResult = this.analysisCache.get(cacheKey);
      return {
        content: [
          {
            type: 'text',
            text: '📋 **Результат из кеша**\n\nАнализ уже выполнялся ранее. Используется кешированный результат для ускорения работы.'
          },
          {
            type: 'text',
            text: JSON.stringify(cachedResult, null, 2)
          }
        ]
      };
    }

    // Обновляем конфигурацию
    this.projectAnalyzer.updateConfig({
      includeTests,
      analysisDepth
    });

    console.error(`🚀 Начинаем анализ проекта: ${projectPath}`);
    
    const startTime = Date.now();
    const analysis = await this.projectAnalyzer.analyzeProjectWithProgress(
      projectPath,
      (progress, currentFile) => {
        if (progress % 10 === 0 || progress === 100) {
          console.error(`📊 Прогресс: ${progress.toFixed(0)}% ${currentFile ? `- ${currentFile}` : ''}`);
        }
      }
    );
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Сохраняем в кеш
    if (useCache) {
      this.analysisCache.set(cacheKey, analysis);
    }

    const summary = this.formatProjectSummary(analysis, duration);

    return {
      content: [
        {
          type: 'text',
          text: summary
        },
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2)
        }
      ]
    };
  }

  private async handleAnalyzeFile(args: {
    filePath: string;
    analysisDepth?: 'basic' | 'medium' | 'deep';
  }) {
    const { filePath, analysisDepth = 'medium' } = args;

    const fileAnalyzer = new FileAnalyzer({
      includeTests: true,
      analysisDepth,
      languages: ['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json'],
      ignorePatterns: [],
      maxFileSize: 1024 * 1024
    });

    const analysis = await fileAnalyzer.analyzeFile(filePath);
    
    const summary = this.formatFileSummary(analysis);

    return {
      content: [
        {
          type: 'text',
          text: summary
        },
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2)
        }
      ]
    };
  }

  private async handleGetQuickStats(args: { projectPath: string }) {
    const { projectPath } = args;

    const stats = await this.projectAnalyzer.getQuickStats(projectPath);
    
    return {
      content: [
        {
          type: 'text',
          text: `📊 **Быстрая статистика проекта**\n\n` +
                `- 📁 Файлов: ${stats.fileCount.toLocaleString()}\n` +
                `- 🔤 Языки: ${stats.languages.join(', ')}\n` +
                `- 💾 Размер: ${(stats.estimatedSize / 1024 / 1024).toFixed(1)} MB\n\n` +
                `Для полного анализа используйте analyze_project.`
        }
      ]
    };
  }

  private async handleClearCache(args: { projectPath?: string }) {
    const { projectPath } = args;

    if (projectPath) {
      // Очищаем кеш для конкретного проекта
      const keysToDelete = Array.from(this.analysisCache.keys())
        .filter(key => key.startsWith(projectPath));
      
      keysToDelete.forEach(key => this.analysisCache.delete(key));
      
      return {
        content: [
          {
            type: 'text',
            text: `🗑️ Очищен кеш для проекта: ${projectPath}\nУдалено записей: ${keysToDelete.length}`
          }
        ]
      };
    } else {
      // Очищаем весь кеш
      const count = this.analysisCache.size;
      this.analysisCache.clear();
      
      return {
        content: [
          {
            type: 'text',
            text: `🗑️ Очищен весь кеш анализа\nУдалено записей: ${count}`
          }
        ]
      };
    }
  }

  private formatProjectSummary(analysis: any, duration: string): string {
    const { metrics, files, todos, architecturePatterns } = analysis;
    
    return `🎉 **Анализ проекта завершен!** ⏱️ ${duration}с\n\n` +
           `📊 **Основная статистика:**\n` +
           `- 📁 Файлов: ${metrics.totalFiles.toLocaleString()}\n` +
           `- 📝 Строк кода: ${metrics.totalLines.toLocaleString()}\n` +
           `- ⚙️ Функций: ${metrics.totalFunctions.toLocaleString()}\n` +
           `- 🔤 Языков: ${metrics.languages.join(', ')}\n` +
           `- 📊 Средняя сложность: ${metrics.avgComplexity}\n` +
           `- 🧪 Покрытие тестами: ${metrics.testCoverage}%\n\n` +
           `🏗️ **Архитектурные паттерны:**\n${architecturePatterns.map((p: string) => `- ${p}`).join('\n')}\n\n` +
           `⚠️ **TODO комментарии:** ${todos.length}\n` +
           `${todos.length > 0 ? `- FIXME: ${todos.filter((t: any) => t.type === 'FIXME').length}\n` +
                                `- TODO: ${todos.filter((t: any) => t.type === 'TODO').length}\n` +
                                `- HACK: ${todos.filter((t: any) => t.type === 'HACK').length}\n` : ''}` +
           `\n📈 **Готово для визуализации!**`;
  }

  private formatFileSummary(analysis: any): string {
    return `📄 **Анализ файла: ${analysis.name}**\n\n` +
           `- 📊 Тип: ${analysis.type}\n` +
           `- 💾 Размер: ${(analysis.size / 1024).toFixed(1)} KB\n` +
           `- 📝 Строк кода: ${analysis.linesOfCode || 0}\n` +
           `- ⚙️ Функций: ${analysis.functions.length}\n` +
           `- 📥 Импортов: ${analysis.imports.length}\n` +
           `- 📤 Экспортов: ${analysis.exports.length}\n` +
           `- ⚠️ TODO: ${analysis.todos?.length || 0}\n` +
           `- 🔄 Сложность: ${analysis.complexity || 0}`;
  }

  private setupErrorHandling() {
    this.server.onerror = (error: Error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      console.error('🛑 Получен сигнал SIGINT, завершаем работу...');
      await this.server.close();
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('🚀 MCP Code Analyzer Server v2.0 запущен и готов к работе!');
    console.error('✨ Новые возможности: кеширование, batch обработка, улучшенная производительность');
  }
}

// Запуск сервера
const server = new CodeAnalyzerServer();
server.run().catch(error => {
  console.error('💥 Критическая ошибка при запуске сервера:', error);
  process.exit(1);
});
