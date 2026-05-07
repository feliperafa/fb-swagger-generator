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
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 p-8 text-center">
        <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">Welcome</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg">
          Sign in with your GitHub account to get started.
        </p>
        <button
          onClick={() => signIn('github')}
          className="px-8 py-3 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 dark:from-slate-700 dark:to-slate-600 dark:hover:from-slate-600 dark:hover:to-slate-500 text-white rounded-lg font-semibold inline-flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-200"
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
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Configuration</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Signed in as{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {session.user?.name || session.user?.email}
            </span>
          </span>
          <button
            onClick={() => signOut()}
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization URL */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Organization GitHub URL *
          </label>
          <input
            type="text"
            value={config.orgUrl}
            onChange={(e) => handleConfigChange('orgUrl', e.target.value)}
            placeholder="https://github.com/your-org"
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-slate-900 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Example: https://github.com/my-company or https://github.com/your-username
          </p>
        </div>

        {/* Team Prefix */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Team Repository Prefix *
          </label>
          <input
            type="text"
            value={config.teamPrefix}
            onChange={(e) => handleConfigChange('teamPrefix', e.target.value)}
            placeholder="fb"
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-slate-900 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Will find all repos (organization + personal) starting with this prefix (e.g., fb-srv, fb-bff)
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing Repositories...
            </span>
          ) : (
            'Analyze Repositories'
          )}
        </button>
      </form>
    </div>
  );
}
