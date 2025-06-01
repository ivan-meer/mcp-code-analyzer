/**
 * Базовый класс для анализа файлов
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { FileAnalysis, TodoComment, AnalysisConfig } from '../types/analysis.types.js';

export class FileAnalyzer {
  private static readonly TEXT_EXTENSIONS = new Set([
    'js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json', 'md', 'txt'
  ]);

  private static readonly TODO_PATTERNS = [
    /\/\/\s*(TODO|FIXME|HACK|NOTE)[\s:]*(.+)/gi,
    /#\s*(TODO|FIXME|HACK|NOTE)[\s:]*(.+)/gi,
    /\/\*\s*(TODO|FIXME|HACK|NOTE)[\s:]*(.+?)\*\//gi
  ];

  constructor(private config: AnalysisConfig) {}

  async analyzeFile(filePath: string): Promise<FileAnalysis> {
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    const fileExt = path.extname(filePath).slice(1).toLowerCase();
    
    const analysis: FileAnalysis = {
      path: filePath,
      name: fileName,
      type: fileExt || 'unknown',
      size: stats.size,
      linesOfCode: 0,
      functions: [],
      imports: [],
      exports: [],
      todos: [],
      complexity: 0
    };

    // Анализируем только текстовые файлы разумного размера
    if (!this.shouldAnalyzeFile(fileExt, stats.size)) {
      return analysis;
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      analysis.linesOfCode = this.countLines(content);

      if (this.config.analysisDepth !== 'basic') {
        analysis.functions = this.extractFunctions(content, fileExt);
        analysis.imports = this.extractImports(content, fileExt);
        analysis.exports = this.extractExports(content, fileExt);
        analysis.todos = this.extractTodos(content);
      }

      if (this.config.analysisDepth === 'deep') {
        analysis.complexity = this.calculateComplexity(content, fileExt);
      }
    } catch (error) {
      console.warn(`Ошибка анализа файла ${filePath}:`, error);
    }

    return analysis;
  }

  private shouldAnalyzeFile(extension: string, size: number): boolean {
    return FileAnalyzer.TEXT_EXTENSIONS.has(extension) && 
           size <= this.config.maxFileSize;
  }

  private countLines(content: string): number {
    return content.split('\n').filter(line => line.trim()).length;
  }

  private extractTodos(content: string): TodoComment[] {
    const todos: TodoComment[] = [];
    const lines = content.split('\n');

    FileAnalyzer.TODO_PATTERNS.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        todos.push({
          type: match[1].toUpperCase() as TodoComment['type'],
          content: match[2].trim(),
          line: lineNumber
        });
      }
    });

    return todos;
  }

  private extractFunctions(content: string, fileType: string): string[] {
    switch (fileType) {
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return this.extractJSFunctions(content);
      case 'py':
        return this.extractPythonFunctions(content);
      default:
        return [];
    }
  }

  private extractJSFunctions(content: string): string[] {
    const functions: string[] = [];
    
    // Function declarations
    const functionDeclarations = content.match(/function\s+(\w+)/g);
    if (functionDeclarations) {
      functions.push(...functionDeclarations.map(f => f.replace('function ', '')));
    }
    
    // Arrow functions
    const arrowFunctions = content.match(/(?:const|let|var)\s+(\w+)\s*=.*?=>/g);
    if (arrowFunctions) {
      functions.push(...arrowFunctions
        .map(f => f.match(/(?:const|let|var)\s+(\w+)/)?.[1] || '')
        .filter(Boolean)
      );
    }

    // Class methods
    const classMethods = content.match(/^\s*(\w+)\s*\(/gm);
    if (classMethods) {
      functions.push(...classMethods
        .map(m => m.match(/(\w+)/)?.[1] || '')
        .filter(Boolean)
      );
    }

    return [...new Set(functions)];
  }

  private extractPythonFunctions(content: string): string[] {
    const functions: string[] = [];
    
    const pythonFunctions = content.match(/def\s+(\w+)/g);
    if (pythonFunctions) {
      functions.push(...pythonFunctions.map(f => f.replace('def ', '')));
    }

    return [...new Set(functions)];
  }

  private extractImports(content: string, fileType: string): string[] {
    switch (fileType) {
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return this.extractJSImports(content);
      case 'py':
        return this.extractPythonImports(content);
      default:
        return [];
    }
  }

  private extractJSImports(content: string): string[] {
    const imports: string[] = [];
    
    // ES6 imports
    const es6Imports = content.match(/import.*?from\s+['"`]([^'"`]+)['"`]/g);
    if (es6Imports) {
      imports.push(...es6Imports
        .map(imp => imp.match(/from\s+['"`]([^'"`]+)['"`]/)?.[1] || '')
        .filter(Boolean)
      );
    }

    // Require statements
    const requireImports = content.match(/require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g);
    if (requireImports) {
      imports.push(...requireImports
        .map(req => req.match(/['"`]([^'"`]+)['"`]/)?.[1] || '')
        .filter(Boolean)
      );
    }

    return [...new Set(imports)];
  }

  private extractPythonImports(content: string): string[] {
    const imports: string[] = [];
    
    // from X import Y
    const fromImports = content.match(/from\s+(\S+)\s+import/g);
    if (fromImports) {
      imports.push(...fromImports
        .map(imp => imp.match(/from\s+(\S+)\s+import/)?.[1] || '')
        .filter(Boolean)
      );
    }

    // import X
    const directImports = content.match(/^import\s+(\S+)/gm);
    if (directImports) {
      imports.push(...directImports
        .map(imp => imp.match(/import\s+(\S+)/)?.[1] || '')
        .filter(Boolean)
      );
    }

    return [...new Set(imports)];
  }

  private extractExports(content: string, fileType: string): string[] {
    if (!['js', 'ts', 'jsx', 'tsx'].includes(fileType)) {
      return [];
    }

    const exports: string[] = [];
    
    // Named exports
    const namedExports = content.match(/export\s+(?:const|let|var|function|class)\s+(\w+)/g);
    if (namedExports) {
      exports.push(...namedExports
        .map(exp => exp.match(/(?:const|let|var|function|class)\s+(\w+)/)?.[1] || '')
        .filter(Boolean)
      );
    }

    // Export { ... }
    const exportBlocks = content.match(/export\s*\{\s*([^}]+)\s*\}/g);
    if (exportBlocks) {
      exportBlocks.forEach(block => {
        const items = block.match(/export\s*\{\s*([^}]+)\s*\}/)?.[1];
        if (items) {
          const exportedItems = items.split(',')
            .map(item => item.trim().split(' as ')[0].trim())
            .filter(Boolean);
          exports.push(...exportedItems);
        }
      });
    }

    return [...new Set(exports)];
  }

  private calculateComplexity(content: string, fileType: string): number {
    if (!['js', 'ts', 'jsx', 'tsx', 'py'].includes(fileType)) {
      return 0;
    }

    let complexity = 1; // Base complexity

    // Control flow statements
    const controlFlowPatterns = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bswitch\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\btry\s*\{/g,
      /\?\s*.*?\s*:/g, // Ternary operators
    ];

    controlFlowPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    // Logical operators
    const logicalOperators = content.match(/\&\&|\|\|/g);
    if (logicalOperators) {
      complexity += logicalOperators.length;
    }

    return complexity;
  }
}
