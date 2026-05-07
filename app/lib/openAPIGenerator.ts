import { JavaEndpoint, OpenAPISpec, RepositoryAnalysis } from '@/app/types';

export class OpenAPIGenerator {
  generateFromRepositories(
    repositories: RepositoryAnalysis[],
    title: string = 'API Documentation'
  ): OpenAPISpec {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title,
        version: '1.0.0',
        description: 'Auto-generated API documentation from repositories',
      },
      servers: [
        {
          url: 'http://localhost:8080',
          description: 'Local Development Server',
        },
      ],
      tags: [],
      paths: {},
      components: {
        schemas: {
          ApiResponse: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              message: { type: 'string' },
              data: { type: 'object' },
            },
          },
        },
      },
    };

    // Group endpoints by repository
    repositories.forEach((repo) => {
      if (repo.endpoints.length === 0) return;

      const tag = {
        name: repo.repo.name,
        description: repo.repo.description || `Endpoints from ${repo.repo.name}`,
      };

      if (!spec.tags) spec.tags = [];
      spec.tags.push(tag);

      // Add endpoints to paths
      repo.endpoints.forEach((endpoint) => {
        this.addEndpointToSpec(spec, endpoint, repo.repo.name);
      });
    });

    return spec;
  }

  private addEndpointToSpec(spec: OpenAPISpec, endpoint: JavaEndpoint, repoTag: string): void {
    const path = endpoint.path;

    if (!spec.paths[path]) {
      spec.paths[path] = {};
    }

    const method = endpoint.method.toLowerCase();
    const pathItem = spec.paths[path];

    // Build parameters
    const parameters: any[] = [];

    if (endpoint.params) {
      endpoint.params.forEach((param) => {
        parameters.push({
          name: param.name,
          in: param.in,
          required: param.required ?? true,
          schema: {
            type: this.mapJavaTypeToOpenAPI(param.type),
          },
          description: `${param.name} parameter`,
        });
      });
    }

    // Extract path parameters from path
    const pathParams = this.extractPathParameters(path);
    pathParams.forEach((paramName) => {
      if (!parameters.find((p) => p.name === paramName)) {
        parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
        });
      }
    });

    // Build request body (for POST, PUT, PATCH)
    const requestBody =
      ['post', 'put', 'patch'].includes(method) ?
        {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  example: {
                    type: 'string',
                  },
                },
              },
            },
          },
        }
      : undefined;

    // Build response
    const responses = {
      '200': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiResponse',
            },
          },
        },
      },
      '400': {
        description: 'Bad request',
      },
      '404': {
        description: 'Not found',
      },
      '500': {
        description: 'Internal server error',
      },
    };

    // Build operation
    pathItem[method] = {
      summary: `${endpoint.method} ${path}`,
      description: endpoint.description || `${endpoint.method} request to ${path}`,
      tags: [repoTag],
      operationId: `${endpoint.className}_${endpoint.methodName}`,
      ...(parameters.length > 0 && { parameters }),
      ...(requestBody && { requestBody }),
      responses,
    };
  }

  private extractPathParameters(path: string): string[] {
    const matches = path.match(/{([^}]+)}/g);
    if (!matches) return [];
    return matches.map((m) => m.slice(1, -1));
  }

  private mapJavaTypeToOpenAPI(javaType: string): string {
    const typeMap: Record<string, string> = {
      String: 'string',
      Integer: 'integer',
      Long: 'integer',
      Double: 'number',
      Float: 'number',
      Boolean: 'boolean',
      Date: 'string',
      LocalDate: 'string',
      LocalDateTime: 'string',
      UUID: 'string',
      int: 'integer',
      long: 'integer',
      double: 'number',
      float: 'number',
      boolean: 'boolean',
    };

    return typeMap[javaType] || 'object';
  }
}
