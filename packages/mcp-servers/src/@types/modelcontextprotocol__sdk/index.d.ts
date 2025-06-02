declare module '@modelcontextprotocol/sdk' {
  export class Server {
    constructor(config: ServerConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    connect(transport: Transport): Promise<void>;
    close(): Promise<void>;
    registerTool<T>(tool: ToolDefinition<T>): void;
    connect(transport: Transport): Promise<void>;
    close(): Promise<void>;
    onerror?: (error: Error) => void;
    onerror: (error: Error) => void;
  }

  interface ServerConfig {
    name: string;
    version?: string;
    transport?: Transport;
  }

  interface AnalyzeProjectParams {
    projectPath: string;
    includeTests?: boolean;
  }

  interface AnalyzeFileParams {
    filePath: string;
    depth?: 'basic' | 'medium' | 'deep';
  }

  interface ClearCacheParams {
    projectId?: string;
  }

  export interface ToolResponse {
    content: Array<{
      type: string;
      text?: string;
      data?: any;
    }>;
  }

  export interface ToolDefinition<T> {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    handler: (params: T) => Promise<{ content: Array<{ type: string; text: string }> }>;
  }
  
  export interface Transport {
    send(message: string): void;
    onmessage(callback: (message: string) => void): void;
    close(): void;
  }
  
  export class StdioServerTransport implements Transport {
    send(message: string): void;
    onmessage(callback: (message: string) => void): void;
    close(): void;
  }

  export interface AnalyzeProjectParams {
    projectPath: string;
    includeTests?: boolean;
  }

  export interface AnalyzeFileParams {
    filePath: string;
    depth?: 'basic' | 'medium' | 'deep';
  }

  export interface ClearCacheParams {
    projectId?: string;
  }

  interface Transport {
    send(message: string): void;
    onMessage(callback: (message: string) => void): void;
  }
}