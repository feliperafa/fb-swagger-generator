'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { AppConfig } from '@/app/types';

interface ConfigFormProps {
  onSubmit: (config: AppConfig) => Promise<void>;
  isLoading: boolean;
}

function getInitialConfig(): AppConfig {
  if (typeof window === 'undefined') {
    return { orgUrl: '', teamPrefix: '' };
  }

  const saved = localStorage.getItem('fb-config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return { orgUrl: '', teamPrefix: '' };
    }
  }

  return { orgUrl: '', teamPrefix: '' };
}

export default function ConfigForm({ onSubmit, isLoading }: ConfigFormProps) {
  const { data: session } = useSession();
  const [config, setConfig] = useState<AppConfig>(getInitialConfig);

  const handleConfigChange = (field: keyof AppConfig, value: string) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    localStorage.setItem('fb-config', JSON.stringify(newConfig));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!config.orgUrl || !config.teamPrefix) {
      alert('Please fill in all fields');
      return;
    }

    await onSubmit(config);
  };

  if (!session) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Welcome</h2>
        <p className="text-gray-600 mb-6">
          Sign in with your GitHub account to get started.
        </p>
        <button
          onClick={() => signIn('github')}
          className="px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900 font-medium inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.544 2.914 1.19.092-.926.35-1.545.636-1.9-2.22-.253-4.555-1.112-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.447-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.817c.85.004 1.705.114 2.504.336 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.195 20 14.44 20 10.017 20 4.484 15.522 0 10 0z"
              clipRule="evenodd"
            />
          </svg>
          Sign in with GitHub
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Configuration</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            Signed in as{' '}
            <span className="font-semibold text-gray-900">
              {session.user?.name || session.user?.email}
            </span>
          </span>
          <button
            onClick={() => signOut()}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Sign out
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="fb"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Will find all repos starting with this prefix (e.g., fb-srv, fb-bff)
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
        >
          {isLoading ? 'Analyzing Repositories...' : 'Analyze Repositories'}
        </button>
      </form>
    </div>
  );
}
