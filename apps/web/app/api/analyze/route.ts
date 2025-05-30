import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface AnalysisRequest {
  path: string;
  include_tests?: boolean;
  analysis_depth?: string;
}

interface FileInfo {
  path: string;
  name: string;
  type: string;
  size: number;
  lines_of_code?: number;
  functions: string[];
  imports: string[];
}

interface ProjectAnalysisResult {
  project_path: string;
  files: FileInfo[];
  dependencies: Array<{
    from: string;
    to: string;
    type: string;
  }>;
  metrics: {
    total_files: number;
    total_lines: number;
    total_functions: number;
    avg_lines_per_file: number;
    languages: string[];
  };
  architecture_patterns: string[];
}

class CodeAnalyzer {
  static async analyzeFile(filePath: string): Promise<FileInfo> {
    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(filePath).slice(1);
      
      const fileInfo: FileInfo = {
        path: filePath,
        name: fileName,
        type: fileExtension || 'unknown',
        size: stats.size,
        lines_of_code: 0,
        functions: [],
        imports: []
      };

      // Анализируем только текстовые файлы программирования
      if (['.js', '.ts', '.tsx', '.jsx', '.py', '.css', '.html'].includes(path.extname(filePath))) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          fileInfo.lines_of_code = content.split('\n').length;

          // Анализ функций и импортов для JS/TS
          if (['.js', '.ts', '.tsx', '.jsx'].includes(path.extname(filePath))) {
            // Поиск функций
            const functionMatches = content.match(/(?:function\s+(\w+)|const\s+(\w+)\s*=.*?=>|(\w+)\s*:\s*\([^)]*\)\s*=>)/g);
            if (functionMatches) {
              fileInfo.functions = functionMatches
                .map(match => {
                  const nameMatch = match.match(/(?:function\s+(\w+)|const\s+(\w+)|(\w+)\s*:)/);
                  return nameMatch ? nameMatch[1] || nameMatch[2] || nameMatch[3] : null;
                })
                .filter(Boolean) as string[];
            }

            // Поиск импортов
            const importMatches = content.match(/import.*?from\s+['"`]([^'"`]+)['"`]/g);
            if (importMatches) {
              fileInfo.imports = importMatches
                .map(match => {
                  const pathMatch = match.match(/from\s+['"`]([^'"`]+)['"`]/);
                  return pathMatch ? pathMatch[1] : null;
                })
                .filter(Boolean) as string[];
            }
          }

          // Анализ для Python
          if (path.extname(filePath) === '.py') {
            const functionMatches = content.match(/def\s+(\w+)/g);
            if (functionMatches) {
              fileInfo.functions = functionMatches.map(match => match.replace('def ', ''));
            }

            const importMatches = content.match(/(?:from\s+(\S+)\s+import|import\s+(\S+))/g);
            if (importMatches) {
              fileInfo.imports = importMatches
                .map(match => {
                  const pathMatch = match.match(/(?:from\s+(\S+)|import\s+(\S+))/);
                  return pathMatch ? pathMatch[1] || pathMatch[2] : null;
                })
                .filter(Boolean) as string[];
            }
          }
        } catch (error) {
          console.warn(`Не удалось прочитать файл ${filePath}:`, error);
        }
      }

      return fileInfo;
    } catch (error) {
      throw new Error(`Ошибка анализа файла ${filePath}: ${error}`);
    }
  }

  static async analyzeProject(projectPath: string): Promise<ProjectAnalysisResult> {
    try {
      // Проверяем существование пути
      await fs.access(projectPath);
      
      const files: FileInfo[] = [];
      const dependencies: Array<{ from: string; to: string; type: string }> = [];

      // Рекурсивно сканируем файлы
      const scanDirectory = async (dir: string) => {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            // Пропускаем служебные папки
            if (entry.isDirectory()) {
              if (!['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '.venv'].includes(entry.name)) {
                await scanDirectory(fullPath);
              }
            } else if (entry.isFile()) {
              // Анализируем только файлы кода
              const ext = path.extname(entry.name);
              if (['.js', '.ts', '.tsx', '.jsx', '.py', '.css', '.html', '.json', '.md'].includes(ext)) {
                try {
                  const fileInfo = await this.analyzeFile(fullPath);
                  files.push(fileInfo);
                } catch (error) {
                  console.warn(`Пропускаем файл ${fullPath}:`, error);
                }
              }
            }
          }
        } catch (error) {
          console.warn(`Не удалось сканировать директорию ${dir}:`, error);
        }
      };

      await scanDirectory(projectPath);

      // Строим граф зависимостей
      for (const file of files) {
        for (const importPath of file.imports) {
          dependencies.push({
            from: path.relative(projectPath, file.path),
            to: importPath,
            type: 'import'
          });
        }
      }

      // Вычисляем метрики
      const totalLines = files.reduce((sum, file) => sum + (file.lines_of_code || 0), 0);
      const totalFunctions = files.reduce((sum, file) => sum + file.functions.length, 0);
      const languages = [...new Set(files.map(f => f.type).filter(type => type !== 'unknown'))];

      // Определяем архитектурные паттерны
      const patterns: string[] = [];
      const pathStrings = files.map(f => f.path.toLowerCase());
      
      if (pathStrings.some(p => p.includes('component'))) {
        patterns.push('Component Architecture');
      }
      if (pathStrings.some(p => p.includes('service') || p.includes('api'))) {
        patterns.push('Service Layer');
      }
      if (pathStrings.some(p => p.includes('test') || p.includes('spec'))) {
        patterns.push('Test Coverage');
      }
      if (files.some(f => f.name === 'package.json')) {
        patterns.push('NPM Package');
      }
      if (files.some(f => f.name === 'next.config.js')) {
        patterns.push('Next.js Application');
      }
      if (files.some(f => f.name === 'tailwind.config.ts')) {
        patterns.push('Tailwind CSS');
      }

      const metrics = {
        total_files: files.length,
        total_lines: totalLines,
        total_functions: totalFunctions,
        avg_lines_per_file: files.length > 0 ? totalLines / files.length : 0,
        languages
      };

      return {
        project_path: projectPath,
        files,
        dependencies,
        metrics,
        architecture_patterns: patterns
      };
      
    } catch (error) {
      throw new Error(`Ошибка анализа проекта: ${error}`);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    
    if (!body.path) {
      return NextResponse.json(
        { error: 'Путь к проекту обязателен' },
        { status: 400 }
      );
    }

    console.log('Начинаем анализ проекта:', body.path);
    const result = await CodeAnalyzer.analyzeProject(body.path);
    console.log('Анализ завершен. Найдено файлов:', result.files.length);

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Ошибка анализа:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Неизвестная ошибка анализа',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "API анализа кода готов к работе",
    endpoints: {
      analyze: "POST /api/analyze"
    }
  });
}
