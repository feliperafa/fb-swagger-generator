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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-block mb-4">
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
              FB Swagger Generator
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
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
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-slate-100 dark:border-slate-700">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Smart Detection</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Automatically detects Java controllers and REST endpoints
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-slate-100 dark:border-slate-700">
              <div className="text-3xl mb-3">📦</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Multi-Repository</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Analyzes multiple repositories matching your team prefix
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-slate-100 dark:border-slate-700">
              <div className="text-3xl mb-3">💾</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Multiple Formats</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Export as JSON or YAML for Insomnia, Postman, and more
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-slate-600 dark:text-slate-400 text-sm">
          <p>Version 1.0.0 • Generated Swagger is compatible with Insomnia & Postman</p>
        </footer>
      </div>
    </main>
  );
}
