export class ComplexityAnalyzer {
  /**
   * Calculates the cyclomatic complexity of a given piece of code.
   * This is a simplified model and might not cover all edge cases
   * or language-specific constructs perfectly.
   *
   * Cyclomatic complexity = E - N + 2P
   * Where E = number of edges, N = number of nodes, P = number of connected components (usually 1 for a single function).
   * A simplified way is to count decision points + 1.
   * Decision points include: if, else if, while, for, switch (cases), catch, ternary operators,
   * logical AND (&&) and OR (||) operators.
   */
  calculateCyclomaticComplexity(code: string): number {
    let complexity = 1; // Base complexity for a straight path

    // Keywords that represent decision points
    const decisionKeywords = [
      'if', 'else if', 'while', 'for',
      'switch', 'case',
      'catch',
      // Note: 'else' itself doesn't add complexity if 'if' is already counted.
      // 'finally' also doesn't typically add to complexity in this model.
    ];

    // Regular expressions for keywords and operators
    //  for word boundaries to avoid matching parts of other words (e.g., 'if' in 'identifier')
    const keywordRegex = new RegExp('\b(' + decisionKeywords.join('|') + ')\b', 'g');

    // Ternary operator: ? ... : ...
    const ternaryRegex = /\?\s*[^:]*:/g;

    // Logical AND/OR operators
    const logicalAndRegex = /&&/g;
    const logicalOrRegex = /\|\|/g; // Escaped pipe for OR

    // Count keyword-based decision points
    const keywordMatches = code.match(keywordRegex);
    if (keywordMatches) {
      complexity += keywordMatches.length;
    }

    // Count ternary operators
    const ternaryMatches = code.match(ternaryRegex);
    if (ternaryMatches) {
      complexity += ternaryMatches.length;
    }

    // Count logical AND operators
    const logicalAndMatches = code.match(logicalAndRegex);
    if (logicalAndMatches) {
      complexity += logicalAndMatches.length;
    }

    // Count logical OR operators
    const logicalOrMatches = code.match(logicalOrRegex);
    if (logicalOrMatches) {
      complexity += logicalOrMatches.length;
    }

    // Special handling for switch statements: each 'case' adds 1, but the 'switch' itself
    // is already counted. If 'switch' is counted as 1, and each 'case' as 1,
    // it aligns with some models. Other models say switch adds 0 and cases add 1.
    // The current keyword list counts 'switch' and 'case' separately.
    // If a 'switch' has N cases, it will add 1 (for switch) + N (for cases).
    // This is a common way to calculate it.

    return complexity;
  }
}
