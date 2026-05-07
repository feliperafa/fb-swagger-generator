import { OpenAPISpec } from '@/app/types';

export function generatePostmanCollection(spec: OpenAPISpec): object {
  const baseUrl = spec.servers?.[0]?.url || 'http://localhost:8080';

  const folders = spec.tags?.map(tag => {
    const items = Object.entries(spec.paths || {})
      .flatMap(([path, pathItem]: [string, any]) => {
        return Object.entries(pathItem)
          .filter(([key]) => ['get', 'post', 'put', 'patch', 'delete', 'options'].includes(key))
          .filter(([_, operation]: [string, any]) => operation.tags?.includes(tag.name))
          .map(([method, operation]: [string, any]) => {
            const pathVars = (operation.parameters || [])
              .filter((p: any) => p.in === 'path')
              .map((p: any) => ({ key: p.name, value: '' }));

            const queryParams = (operation.parameters || [])
              .filter((p: any) => p.in === 'query')
              .map((p: any) => ({
                key: p.name,
                value: '',
                disabled: false,
              }));

            const headers = (operation.parameters || [])
              .filter((p: any) => p.in === 'header')
              .map((p: any) => ({
                key: p.name,
                value: '',
                disabled: false,
              }));

            const pathWithColons = path.replace(/{(\w+)}/g, ':$1');
            const rawUrl = `${baseUrl}${pathWithColons}`;

            const request: any = {
              method: method.toUpperCase(),
              header: headers,
              url: {
                raw: rawUrl,
                protocol: baseUrl.split('://')[0],
                host: baseUrl.split('://')[1].split('/')[0].split(':')[0],
                ...(baseUrl.includes(':') && { port: baseUrl.split(':')[2]?.split('/')[0] }),
                path: pathWithColons.split('/').filter(Boolean),
                variable: pathVars,
                query: queryParams,
              },
            };

            if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
              request.body = {
                mode: 'raw',
                raw: '{}',
                options: {
                  raw: {
                    language: 'json',
                  },
                },
              };
            }

            return {
              name: `${method.toUpperCase()} ${path}`,
              request,
            };
          });
      });

    return {
      name: tag.name,
      item: items,
    };
  }) || [];

  return {
    info: {
      name: spec.info.title,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: folders,
    variable: [
      {
        key: 'baseUrl',
        value: baseUrl,
      },
    ],
  };
}

export function generateInsomniaCollection(spec: OpenAPISpec): object {
  const baseUrl = spec.servers?.[0]?.url || 'http://localhost:8080';
  const workspaceId = 'wrk_001';
  const resources: any[] = [];
  let requestId = 0;
  let folderId = 0;

  resources.push({
    _id: workspaceId,
    _type: 'workspace',
    name: spec.info.title,
    scope: 'collection',
  });

  const folderMap = new Map<string, string>();

  spec.tags?.forEach(tag => {
    const currentFolderId = `fld_${String(++folderId).padStart(3, '0')}`;
    folderMap.set(tag.name, currentFolderId);

    resources.push({
      _id: currentFolderId,
      _type: 'request_group',
      parentId: workspaceId,
      name: tag.name,
    });
  });

  Object.entries(spec.paths || {}).forEach(([path, pathItem]: [string, any]) => {
    Object.entries(pathItem)
      .filter(([key]) => ['get', 'post', 'put', 'patch', 'delete', 'options'].includes(key))
      .forEach(([method, operation]: [string, any]) => {
        const tag = operation.tags?.[0];
        if (!tag) return;

        const folderId = folderMap.get(tag);
        if (!folderId) return;

        const currentRequestId = `req_${String(++requestId).padStart(3, '0')}`;

        const pathVars = (operation.parameters || [])
          .filter((p: any) => p.in === 'path')
          .map((p: any) => ({ name: p.name, value: '' }));

        const queryParams = (operation.parameters || [])
          .filter((p: any) => p.in === 'query')
          .map((p: any) => ({
            name: p.name,
            value: '',
            disabled: false,
          }));

        const headers = (operation.parameters || [])
          .filter((p: any) => p.in === 'header')
          .map((p: any) => ({
            name: p.name,
            value: '',
            disabled: false,
          }));

        const pathWithTemplates = path.replace(/{(\w+)}/g, '{{ $1 }}');
        const url = `${baseUrl}${pathWithTemplates}`;

        const request: any = {
          _id: currentRequestId,
          _type: 'request',
          parentId: folderId,
          name: `${method.toUpperCase()} ${path}`,
          method: method.toUpperCase(),
          url,
          headers,
          parameters: queryParams,
        };

        if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
          request.body = {
            mimeType: 'application/json',
            text: '{}',
          };
        }

        resources.push(request);
      });
  });

  return {
    _type: 'export',
    __export_format: 4,
    __export_date: new Date().toISOString(),
    __export_source: 'fb-swagger-generator',
    resources,
  };
}
