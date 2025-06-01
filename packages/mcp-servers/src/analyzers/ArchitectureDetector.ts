/**
 * Детектор архитектурных паттернов
 */

import { FileAnalysis } from '../types/analysis.types.js';

export class ArchitectureDetector {
  
  detectPatterns(files: FileAnalysis[]): string[] {
    const patterns: string[] = [];
    const paths = files.map(f => f.path.toLowerCase());
    const fileNames = files.map(f => f.name.toLowerCase());

    // Component-based architecture
    if (this.hasComponentArchitecture(paths, fileNames)) {
      patterns.push('Component-Based Architecture');
    }

    // MVC Pattern
    if (this.hasMVCPattern(paths, fileNames)) {
      patterns.push('MVC Pattern');
    }

    // Microservices indicators
    if (this.hasMicroservicesPattern(paths, files)) {
      patterns.push('Microservices Architecture');
    }

    // Layered architecture
    if (this.hasLayeredArchitecture(paths)) {
      patterns.push('Layered Architecture');
    }

    // Module pattern
    if (this.hasModulePattern(files)) {
      patterns.push('Module Pattern');
    }

    // Test-driven development
    if (this.hasTDDPattern(paths, fileNames)) {
      patterns.push('Test-Driven Development');
    }

    // API-first design
    if (this.hasAPIFirstPattern(paths, fileNames)) {
      patterns.push('API-First Design');
    }

    return patterns;
  }

  private hasComponentArchitecture(paths: string[], fileNames: string[]): boolean {
    const componentIndicators = [
      'component', 'components', 'comp',
      'widget', 'widgets',
      'element', 'elements'
    ];

    return componentIndicators.some(indicator => 
      paths.some(p => p.includes(indicator)) ||
      fileNames.some(f => f.includes(indicator))
    );
  }

  private hasMVCPattern(paths: string[], fileNames: string[]): boolean {
    const modelIndicators = paths.some(p => 
      p.includes('model') || p.includes('models')
    );
    const viewIndicators = paths.some(p => 
      p.includes('view') || p.includes('views')
    );
    const controllerIndicators = paths.some(p => 
      p.includes('controller') || p.includes('controllers')
    );

    return modelIndicators && viewIndicators && controllerIndicators;
  }

  private hasMicroservicesPattern(paths: string[], files: FileAnalysis[]): boolean {
    const serviceIndicators = [
      'service', 'services', 'api'
    ];

    const hasServices = serviceIndicators.some(indicator =>
      paths.some(p => p.includes(indicator))
    );

    const hasDockerfiles = files.some(file =>
      file.name.toLowerCase().includes('dockerfile')
    );

    return hasServices || hasDockerfiles;
  }

  private hasLayeredArchitecture(paths: string[]): boolean {
    const layers = ['controller', 'service', 'repository', 'model'];
    const foundLayers = layers.filter(layer =>
      paths.some(p => p.includes(layer))
    );

    return foundLayers.length >= 2;
  }

  private hasModulePattern(files: FileAnalysis[]): boolean {
    const hasExports = files.some(file => file.exports.length > 0);
    const hasImports = files.some(file => file.imports.length > 0);
    
    return hasExports && hasImports;
  }

  private hasTDDPattern(paths: string[], fileNames: string[]): boolean {
    const testIndicators = [
      'test', 'tests', 'spec', '__tests__'
    ];

    return testIndicators.some(indicator =>
      paths.some(p => p.includes(indicator)) ||
      fileNames.some(f => f.includes(indicator))
    );
  }

  private hasAPIFirstPattern(paths: string[], fileNames: string[]): boolean {
    const apiIndicators = [
      'api', 'routes', 'endpoints', 'swagger', 'openapi'
    ];

    return apiIndicators.some(indicator =>
      paths.some(p => p.includes(indicator)) ||
      fileNames.some(f => f.includes(indicator))
    );
  }
}
