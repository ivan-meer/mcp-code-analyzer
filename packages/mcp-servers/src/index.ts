#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';

// MCP Analyzer Imports
import { TodoAnalyzer, TodoItem } from './analyzers/todo-analyzer';
import { ComplexityAnalyzer } from './analyzers/complexity-analyzer';
import { PatternDetector, DetectedPattern } from './analyzers/pattern-detector';
import { QualityScorer, QualityReport, QualityMetrics } from './analyzers/quality-scorer';

interface FileAnalysis {
  path: string;
  name: string;
  type: string;
  size: number;
  linesOfCode?: number;
  functions: string[];
  imports: string[];
  exports: string[];
}

interface ProjectAnalysis {
  projectPath: string;
  files: FileAnalysis[];
  dependencies: Array<{
    from: string;
    to: string;
    type: string;
  }>;
  metrics: {
    totalFiles: number;
    totalLines: number;
    totalFunctions: number;
    avgLinesPerFile: number;
    languages: string[];
  };
  architecturePatterns: string[];
}

class CodeAnalyzerServer {
  private server: Server;
  private todoAnalyzer: TodoAnalyzer;
  private complexityAnalyzer: ComplexityAnalyzer;
  private patternDetector: PatternDetector;
  private qualityScorer: QualityScorer;

  constructor() {
    this.server = new Server(
      {
        name: 'code-analyzer-server',
        version: '1.0.0',
      }
    );

    // Instantiate analyzers
    this.todoAnalyzer = new TodoAnalyzer();
    this.complexityAnalyzer = new ComplexityAnalyzer();
    this.patternDetector = new PatternDetector();
    this.qualityScorer = new QualityScorer();

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error: Error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze_project',
          description: 'Анализирует структуру проекта и создает карту файлов',
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
                description: 'Глубина анализа',
                default: 'medium'
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
              }
            },
            required: ['filePath']
          }
        },
        {
          name: 'detect_file_patterns',
          description: 'Detects design patterns in a single file.',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: { type: 'string', description: 'Path to the file for pattern detection' }
            },
            required: ['filePath']
          },
          // outputSchema: { type: 'application/json' } // Example if SDK supports it
        },
        {
          name: 'assess_file_quality',
          description: 'Assesses the quality of a single file based on various metrics.',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: { type: 'string', description: 'Path to the file for quality assessment' }
            },
            required: ['filePath']
          },
          // outputSchema: { type: 'application/json' } // Example if SDK supports it
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze_project':
            return await this.analyzeProject(args as any);
          
          case 'analyze_file':
            return await this.analyzeFile(args as any);
          
          case 'detect_file_patterns':
            return await this.detectFilePatterns(args as { filePath: string });

          case 'assess_file_quality':
            return await this.assessFileQuality(args as { filePath: string });

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
        throw new McpError(
          ErrorCode.InternalError,
          `Error in ${name}: ${error}`
        );
      }
    });
  }

  private async analyzeProject(args: {
    projectPath: string;
    includeTests?: boolean;
    analysisDepth?: 'basic' | 'medium' | 'deep';
  }) {
    const { projectPath, includeTests = true, analysisDepth = 'medium' } = args;

    // Проверяем существование папки
    try {
      await fs.access(projectPath);
    } catch {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Project path does not exist: ${projectPath}`
      );
    }

    // Паттерны файлов для анализа
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

    // Паттерны для исключения
    const ignorePatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/coverage/**'
    ];

    if (!includeTests) {
      ignorePatterns.push(
        '**/*.test.*',
        '**/*.spec.*',
        '**/test/**',
        '**/tests/**'
      );
    }

    const files: FileAnalysis[] = [];
    const dependencies: Array<{ from: string; to: string; type: string }> = [];

    // Сканируем файлы
    for (const pattern of patterns) {
      const foundFiles = await glob(pattern, {
        cwd: projectPath,
        ignore: ignorePatterns,
        absolute: true
      });

      for (const filePath of foundFiles) {
        try {
          const fileAnalysis = await this.analyzeFileInternal(filePath, analysisDepth);
          files.push(fileAnalysis);

          // Собираем зависимости
          for (const importPath of fileAnalysis.imports) {
            dependencies.push({
              from: filePath,
              to: importPath,
              type: 'import'
            });
          }
        } catch (error) {
          console.warn(`Ошибка анализа файла ${filePath}:`, error);
        }
      }
    }

    // Вычисляем метрики
    const totalLines = files.reduce((sum, file) => sum + (file.linesOfCode || 0), 0);
    const totalFunctions = files.reduce((sum, file) => sum + file.functions.length, 0);
    const languages = [...new Set(files.map(file => file.type))];

    // Определяем архитектурные паттерны
    const architecturePatterns = this.detectArchitecturePatterns(files);

    const analysis: ProjectAnalysis = {
      projectPath,
      files,
      dependencies,
      metrics: {
        totalFiles: files.length,
        totalLines,
        totalFunctions,
        avgLinesPerFile: files.length > 0 ? totalLines / files.length : 0,
        languages
      },
      architecturePatterns
    };

    return {
      content: [
        {
          type: 'text',
          text: `Анализ проекта завершен!\n\n📊 **Статистика:**\n- Файлов: ${analysis.metrics.totalFiles}\n- Строк кода: ${analysis.metrics.totalLines.toLocaleString()}\n- Функций: ${analysis.metrics.totalFunctions}\n- Языков: ${analysis.metrics.languages.join(', ')}\n\n🏗️ **Архитектурные паттерны:**\n${analysis.architecturePatterns.map(p => `- ${p}`).join('\n')}\n\n📈 Данные готовы для визуализации!`
        },
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2)
        }
      ]
    };
  }

  private async analyzeFile(args: { filePath: string }) {
    const { filePath } = args;

    try {
      const analysis = await this.analyzeFileInternal(filePath, 'deep');
      
      return {
        content: [
          {
            type: 'text',
            text: `📄 **Анализ файла: ${analysis.name}**\n\n- Тип: ${analysis.type}\n- Размер: ${(analysis.size / 1024).toFixed(1)} KB\n- Строк кода: ${analysis.linesOfCode}\n- Функций: ${analysis.functions.length}\n- Импортов: ${analysis.imports.length}\n- Экспортов: ${analysis.exports.length}`
          }
        ]
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Cannot analyze file: ${error}`
      );
    }
  }

  private async analyzeFileInternal(
    filePath: string,
    depth: 'basic' | 'medium' | 'deep' = 'medium'
  ): Promise<FileAnalysis> {
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    const fileExt = path.extname(filePath).slice(1).toLowerCase();
    
    let content = '';
    let linesOfCode = 0;
    let functions: string[] = [];
    let imports: string[] = [];
    let exports: string[] = [];

    // Читаем содержимое для текстовых файлов
    const textExtensions = ['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json'];
    
    if (textExtensions.includes(fileExt)) {
      try {
        content = await fs.readFile(filePath, 'utf-8');
        linesOfCode = content.split('\n').length;

        if (depth !== 'basic') {
          // Анализируем JavaScript/TypeScript файлы
          if (['js', 'ts', 'jsx', 'tsx'].includes(fileExt)) {
            functions = this.extractJSFunctions(content);
            imports = this.extractJSImports(content);
            exports = this.extractJSExports(content);
          }
          
          // Анализируем Python файлы
          else if (fileExt === 'py') {
            functions = this.extractPythonFunctions(content);
            imports = this.extractPythonImports(content);
          }
        }
      } catch (error) {
        console.warn(`Не удалось прочитать файл ${filePath}:`, error);
      }
    }

    return {
      path: filePath,
      name: fileName,
      type: fileExt || 'unknown',
      size: stats.size,
      linesOfCode,
      functions,
      imports,
      exports
    };
  }

  private extractJSFunctions(content: string): string[] {
    const functions: string[] = [];
    
    // Функции function declaration
    const functionDeclarations = content.match(/function\s+(\w+)/g);
    if (functionDeclarations) {
      functions.push(...functionDeclarations.map(f => f.replace('function ', '')));
    }
    
    // Arrow functions
    const arrowFunctions = content.match(/const\s+(\w+)\s*=.*?=>/g);
    if (arrowFunctions) {
      functions.push(...arrowFunctions.map(f => f.match(/const\s+(\w+)/)?.[1] || '').filter(Boolean));
    }

    return [...new Set(functions)];
  }

  private extractJSImports(content: string): string[] {
    const imports: string[] = [];
    
    // ES6 imports
    const es6Imports = content.match(/import.*?from\s+['"`]([^'"`]+)['"`]/g);
    if (es6Imports) {
      imports.push(...es6Imports.map(imp => imp.match(/from\s+['"`]([^'"`]+)['"`]/)?.[1] || '').filter(Boolean));
    }

    return [...new Set(imports)];
  }

  private extractJSExports(content: string): string[] {
    const exports: string[] = [];
    
    // Named exports
    const namedExports = content.match(/export\s+(?:const|let|var|function|class)\s+(\w+)/g);
    if (namedExports) {
      exports.push(...namedExports.map(exp => exp.match(/(?:const|let|var|function|class)\s+(\w+)/)?.[1] || '').filter(Boolean));
    }

    return [...new Set(exports)];
  }

  private extractPythonFunctions(content: string): string[] {
    const functions: string[] = [];
    
    const pythonFunctions = content.match(/def\s+(\w+)/g);
    if (pythonFunctions) {
      functions.push(...pythonFunctions.map(f => f.replace('def ', '')));
    }

    return [...new Set(functions)];
  }

  private extractPythonImports(content: string): string[] {
    const imports: string[] = [];
    
    // from X import Y
    const fromImports = content.match(/from\s+(\S+)\s+import/g);
    if (fromImports) {
      imports.push(...fromImports.map(imp => imp.match(/from\s+(\S+)\s+import/)?.[1] || '').filter(Boolean));
    }

    return [...new Set(imports)];
  }

  private detectArchitecturePatterns(files: FileAnalysis[]): string[] {
    const patterns: string[] = [];
    const paths = files.map(f => f.path.toLowerCase());
    
    // Component-based architecture
    if (paths.some(p => p.includes('component'))) {
      patterns.push('Component Architecture');
    }
    
    // Service layer
    if (paths.some(p => p.includes('service')) || paths.some(p => p.includes('api'))) {
      patterns.push('Service Layer');
    }
    
    // Test coverage
    if (paths.some(p => p.includes('test') || p.includes('spec'))) {
      patterns.push('Test Coverage');
    }

    return patterns;
  }

  private async detectFilePatterns(args: { filePath: string }): Promise<{ content: Array<{ type: string; text: string } | { type: 'application/json'; data: any }> }> {
    const { filePath } = args;
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const patterns = this.patternDetector.analyze(filePath, content);
      return {
        content: [
          { type: 'text', text: `Patterns detected in ${filePath}:` },
          { type: 'application/json', data: patterns }
        ]
      };
    } catch (error) {
      console.error(`Error detecting patterns in ${filePath}:`, error);
      if (error instanceof McpError) throw error;
      throw new McpError(ErrorCode.InternalError, `Failed to detect patterns in ${filePath}: ${error.message}`);
    }
  }

  private async assessFileQuality(args: { filePath: string }): Promise<{ content: Array<{ type: string; text: string } | { type: 'application/json'; data: any }> }> {
    const { filePath } = args;
    try {
      const code = await fs.readFile(filePath, 'utf-8');

      // Assuming analyzeFile for TodoItem[] structure might need adjustment if it's not returning TodoItem[]
      // For now, let's assume todoAnalyzer.analyzeFile exists and works as expected by QualityScorer
      // If todoAnalyzer.analyzeFile is the one from this class, it returns a different structure.
      // Let's assume a more direct todo analysis for now:
      const todos = this.todoAnalyzer.analyzeFile(filePath, code); // Corrected to use analyzeFile
      const cyclomaticComplexity = this.complexityAnalyzer.calculateCyclomaticComplexity(code);

      const lines = code.split('\n');
      const commentLines = lines.filter(line => line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*') || line.trim().startsWith('*/') || line.trim().startsWith('#')).length;
      const commentRatio = lines.length > 0 ? commentLines / lines.length : 0;

      const metrics: QualityMetrics = {
        cyclomaticComplexity,
        todoCount: todos.length, // todos here is expected to be TodoItem[]
        commentRatio
      };

      const report = this.qualityScorer.assess(filePath, code, metrics);

      return {
        content: [
          { type: 'text', text: `Quality assessment for ${filePath}:` },
          { type: 'application/json', data: report }
        ]
      };
    } catch (error) {
      console.error(`Error assessing quality for ${filePath}:`, error);
      if (error instanceof McpError) throw error;
      throw new McpError(ErrorCode.InternalError, `Failed to assess quality for ${filePath}: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('🚀 MCP Code Analyzer Server запущен!');
  }
}

const server = new CodeAnalyzerServer();
server.run().catch(console.error);
