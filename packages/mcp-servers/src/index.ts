#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { TodoAnalyzer, TodoItem } from './analyzers/todo-analyzer';
import { ComplexityAnalyzer } from './analyzers/complexity-analyzer';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';
import http from 'node:http'; // Added for SSE
import { URL } from 'node:url'; // Added for SSE

// MCP Analyzer Imports
// import { TodoAnalyzer, TodoItem } from './analyzers/todo-analyzer'; // TodoItem seems unused here, commented for now
import { TodoAnalyzer } from './analyzers/todo-analyzer';
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
  todos?: TodoItem[];
  cyclomaticComplexity?: number;
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

// Structure for SSE progress events
interface ProgressEvent {
  projectId: string;
  stage: 'initializing' | 'scanning' | 'parsing' | 'ai-processing' | 'generating-insights' | 'completed' | 'error';
  percentage: number;
  currentFile?: string;
  filesProcessed?: number;
  totalFiles?: number;
  logMessage?: string;
}

class CodeAnalyzerServer {
  private server: Server;

  private sseHttpServer: http.Server; // For SSE
  private activeSseClients: Map<string, http.ServerResponse>; // projectId -> response
  private todoAnalyzer: TodoAnalyzer;
  private complexityAnalyzer: ComplexityAnalyzer;
  private patternDetector: PatternDetector;
  private qualityScorer: QualityScorer;

  constructor(private ssePort = 8001) { // Added ssePort, default 8001 to avoid conflict with main :8000
 main
    this.server = new Server(
      {
        name: 'code-analyzer-server',
        version: '1.0.0',
      }
    );
    this.activeSseClients = new Map();

    // Instantiate analyzers
    this.todoAnalyzer = new TodoAnalyzer();
    this.complexityAnalyzer = new ComplexityAnalyzer();
    this.patternDetector = new PatternDetector();
    this.qualityScorer = new QualityScorer();

    this.todoAnalyzer = new TodoAnalyzer();
    this.complexityAnalyzer = new ComplexityAnalyzer();
    this.setupToolHandlers();
    this.setupSseServer();
    
    // Error handling
    this.server.onerror = (error: Error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      this.sseHttpServer.close(() => {
        console.log('SSE HTTP server closed');
      });
      process.exit(0);
    });
  }

  private setupSseServer() {
    this.sseHttpServer = http.createServer((req, res) => {
      // Basic routing for SSE endpoint
      if (req.url && req.method === 'GET') {
        const reqUrl = new URL(req.url, `http://${req.headers.host}`);
        if (reqUrl.pathname.startsWith('/api/analyze/progress/')) {
          this.handleSseConnection(req, res, reqUrl);
          return;
        }
      }
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Not Found' }));
    });

    this.sseHttpServer.listen(this.ssePort, () => {
      console.log(`🚀 SSE server listening on http://localhost:${this.ssePort}/api/analyze/progress/:projectId`);
    });
  }

  private handleSseConnection(req: http.IncomingMessage, res: http.ServerResponse, url: URL) {
    const parts = url.pathname.split('/');
    const projectId = parts[parts.length - 1];

    if (!projectId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Missing projectId' }));
      return;
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*', // Allow CORS for simplicity, adjust as needed
    });

    // Store the client
    this.activeSseClients.set(projectId, res);
    console.log(`SSE client connected for projectId: ${projectId}`);

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ projectId, stage: 'initializing', percentage: 0, logMessage: 'SSE connection established.' })}\n\n`);

    // Handle client disconnection
    req.on('close', () => {
      this.activeSseClients.delete(projectId);
      console.log(`SSE client disconnected for projectId: ${projectId}`);
    });
  }

  // Helper to send progress updates
  private sendProgress(projectId: string, progressData: Omit<ProgressEvent, 'projectId'>) {
    const client = this.activeSseClients.get(projectId);
    if (client) {
      const event: ProgressEvent = { projectId, ...progressData };
      client.write(`data: ${JSON.stringify(event)}\n\n`);
    } else {
      console.warn(`No active SSE client for projectId: ${projectId}. Progress not sent.`);
    }
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
              projectId: { // New property for SSE
                type: 'string',
                description: 'Unique ID for tracking analysis progress via SSE'
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
            required: ['projectPath', 'projectId'] // projectId is now required
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
    projectId: string; // Added projectId
    includeTests?: boolean;
    analysisDepth?: 'basic' | 'medium' | 'deep';
  }) {
    const { projectPath, projectId, includeTests = true, analysisDepth = 'medium' } = args;

    // Wrap the entire analysis process to catch errors and send SSE updates
    try {
      this.sendProgress(projectId, { stage: 'initializing', percentage: 0, logMessage: `Starting analysis for project: ${projectPath}` });

      try {
        await fs.access(projectPath);
      } catch (e) {
        this.sendProgress(projectId, { stage: 'error', percentage: 0, logMessage: `Project path does not exist: ${projectPath}. Error: ${e.message}` });
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Project path does not exist: ${projectPath}`
        );
      }

      this.sendProgress(projectId, { stage: 'initializing', percentage: 1, logMessage: `Project path validated: ${projectPath}` });

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
    let allFoundFiles: string[] = [];

    // Initial scan to get total files for progress calculation
    this.sendProgress(projectId, { stage: 'scanning', percentage: 2, logMessage: 'Scanning for files...' });
    try {
      for (const pattern of patterns) {
        const found = await glob(pattern, {
          cwd: projectPath,
          ignore: ignorePatterns,
          absolute: true,
          nodir: true, // Ensure only files are matched
        });
        allFoundFiles.push(...found);
      }
      allFoundFiles = [...new Set(allFoundFiles)]; // Remove duplicates if any
    } catch (e) {
      this.sendProgress(projectId, { stage: 'error', percentage: 2, logMessage: `Error during file globbing: ${e.message}` });
      throw new McpError(ErrorCode.InternalError, `Error scanning files: ${e.message}`);
    }

    const totalFiles = allFoundFiles.length;

    // Handle "No files found" scenario
    if (totalFiles === 0) {
      const noFilesLogMessage = "No analyzable files found at the specified path. Please check the path, file extensions, or include/exclude patterns.";
      this.sendProgress(projectId, {
        stage: 'error',
        percentage: 5, // Consistent with scanning phase completion percentage
        currentFile: '',
        filesProcessed: 0,
        totalFiles: 0,
        logMessage: noFilesLogMessage
      });
      // Return a specific MCP response for this case
      return {
        content: [
          {
            type: 'text',
            text: `Analysis couldn't proceed: ${noFilesLogMessage}`
          },
          {
            type: 'application/json', // Using application/json for structured data
            data: { // Actual data for the JSON content part
              message: noFilesLogMessage,
              projectPath: projectPath,
              files: [],
              dependencies: [],
              metrics: {
                totalFiles: 0,
                totalLines: 0,
                totalFunctions: 0,
                avgLinesPerFile: 0,
                languages: []
              },
              architecturePatterns: []
            }
          }
        ]
      };
    }

    // If files are found, proceed with sending scanning complete and then parsing
    this.sendProgress(projectId, { stage: 'scanning', percentage: 5, totalFiles, filesProcessed: 0, logMessage: `Found ${totalFiles} files to analyze.` });

    let filesProcessed = 0;

    // Анализируем файлы
    // Ensure this loop does not run if totalFiles is 0 (already handled by the check above)
    for (const filePath of allFoundFiles) {
      // Calculate percentage: ensure totalFiles is not zero to prevent division by zero,
      // though the `if (totalFiles === 0)` check above should prevent this loop from running.
      const currentPercentage = totalFiles > 0 ? 5 + Math.round((filesProcessed / totalFiles) * 90) : 5;
      this.sendProgress(projectId, {
        stage: 'parsing',
        percentage: currentPercentage,
        currentFile: filePath,
        filesProcessed,
        totalFiles,
        logMessage: `Analyzing file: ${path.basename(filePath)}`
      });

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
        console.warn(`Error analyzing file ${filePath}:`, error);
        // Optionally send a per-file error event
        this.sendProgress(projectId, {
          stage: 'parsing', // or a specific 'file_error' stage
          percentage: currentPercentage,
          currentFile: filePath,
          filesProcessed, // filesProcessed is not incremented for this failed file
          totalFiles,
          logMessage: `Error analyzing ${path.basename(filePath)}: ${error.message}`
        });
      }
      filesProcessed++;
    }

    this.sendProgress(projectId, { stage: 'generating-insights', percentage: 95, filesProcessed, totalFiles, logMessage: 'Generating final project insights...' });

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

    this.sendProgress(projectId, { stage: 'completed', percentage: 100, filesProcessed, totalFiles, logMessage: 'Project analysis complete.' });

    // The original MCP response remains the same, progress is out-of-band via SSE
    return {
      content: [
        {
          type: 'text',
          text: `Анализ проекта завершен!\n\n📊 **Статистика:**\n- Файлов: ${analysis.metrics.totalFiles}\n- Строк кода: ${analysis.metrics.totalLines.toLocaleString()}\n- Функций: ${analysis.metrics.totalFunctions}\n- Языков: ${analysis.metrics.languages.join(', ')}\n\n🏗️ **Архитектурные паттерны:**\n${analysis.architecturePatterns.map(p => `- ${p}`).join('\n')}\n\n📈 Данные готовы для визуализации! Project ID for progress: ${projectId}`
        },
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2)
        }
      ]
    };
  } catch (error) {
    // Ensure a final SSE error message is sent for any unhandled errors during analysis
    // Determine percentage based on where it might have failed; can be approximate
    const errorPercentage = error.stage && error.percentage ? error.percentage : ( (error.filesProcessed && error.totalFiles) ? Math.round((error.filesProcessed / error.totalFiles) * 100) : 50); // Generic fallback
    this.sendProgress(projectId, {
      stage: 'error',
      percentage: errorPercentage,
      logMessage: `Analysis failed: ${error.message}`,
      ...(error.filesProcessed && { filesProcessed: error.filesProcessed }),
      ...(error.totalFiles && { totalFiles: error.totalFiles }),
    });
    // Re-throw the error so MCP framework can handle it as well
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, `Error in analyzeProject: ${error.message}`);
  }
}

  private async analyzeFile(args: { filePath: string }) {
    const { filePath } = args;

    try {
      const analysis = await this.analyzeFileInternal(filePath, 'deep');
      
      // Prepare details from the new analyzers
      const todosCount = analysis.todos?.length || 0;
      const todosSummary = todosCount > 0
        ? ` (${todosCount} TODOs/Issues found)`
        : '';
      const complexityScore = analysis.cyclomaticComplexity !== undefined
        ? `
- Cyclomatic Complexity: ${analysis.cyclomaticComplexity}`
        : '';

      return {
        content: [
          {
            type: 'text',
            text: `📄 **Анализ файла: ${analysis.name}**

- Тип: ${analysis.type}
- Размер: ${(analysis.size / 1024).toFixed(1)} KB
- Строк кода: ${analysis.linesOfCode}${complexityScore}
- Функций: ${analysis.functions.length}
- Импортов: ${analysis.imports.length}
- Экспортов: ${analysis.exports.length}${todosSummary}`
          },
          { // Optionally, include the full analysis object as JSON for detailed view
            type: 'application/json', // Or 'text' if it should be displayed as stringified JSON
            text: JSON.stringify(analysis, null, 2)
          }
        ]
      };
    } catch (error) {
      // Ensure error is an instance of Error before accessing message
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Cannot analyze file: ${errorMessage}`
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
    let todos: TodoItem[] = []; // Added
    let cyclomaticComplexity: number = 0; // Added

    const textExtensions = ['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json'];
    
    if (textExtensions.includes(fileExt)) {
      try {
        content = await fs.readFile(filePath, 'utf-8');
        linesOfCode = content.split('\n').length;

        if (depth !== 'basic') {
          // Analyze JavaScript/TypeScript files
          if (['js', 'ts', 'jsx', 'tsx'].includes(fileExt)) {
            functions = this.extractJSFunctions(content);
            imports = this.extractJSImports(content);
            exports = this.extractJSExports(content);
          }
          // Analyze Python files
          else if (fileExt === 'py') {
            functions = this.extractPythonFunctions(content);
            imports = this.extractPythonImports(content);
            // Python exports are more complex (not simple keywords usually)
            // For now, exports are primarily for JS/TS like modules
          }

          // Use new analyzers for all relevant text files if depth allows
          todos = this.todoAnalyzer.analyzeFile(filePath, content);
          cyclomaticComplexity = this.complexityAnalyzer.calculateCyclomaticComplexity(content);
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
      exports,
      todos, // Added
      cyclomaticComplexity // Added
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
    
    console.error('🚀 MCP Code Analyzer Server запущен!'); // This is for the StdioServerTransport
    // The SSE server logs its own startup message.
  }
}

// Potentially grab port from environment variable or args if needed
const ssePort = process.env.SSE_PORT ? parseInt(process.env.SSE_PORT, 10) : 8001;
const server = new CodeAnalyzerServer(ssePort);
server.run().catch(console.error);
