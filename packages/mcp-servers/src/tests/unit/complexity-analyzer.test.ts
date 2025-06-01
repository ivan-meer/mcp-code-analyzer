import { ComplexityAnalyzer } from '../../analyzers/complexity-analyzer';

describe('ComplexityAnalyzer', () => {
  const analyzer = new ComplexityAnalyzer();

  it('should return 1 for empty code', () => {
    expect(analyzer.calculateCyclomaticComplexity('')).toBe(1);
  });

  it('should return 1 for simple sequential code', () => {
    const code = 'let a = 1;\nlet b = 2;\nlet c = a + b;';
    expect(analyzer.calculateCyclomaticComplexity(code)).toBe(1);
  });

  it('should correctly count an if statement', () => {
    const code = 'if (a > b) { console.log("hello"); }';
    expect(analyzer.calculateCyclomaticComplexity(code)).toBe(2); // 1 (base) + 1 (if)
  });

  it('should correctly count if-else if-else statements', () => {
    const code = 'if (a) {} else if (b) {} else {}';
    // 1 (base) + 1 (if) + 1 (else if) = 3
    // The 'else' itself doesn't add if 'if'/'else if' are counted.
    // Current logic: 'if' +1, 'else if' +1.
    expect(analyzer.calculateCyclomaticComplexity(code)).toBe(3);
  });

  it('should correctly count a for loop', () => {
    const code = 'for (let i = 0; i < 10; i++) { console.log(i); }';
    expect(analyzer.calculateCyclomaticComplexity(code)).toBe(2); // 1 (base) + 1 (for)
  });

  it('should correctly count a while loop', () => {
    const code = 'while (x > 0) { x--; }';
    expect(analyzer.calculateCyclomaticComplexity(code)).toBe(2); // 1 (base) + 1 (while)
  });

  it('should correctly count a switch statement with cases', () => {
    // 1 (base) + 1 (switch) + 3 (case) = 5
    const code = 'switch (val) { case 1: break; case 2: break; case 3: break; default: break; }';
    // 'default' is not in keywords, but 'case' is.
    // If default should also count, it needs to be added or 'case' logic refined.
    // Current: switch +1, case +1 for each.
    expect(analyzer.calculateCyclomaticComplexity(code)).toBe(5);
  });

  it('should correctly count a try-catch block', () => {
    const code = 'try { riskyOp(); } catch (e) { console.error(e); }';
    expect(analyzer.calculateCyclomaticComplexity(code)).toBe(2); // 1 (base) + 1 (catch)
  });

  it('should correctly count ternary operators', () => {
    const code = 'let result = (a > b) ? a : b;';
    expect(analyzer.calculateCyclomaticComplexity(code)).toBe(2); // 1 (base) + 1 (ternary)
  });

  it('should correctly count logical AND operators', () => {
    const code = 'if (a && b && c) {}';
    // 1 (base) + 1 (if) + 2 (&&) = 4
    expect(analyzer.calculateCyclomaticComplexity(code)).toBe(4);
  });

  it('should correctly count logical OR operators', () => {
    const code = 'if (a || b || c) {}';
    // 1 (base) + 1 (if) + 2 (||) = 4
    expect(analyzer.calculateCyclomaticComplexity(code)).toBe(4);
  });

  it('should handle mixed decision points', () => {
    const code = `
      if (x > 10) { // +1
        for (let i = 0; i < x; i++) { // +1
          if (i % 2 === 0 && x !== i) { // +1 (if) +1 (&&)
            console.log(i);
          }
        }
      }
      let y = x > 20 ? x : 20; // +1 (ternary)
    `;
    // Base (1) + if (1) + for (1) + if (1) + && (1) + ternary (1) = 6
    expect(analyzer.calculateCyclomaticComplexity(code)).toBe(6);
  });

  it('should not count keywords in comments or strings', () => {
    const code = '// if while for\n/* switch case catch */\nlet str = "if && ||";';
    expect(analyzer.calculateCyclomaticComplexity(code)).toBe(1);
  });

});
