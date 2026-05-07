'use client';

import { useState } from 'react';
import { ParserResult } from '@/app/types';
import { generatePostmanCollection, generateInsomniaCollection } from '@/app/lib/collectionGenerator';

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

  const downloadPostman = () => {
    if (!result.data) return;

    const collection = generatePostmanCollection(result.data);
    const dataStr = JSON.stringify(collection, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `postman-collection-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadInsomnia = () => {
    if (!result.data) return;

    const collection = generateInsomniaCollection(result.data);
    const dataStr = JSON.stringify(collection, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `insomnia-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (result.status === 'error') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">❌ Error</h3>
        <p className="text-red-700 dark:text-red-300 mb-4">{result.message}</p>
        <button
          onClick={onNewAnalysis}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">✅ Success!</h3>
        <p className="text-green-700 dark:text-green-300">{result.message}</p>
      </div>

      {/* Summary */}
      {result.repositories && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">📦 Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {result.repositories.map((repo) => (
              <div key={repo.name} className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-slate-100 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{repo.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                  {repo.endpoints} {repo.endpoints === 1 ? 'endpoint' : 'endpoints'}
                </p>
                {repo.hasExistingSwagger && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">✓ Has existing Swagger</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={downloadSwagger}
          className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
        >
          ⬇️ Download JSON
        </button>
        <button
          onClick={downloadYAML}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
        >
          ⬇️ Download YAML
        </button>
        <button
          onClick={downloadPostman}
          className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
        >
          🟠 Download Postman
        </button>
        <button
          onClick={downloadInsomnia}
          className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
        >
          🟣 Download Insomnia
        </button>
        <button
          onClick={copyToClipboard}
          className="px-5 py-2.5 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
        >
          📋 Copy JSON
        </button>
        {copyFeedback && <span className="text-green-600 dark:text-green-400 py-2 font-medium">{copyFeedback}</span>}
      </div>

      {/* API Preview */}
      {result.data && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">🔌 API Endpoints Preview</h3>

          {result.data.tags?.map((tag) => (
            <div key={tag.name} className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-visible bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <button
                onClick={() => toggleRepoExpanded(tag.name)}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-left font-semibold flex items-center justify-between transition-colors"
              >
                <span className="text-slate-900 dark:text-white">{tag.name}</span>
                <span className="text-slate-600 dark:text-slate-300">
                  {expandedRepos.has(tag.name) ? '▼' : '▶'}
                </span>
              </button>

              {expandedRepos.has(tag.name) && result.data && (
                <div className="p-5 space-y-3 bg-slate-50 dark:bg-slate-900/30">
                  {Object.entries(result.data.paths || {}).map(([path, pathItem]: [string, any]) => {
                    const methods = Object.entries(pathItem)
                      .filter(([key]) => ['get', 'post', 'put', 'patch', 'delete', 'options'].includes(key))
                      .filter(([_, operation]: [string, any]) => operation.tags?.includes(tag.name));

                    if (methods.length === 0) return null;

                    return (
                      <div key={path}>
                        {methods.map(([method]: [string, any]) => (
                          <div key={`${path}-${method}`} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
                            <span className={`px-2.5 py-1 rounded-md text-white text-xs font-semibold whitespace-nowrap ${getMethodColor(method)}`}>
                              {method.toUpperCase()}
                            </span>
                            <code className="flex-1 text-sm font-mono text-slate-700 dark:text-slate-300 break-all">{path}</code>
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
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
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
