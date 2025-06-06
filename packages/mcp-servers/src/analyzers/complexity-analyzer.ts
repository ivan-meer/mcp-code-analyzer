export class ComplexityAnalyzer {
  /**
   * Removes comments and string literals from code to avoid
   * counting keywords that appear inside them.
   */
  private sanitize(code: string): string {
    // Remove string literals first so that comment markers inside strings are ignored
    let result = '';
    let inSingle = false;
    let inDouble = false;
    let inTemplate = false;
    let braceDepth = 0;
    let escaped = false;

    for (let i = 0; i < code.length; i++) {
      const ch = code[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (inSingle) {
        if (ch === '\\') {
          escaped = true;
        } else if (ch === "'") {
          inSingle = false;
        }
        continue;
      }

      if (inDouble) {
        if (ch === '\\') {
          escaped = true;
        } else if (ch === '"') {
          inDouble = false;
        }
        continue;
      }

      if (inTemplate) {
        if (ch === '\\') {
          escaped = true;
        } else if (ch === '`' && braceDepth === 0) {
          inTemplate = false;
        } else if (ch === '{' && code[i - 1] === '$') {
          braceDepth++;
        } else if (ch === '{') {
          braceDepth++;
        } else if (ch === '}' && braceDepth > 0) {
          braceDepth--;
        }
        continue;
      }

      if (ch === "'") {
        inSingle = true;
        continue;
      }
      if (ch === '"') {
        inDouble = true;
        continue;
      }
      if (ch === '`') {
        inTemplate = true;
        braceDepth = 0;
        continue;
      }

      result += ch;
    }

    // Now remove comments from the code without strings
    result = result.replace(/\/\/.*$/gm, '');
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');

    return result;
  }
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
    const cleanCode = this.sanitize(code);
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
    const keywordMatches = cleanCode.match(keywordRegex);
    if (keywordMatches) {
      complexity += keywordMatches.length;
    }

    // Count ternary operators
    const ternaryMatches = cleanCode.match(ternaryRegex);
    if (ternaryMatches) {
      complexity += ternaryMatches.length;
    }

    // Count logical AND operators
    const logicalAndMatches = cleanCode.match(logicalAndRegex);
    if (logicalAndMatches) {
      complexity += logicalAndMatches.length;
    }

    // Count logical OR operators
    const logicalOrMatches = cleanCode.match(logicalOrRegex);
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
