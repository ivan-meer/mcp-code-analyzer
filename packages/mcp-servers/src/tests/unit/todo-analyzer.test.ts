import { TodoAnalyzer, TodoItem } from '../../analyzers/todo-analyzer';

describe('TodoAnalyzer', () => {
  const analyzer = new TodoAnalyzer();

  it('should find no TODOs in empty content', () => {
    const items = analyzer.analyzeFile('test.js', '');
    expect(items.length).toBe(0);
  });

  it('should find a simple // TODO:', () => {
    const content = '// TODO: Fix this later';
    const items = analyzer.analyzeFile('test.js', content);
    expect(items.length).toBe(1);
    expect(items[0]).toEqual({
      type: 'TODO',
      content: 'Fix this later',
      file_path: 'test.js',
      line: 1,
    });
  });

  it('should find a # FIXME: in Python style', () => {
    const content = '# FIXME: Needs refactoring';
    const items = analyzer.analyzeFile('test.py', content);
    expect(items.length).toBe(1);
    expect(items[0]).toEqual({
      type: 'FIXME',
      content: 'Needs refactoring',
      file_path: 'test.py',
      line: 1,
    });
  });

  it('should find a /* HACK: */ style comment', () => {
    const content = '/* HACK: Temporary solution */';
    const items = analyzer.analyzeFile('test.c', content);
    expect(items.length).toBe(1);
    expect(items[0]).toEqual({
      type: 'HACK',
      content: 'Temporary solution',
      file_path: 'test.c',
      line: 1,
    });
  });

  it('should find a // NOTE: style comment', () => {
    const content = '// NOTE: Remember this detail';
    const items = analyzer.analyzeFile('test.java', content);
    expect(items.length).toBe(1);
    expect(items[0]).toEqual({
      type: 'NOTE',
      content: 'Remember this detail',
      file_path: 'test.java',
      line: 1,
    });
  });

  it('should handle different casing for TODO type', () => {
    const content = '// todo: Case insensitive check';
    const items = analyzer.analyzeFile('test.js', content);
    expect(items.length).toBe(1);
    expect(items[0].type).toBe('TODO');
    expect(items[0].content).toBe('Case insensitive check');
  });

  it('should correctly identify line numbers', () => {
    const content = '\n// TODO: On second line\n// FIXME: On third line';
    const items = analyzer.analyzeFile('test.js', content);
    expect(items.length).toBe(2);
    expect(items[0]).toEqual({
      type: 'TODO',
      content: 'On second line',
      file_path: 'test.js',
      line: 2,
    });
    expect(items[1]).toEqual({
      type: 'FIXME',
      content: 'On third line',
      file_path: 'test.js',
      line: 3,
    });
  });

  it('should extract content correctly with extra spaces', () => {
    const content = '// TODO:    Lots of spaces   ';
    const items = analyzer.analyzeFile('test.js', content);
    expect(items.length).toBe(1);
    expect(items[0].content).toBe('Lots of spaces');
  });

  it('should handle multiple TODOs in a file', () => {
    const content = '// TODO: First one\n# HACK: Second one\n/* FIXME: Third one */';
    const items = analyzer.analyzeFile('test.js', content);
    expect(items.length).toBe(3);
    expect(items[0].type).toBe('TODO');
    expect(items[1].type).toBe('HACK');
    expect(items[2].type).toBe('FIXME');
  });

  it('should not find TODOs in regular comments or code', () => {
    const content = '// This is just a comment, not a todo\nconst todo = "variable";';
    const items = analyzer.analyzeFile('test.js', content);
    expect(items.length).toBe(0);
  });

  // Example for multi-line comment content (simplified)
  // The current analyzer might only pick up the first line of content for multi-line comments
  // depending on the regex behavior with line-by-line processing.
  it('should find a basic multi-line /* TODO: */ comment', () => {
    const content = '/* TODO: This is a multi-line\n comment content here */';
    const items = analyzer.analyzeFile('test.js', content);
    // This test might need adjustment based on how the regex for multi-line comments
    // interacts with the line splitting. The current regex `([\s\S]*?)` should be greedy.
    // However, it's processed line by line.
    // If the block comment regex was the primary method, this would be different.
    expect(items.length).toBe(1);
    expect(items[0].type).toBe('TODO');
    // The content will likely be "This is a multi-line" because of line-by-line split
    // and the regex matching on that first line of the block.
    // A more sophisticated parser would capture the full block.
    expect(items[0].content).toBe('This is a multi-line');
  });

});
