declare module '@/lib/hash-utils' {
  export function calculateFileHash(
    filePath: string,
    algorithm?: string
  ): Promise<string>;
  
  export function shouldProcessFile(
    filePath: string,
    minSize: number,
    ignoreExtensions: string[]
  ): boolean;

  export function groupFilesByHash(
    files: string[],
    algorithm?: string
  ): Promise<Map<string, string[]>>;
}