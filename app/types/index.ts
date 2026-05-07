// GitHub Types
export interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
}

// Java Endpoint Types
export interface JavaEndpoint {
  method: string;
  path: string;
  methodName: string;
  className: string;
  params?: JavaParam[];
  requestBody?: JavaRequestBody;
  returnType?: string;
  description?: string;
}

export interface JavaParam {
  name: string;
  type: string;
  required?: boolean;
  in: 'query' | 'path' | 'header';
}

export interface JavaRequestBody {
  type: string;
  description?: string;
}

// Repository Analysis
export interface RepositoryAnalysis {
  repo: GitHubRepo;
  endpoints: JavaEndpoint[];
  hasExistingSwagger: boolean;
  swaggerUrl?: string;
}

// Configuration
export interface AppConfig {
  githubToken: string;
  orgUrl: string;
  teamPrefix: string;
}

// OpenAPI Types
export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{ url: string; description?: string }>;
  tags?: Array<{ name: string; description?: string }>;
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
  };
}

// Parser Result
export interface ParserResult {
  status: 'success' | 'error' | 'loading';
  message: string;
  data?: OpenAPISpec;
  repositories?: RepositoryAnalysis[];
}
