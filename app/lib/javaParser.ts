import { JavaEndpoint, JavaParam, JavaRequestBody } from '@/app/types';

export class JavaControllerParser {
  parseControllers(fileContent: string, fileName: string): JavaEndpoint[] {
    const endpoints: JavaEndpoint[] = [];

    // Remove comments
    let cleaned = this.removeComments(fileContent);

    // Extract class name
    const classMatch = cleaned.match(/@RestController|@Controller/);
    if (!classMatch) {
      return [];
    }

    const classNameMatch = cleaned.match(/(?:public\s+)?class\s+(\w+)/);
    const className = classNameMatch ? classNameMatch[1] : fileName.replace('.java', '');

    // Extract class-level path
    const classPathMatch = cleaned.match(/@RequestMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/);
    const classPath = classPathMatch ? classPathMatch[1] : '';

    // Find all method annotations
    const methodPattern = /(@(?:GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)\s*\([^)]*\)|@(?:GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)\s*(?:\([^)]*\))?)\s*(?:\/\/[^\n]*)?\s*(?:public|private|protected)\s+(?:ResponseEntity|Response)?\s*(?:<[^>]+>)?\s*(\w+)\s*\(\s*([^)]*)\)/gm;

    let match;
    while ((match = methodPattern.exec(cleaned)) !== null) {
      const decorators = match[1];
      const methodName = match[2];
      const paramsString = match[3];

      const endpoint = this.parseEndpoint(
        decorators,
        methodName,
        paramsString,
        className,
        classPath
      );

      if (endpoint) {
        endpoints.push(endpoint);
      }
    }

    return endpoints;
  }

  private parseEndpoint(
    decorators: string,
    methodName: string,
    paramsString: string,
    className: string,
    classPath: string
  ): JavaEndpoint | null {
    // Extract HTTP method
    let method = 'GET';
    if (decorators.includes('PostMapping')) method = 'POST';
    if (decorators.includes('PutMapping')) method = 'PUT';
    if (decorators.includes('PatchMapping')) method = 'PATCH';
    if (decorators.includes('DeleteMapping')) method = 'DELETE';
    if (decorators.includes('RequestMapping')) {
      const methodMatch = decorators.match(/method\s*=\s*RequestMethod\.(\w+)/);
      if (methodMatch) {
        method = methodMatch[1];
      }
    }

    // Extract path
    let path = classPath || '';
    const pathMatch = decorators.match(
      /(?:value|path)\s*=\s*["']([^"']+)["']|@(?:GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping)\s*\(\s*["']([^"']+)["']\)/
    );

    if (pathMatch) {
      const methodPath = pathMatch[1] || pathMatch[2] || '';
      path = classPath + methodPath;
    }

    if (!path) {
      path = `/${methodName.toLowerCase()}`;
    }

    // Parse parameters
    const params = this.parseParameters(paramsString);

    const endpoint: JavaEndpoint = {
      method,
      path: path.startsWith('/') ? path : `/${path}`,
      methodName,
      className,
      params: params.length > 0 ? params : undefined,
      description: `${method} endpoint`,
    };

    return endpoint;
  }

  private parseParameters(paramsString: string): JavaParam[] {
    const params: JavaParam[] = [];
    if (!paramsString.trim()) {
      return params;
    }

    // Split by comma, but respect nested generics
    const paramParts = this.splitParameters(paramsString);

    paramParts.forEach((param) => {
      const param_trimmed = param.trim();
      if (!param_trimmed) return;

      // Extract annotations (@PathVariable, @RequestParam, @RequestBody)
      let annotation = 'query'; // default
      if (param_trimmed.includes('@PathVariable')) annotation = 'path';
      if (param_trimmed.includes('@RequestHeader')) annotation = 'header';

      // Extract parameter name and type
      const nameMatch = param_trimmed.match(/(\w+)\s+(\w+)(?:\s*[,)]|$)/);
      if (nameMatch) {
        const type = nameMatch[1];
        const name = nameMatch[2];

        if (name && type) {
          params.push({
            name,
            type,
            in: annotation as any,
            required: !param_trimmed.includes('Optional'),
          });
        }
      }
    });

    return params;
  }

  private splitParameters(str: string): string[] {
    const parts: string[] = [];
    let current = '';
    let depth = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (char === '<' || char === '(') depth++;
      if (char === '>' || char === ')') depth--;

      if (char === ',' && depth === 0) {
        parts.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    if (current) parts.push(current);
    return parts;
  }

  private removeComments(content: string): string {
    // Remove line comments
    let result = content.replace(/\/\/.*$/gm, '');
    // Remove block comments
    result = result.replace(/\/\*[\s\S]*?\*\//gm, '');
    return result;
  }
}
