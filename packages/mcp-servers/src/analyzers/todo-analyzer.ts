export interface TodoItem {
  type: string; // TODO, FIXME, HACK, NOTE
  content: string;
  file_path: string;
  line: number;
}

export class TodoAnalyzer {
  analyzeFile(filePath: string, content: string): TodoItem[] {
    const todos: TodoItem[] = [];
    const lines = content.split('\n');

    // Regular expressions to match different comment styles
    const patterns = [
      // Single line comments: // TODO: ... or # FIXME: ...
      /(?:\/\/|#)\s*(TODO|FIXME|HACK|NOTE):\s*(.+)/i,
      // Multi-line comments: /* TODO: ... */
      /\/\*\s*(TODO|FIXME|HACK|NOTE):\s*([\s\S]*?)\s*\*\//i
    ];

    lines.forEach((line, index) => {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          // For single line comments, match[1] is type, match[2] is content
          // For multi-line, it's similar but content might need trimming if it spans visually.
          // This simple line-by-line won't catch multi-line comment contents perfectly if the content itself has newlines.
          // A more robust parser would be needed for perfect multi-line content extraction.
          todos.push({
            type: match[1].toUpperCase(),
            content: match[2].trim(),
            file_path: filePath,
            line: index + 1 // Line numbers are 1-based
          });
          // Assuming one TODO per line for simplicity here.
          // If a line could have multiple TODOs, this loop should continue.
          break;
        }
      }
    });

    // For a more robust multi-line comment handling, we might need to process the whole content once.
    // This is a simplified version focusing on line by line.
    // Example for block comments (could be added or replace the line-by-line for block ones):
    const blockCommentPattern = /\/\*\s*(TODO|FIXME|HACK|NOTE):\s*([\s\S]*?)\s*\*\//gi;
    let match;
    while ((match = blockCommentPattern.exec(content)) !== null) {
        // This finds block comments. Calculating the line number accurately would require
        // counting newlines before `match.index` or a more complex setup.
        // For simplicity, this example adds it without precise line number if found this way,
        // or one could try to map `match.index` to a line number.

        // This is a conceptual addition; the current line-by-line approach is simpler.
        // To avoid duplicates if both methods are used, logic to merge or prefer one would be needed.
    }

    return todos;
  }
}
