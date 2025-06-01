/**
 * Интерфейсы для анализа кода
 */

export interface FileAnalysis {
  path: string;
  name: string;
  type: string;
  size: number;
  linesOfCode?: number;
  functions: string[];
  imports: string[];
  exports: string[];
  todos?: TodoComment[];
  complexity?: number;
}

export interface TodoComment {
  type: 'TODO' | 'FIXME' | 'HACK' | 'NOTE';
  content: string;
  line: number;
  author?: string;
}

export interface ProjectAnalysis {
  projectPath: string;
  files: FileAnalysis[];
  dependencies: Array<{
    from: string;
    to: string;
    type: string;
  }>;
  metrics: ProjectMetrics;
  architecturePatterns: string[];
  todos: TodoComment[];
}

export interface ProjectMetrics {
  totalFiles: number;
  totalLines: number;
  totalFunctions: number;
  avgLinesPerFile: number;
  avgComplexity: number;
  languages: string[];
  testCoverage?: number;
}

export interface AnalysisConfig {
  includeTests: boolean;
  analysisDepth: 'basic' | 'medium' | 'deep';
  languages: string[];
  ignorePatterns: string[];
  maxFileSize: number;
}
