import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import userService from '../services/userService';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverviewStats = async () => {
      try {
        const data = await userService.getUsers({ page: 1, limit: 1 });
        if (data?.summary) {
          setStats(data.summary);
        }
      } catch (err) {
        console.error('Failed to load overview stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOverviewStats();
  }, []);

  return (
    <div className="py-2 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          AskUrSenior Admin Portal
        </h1>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          System administration and management console.
        </p>
      </div>

      <div className="border-t border-gray-200 dark:border-zinc-800 pt-4">
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-2">
          Administration
        </h2>

        <div className="text-xs space-y-2">
          <div>
            <Link
              to="/users"
              className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400 inline-block"
            >
              Users
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mt-0.5">
              Manage registered students and administrator access.
            </p>
          </div>

          {/* Simple text statistics if loaded */}
          {stats && (
            <div className="font-mono text-gray-700 dark:text-gray-300 pt-1 space-y-0.5">
              <div>Total: <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.totalUsers.toLocaleString()}</span></div>
              <div>Recently Active: <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.recentlyActiveCount.toLocaleString()}</span></div>
              <div>Live: <span className="font-semibold text-gray-900 dark:text-gray-100">{stats.liveUsers.toLocaleString()}</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
