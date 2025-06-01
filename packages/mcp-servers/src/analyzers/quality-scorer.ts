import { TodoItem } from './todo-analyzer'; // Assuming todo-analyzer.ts is in the same directory

export interface QualityMetrics {
  cyclomaticComplexity: number;
  todoCount: number;
  commentRatio?: number; // Optional: lines of comments / total lines
  // Other metrics can be added here
}

export interface QualityReport {
  overallScore: number; // A score from 0 to 100
  remarks: string[]; // e.g., "High complexity", "Many TODOs"
  metrics: QualityMetrics;
}

export class QualityScorer {
  assess(filePath: string, code: string, metrics: QualityMetrics): QualityReport {
    console.log(`Assessing quality for ${filePath}...`);
    let score = 100;
    const remarks: string[] = [];

    // Placeholder scoring logic:
    if (metrics.cyclomaticComplexity > 20) {
      score -= 25;
      remarks.push(`High cyclomatic complexity (${metrics.cyclomaticComplexity}). Consider refactoring.`);
    } else if (metrics.cyclomaticComplexity > 10) {
      score -= 10;
      remarks.push(`Moderate cyclomatic complexity (${metrics.cyclomaticComplexity}).`);
    }

    if (metrics.todoCount > 5) {
      score -= (metrics.todoCount * 2);
      remarks.push(`High number of TODOs (${metrics.todoCount}). Consider addressing them.`);
    } else if (metrics.todoCount > 0) {
      score -= metrics.todoCount;
      remarks.push(`${metrics.todoCount} TODO/s found.`);
    }

    if (metrics.commentRatio !== undefined) {
        if (metrics.commentRatio < 0.05) {
            score -= 5;
            remarks.push("Low comment ratio. Consider adding more comments for clarity.");
        }
    }

    score = Math.max(0, Math.min(100, score)); // Ensure score is within 0-100

    return {
      overallScore: score,
      remarks: remarks.length > 0 ? remarks : ["Code quality appears reasonable based on basic checks."],
      metrics: metrics
    };
  }
}
