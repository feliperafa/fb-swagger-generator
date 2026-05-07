'use client';

import React, { useState } from 'react';
import ConfigForm from '@/app/components/ConfigForm';
import ResultsView from '@/app/components/ResultsView';
import { AppConfig, ParserResult } from '@/app/types';

export default function Home() {
  const [result, setResult] = useState<ParserResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (config: AppConfig) => {
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      setResult(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setResult({
        status: 'error',
        message:
          error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewAnalysis = () => {
    setResult(null);
    setError('');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📚 PUPJ Swagger Generator
          </h1>
          <p className="text-gray-600">
            Automatically generate Swagger/OpenAPI documentation from your Java microservices
          </p>
        </div>

        {/* Main Content */}
        {!result ? (
          <ConfigForm onSubmit={handleAnalyze} isLoading={isLoading} />
        ) : (
          <ResultsView result={result} onNewAnalysis={handleNewAnalysis} />
        )}

        {/* Features Info */}
        {!result && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-2">🔍 Smart Detection</h3>
              <p className="text-gray-600 text-sm">
                Automatically detects Java controllers and REST endpoints
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📦 Multi-Repository</h3>
              <p className="text-gray-600 text-sm">
                Analyzes multiple repositories matching your team prefix
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-2">💾 Multiple Formats</h3>
              <p className="text-gray-600 text-sm">
                Export as JSON or YAML for Insomnia, Postman, and more
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-600 text-sm">
          <p>Version 1.0.0 • Generated Swagger is compatible with Insomnia & Postman</p>
        </footer>
      </div>
    </main>
  );
}
