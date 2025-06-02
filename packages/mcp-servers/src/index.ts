import { Server, StdioServerTransport, Transport } from '@modelcontextprotocol/sdk';
import type {
  AnalysisConfig,
  FileAnalysis,
  ProjectAnalysis,
  TodoComment
} from './types/analysis.types.js';
import {
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { ProjectAnalyzer } from './analyzers/ProjectAnalyzer.js';
import { FileAnalyzer } from './analyzers/FileAnalyzer.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';

export class CodeAnalyzerServer {
  private server: Server;
  private projectAnalyzer: ProjectAnalyzer;
  private fileAnalyzer: FileAnalyzer;
  private analysisCache = new Map<string, any>();

  constructor() {
    this.server = new Server({
      name: 'code-analyzer-server',
      version: '2.1.0',
    });

    const config: AnalysisConfig = {
      includeTests: false,
      analysisDepth: 'medium',
      languages: ['typescript', 'javascript'],
      ignorePatterns: ['node_modules'],
      maxFileSize: 1024 * 1024
    };
    this.projectAnalyzer = new ProjectAnalyzer(config);
    this.fileAnalyzer = new FileAnalyzer(config);

    this.registerTools();
    this.setupErrorHandling();
  }

  private registerTools() {
    this.server.registerTool({
      name: 'analyze-project',
      description: 'Analyze code project structure and metrics',
      parameters: {
        projectPath: { type: 'string', description: 'Path to project root' },
        includeTests: { type: 'boolean', description: 'Include test files', default: false },
      },
      handler: this.analyzeProject.bind(this),
    });

    this.server.registerTool({
      name: 'analyze-file',
      description: 'Analyze single file',
      parameters: {
        filePath: { type: 'string', description: 'Path to file' },
        depth: { type: 'string', enum: ['basic', 'medium', 'deep'], default: 'medium' },
      },
      handler: this.analyzeFile.bind(this),
    });

    this.server.registerTool({
      name: 'clear-cache',
      description: 'Clear analysis cache',
      parameters: {
        projectId: { type: 'string', description: 'Project ID to clear', optional: true },
      },
      handler: this.clearCache.bind(this),
    });
  }

  private async analyzeProject(args: {
    projectPath: string;
    includeTests?: boolean;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { projectPath, includeTests = false } = args;
    const projectId = path.basename(projectPath);

    try {
      const cached = this.analysisCache.get(projectId);
      if (cached) {
        return {
          content: [
            {
              type: 'text',
              text: 'Using cached analysis results',
            },
            {
              type: 'application/json',
              text: 'Cached analysis data',
              data: cached,
            },
          ],
        };
      }

      const startTime = Date.now();
      const analysis = await this.projectAnalyzer.analyze(projectPath, { includeTests });
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      this.analysisCache.set(projectId, analysis);

      return {
        content: [
          {
            type: 'text',
            text: this.formatProjectSummary(analysis, duration),
          },
          {
            type: 'application/json',
            text: 'Project analysis data',
            data: analysis as unknown,
          },
        ],
      };
    } catch (error) {
      console.error('Project analysis error:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `Project analysis failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async analyzeFile(args: {
    filePath: string;
    depth?: 'basic' | 'medium' | 'deep';
  }): Promise<{ content: Array<{ type: string; text: string; data?: unknown }> }> {
    const { filePath, depth = 'medium' } = args;

    try {
      const analysis = await this.fileAnalyzer.analyze(filePath, depth);
      return {
        content: [
          {
            type: 'text',
            text: this.formatFileSummary(analysis),
          },
          {
            type: 'application/json',
            text: 'File analysis data',
            data: analysis,
          },
        ],
      };
    } catch (error) {
      console.error('File analysis error:', error);
      throw new McpError(
        ErrorCode.InternalError,
        `File analysis failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async clearCache(args: { projectId?: string }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { projectId } = args;

    if (projectId) {
      const deleted = this.analysisCache.delete(projectId);
      return {
        content: [
          {
            type: 'text',
            text: deleted
              ? `🗑️ Кеш анализа для проекта ${projectId} очищен`
              : `⚠️ Проект ${projectId} не найден в кеше`,
          },
        ],
      };
    } else {
      const count = this.analysisCache.size;
      this.analysisCache.clear();
      return {
        content: [
          {
            type: 'text',
            text: `🗑️ Очищен весь кеш анализа\nУдалено записей: ${count}`,
          },
        ],
      };
    }
  }

  private formatProjectSummary(analysis: ProjectAnalysis, duration: string): string {
    const { metrics, architecturePatterns } = analysis;

    return `🎉 **Анализ проекта завершен!** ⏱️ ${duration}с\n\n` +
           `📊 **Основная статистика:**\n` +
           `- 📁 Файлов: ${metrics.totalFiles.toLocaleString()}\n` +
           `- 📝 Строк кода: ${metrics.totalLines.toLocaleString()}\n` +
           `- ⚙️ Функций: ${metrics.totalFunctions.toLocaleString()}\n` +
           `- 🔤 Языков: ${metrics.languages.join(', ')}\n` +
           `- 📊 Средняя сложность: ${metrics.avgComplexity}\n` +
           `- 🧪 Покрытие тестами: ${metrics.testCoverage}%\n\n` +
           `🏗️ **Архитектурные паттерны:**\n${architecturePatterns.map(p => `- ${p}`).join('\n')}`;
  }

  private formatFileSummary(analysis: FileAnalysis): string {
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
    const transport = new StdioServerTransport() as unknown as Transport;
    await this.server.connect(transport);
  }
}

// Server entry point
if (require.main === module) {
  const server = new CodeAnalyzerServer();
  server.run().catch(err => {
    console.error('Server failed to start:', err);
    process.exit(1);
  });
}
