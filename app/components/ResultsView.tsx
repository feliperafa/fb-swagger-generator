'use client';

import React, { useState } from 'react';
import { OpenAPISpec, ParserResult } from '@/app/types';

interface ResultsViewProps {
  result: ParserResult;
  onNewAnalysis: () => void;
}

export default function ResultsView({ result, onNewAnalysis }: ResultsViewProps) {
  const [expandedRepos, setExpandedRepos] = useState<Set<string>>(new Set());
  const [copyFeedback, setCopyFeedback] = useState('');

  const toggleRepoExpanded = (repoName: string) => {
    const newExpanded = new Set(expandedRepos);
    if (newExpanded.has(repoName)) {
      newExpanded.delete(repoName);
    } else {
      newExpanded.add(repoName);
    }
    setExpandedRepos(newExpanded);
  };

  const downloadSwagger = () => {
    if (!result.data) return;

    const dataStr = JSON.stringify(result.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `swagger-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadYAML = () => {
    if (!result.data) return;

    const yaml = convertToYAML(result.data);
    const dataBlob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `swagger-${new Date().toISOString().split('T')[0]}.yaml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (!result.data) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
      setCopyFeedback('Copied to clipboard!');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (error) {
      setCopyFeedback('Failed to copy');
    }
  };

  if (result.status === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold mb-2">Error</h3>
        <p className="text-red-700">{result.message}</p>
        <button
          onClick={onNewAnalysis}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-green-800 font-semibold mb-2">Success!</h3>
        <p className="text-green-700">{result.message}</p>
      </div>

      {/* Summary */}
      {result.repositories && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-semibold mb-3">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {result.repositories.map((repo) => (
              <div key={repo.name} className="bg-white rounded p-3">
                <p className="text-sm font-medium text-gray-900">{repo.name}</p>
                <p className="text-sm text-gray-600">
                  {repo.endpoints} {repo.endpoints === 1 ? 'endpoint' : 'endpoints'}
                </p>
                {repo.hasExistingSwagger && (
                  <p className="text-xs text-blue-600 mt-1">✓ Has existing Swagger</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={downloadSwagger}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
        >
          ⬇️ Download JSON
        </button>
        <button
          onClick={downloadYAML}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
        >
          ⬇️ Download YAML
        </button>
        <button
          onClick={copyToClipboard}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
        >
          📋 Copy JSON
        </button>
        {copyFeedback && <span className="text-green-600 py-2">{copyFeedback}</span>}
      </div>

      {/* API Preview */}
      {result.data && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">API Endpoints Preview</h3>

          {result.data.tags?.map((tag) => (
            <div key={tag.name} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleRepoExpanded(tag.name)}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-left font-semibold flex items-center justify-between"
              >
                <span>{tag.name}</span>
                <span className="text-gray-600">
                  {expandedRepos.has(tag.name) ? '▼' : '▶'}
                </span>
              </button>

              {expandedRepos.has(tag.name) && (
                <div className="p-4 space-y-3">
                  {Object.entries(result.data.paths || {}).map(([path, pathItem]: [string, any]) => {
                    const methods = Object.entries(pathItem)
                      .filter(([key]) => ['get', 'post', 'put', 'patch', 'delete', 'options'].includes(key))
                      .filter(([_, operation]: [string, any]) => operation.tags?.includes(tag.name));

                    if (methods.length === 0) return null;

                    return (
                      <div key={path}>
                        {methods.map(([method, operation]: [string, any]) => (
                          <div key={`${path}-${method}`} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                            <span className={`px-2 py-1 rounded text-white text-xs font-semibold ${getMethodColor(method)}`}>
                              {method.toUpperCase()}
                            </span>
                            <code className="flex-1 text-sm font-mono">{path}</code>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={onNewAnalysis}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
      >
        ← New Analysis
      </button>
    </div>
  );
}

function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    get: 'bg-blue-500',
    post: 'bg-green-500',
    put: 'bg-orange-500',
    patch: 'bg-yellow-500',
    delete: 'bg-red-500',
    options: 'bg-gray-500',
  };
  return colors[method.toLowerCase()] || 'bg-gray-500';
}

function convertToYAML(obj: any, indent = 0): string {
  const spaces = ' '.repeat(indent);
  let yaml = '';

  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    obj.forEach((item) => {
      yaml += `${spaces}- ${convertToYAML(item, indent + 2).trim()}\n`;
    });
    return yaml;
  }

  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      yaml += `${spaces}${key}:\n${convertToYAML(value, indent + 2)}`;
    } else {
      yaml += `${spaces}${key}: ${JSON.stringify(value)}\n`;
    }
  });

  return yaml;
}
