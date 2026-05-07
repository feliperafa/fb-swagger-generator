'use client';

import React, { useState, useEffect } from 'react';
import { AppConfig } from '@/app/types';

interface ConfigFormProps {
  onSubmit: (config: AppConfig) => Promise<void>;
  isLoading: boolean;
}

export default function ConfigForm({ onSubmit, isLoading }: ConfigFormProps) {
  const [config, setConfig] = useState<AppConfig>({
    githubToken: '',
    orgUrl: '',
    teamPrefix: '',
  });

  const [validating, setValidating] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenValidError, setTokenValidError] = useState('');

  // Load saved config from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('fb-config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved config');
      }
    }
  }, []);

  // Save config to localStorage whenever it changes
  const handleConfigChange = (field: keyof AppConfig, value: string) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    localStorage.setItem('fb-config', JSON.stringify(newConfig));
    setTokenValid(null);
    setTokenValidError('');
  };

  const validateToken = async () => {
    if (!config.githubToken) {
      setTokenValidError('Token is required');
      return;
    }

    setValidating(true);
    setTokenValidError('');

    try {
      const response = await fetch('/api/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubToken: config.githubToken }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        setTokenValidError(data.message || 'Invalid token');
      }
    } catch (error) {
      setTokenValid(false);
      setTokenValidError(
        error instanceof Error ? error.message : 'Failed to validate token'
      );
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!config.githubToken || !config.orgUrl || !config.teamPrefix) {
      alert('Please fill in all fields');
      return;
    }

    if (!tokenValid) {
      alert('Please validate your GitHub token first');
      return;
    }

    await onSubmit(config);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Configuration</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* GitHub Token */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            GitHub Personal Access Token *
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={config.githubToken}
              onChange={(e) => handleConfigChange('githubToken', e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={validateToken}
              disabled={validating || !config.githubToken}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
            >
              {validating ? 'Validating...' : 'Validate'}
            </button>
          </div>
          {tokenValid === true && (
            <p className="text-sm text-green-600 mt-1">✓ Token is valid</p>
          )}
          {tokenValid === false && (
            <p className="text-sm text-red-600 mt-1">✗ {tokenValidError}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Create at: https://github.com/settings/tokens (needs repo access)
          </p>
        </div>

        {/* Organization URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organization GitHub URL *
          </label>
          <input
            type="text"
            value={config.orgUrl}
            onChange={(e) => handleConfigChange('orgUrl', e.target.value)}
            placeholder="https://github.com/your-org"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: https://github.com/my-company
          </p>
        </div>

        {/* Team Prefix */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Team Repository Prefix *
          </label>
          <input
            type="text"
            value={config.teamPrefix}
            onChange={(e) => handleConfigChange('teamPrefix', e.target.value)}
            placeholder="pupj"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Will find all repos starting with this prefix (e.g., pupj-srv, pupj-bff)
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || tokenValid !== true}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
        >
          {isLoading ? 'Analyzing Repositories...' : 'Analyze Repositories'}
        </button>
      </form>
    </div>
  );
}
