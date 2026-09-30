'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Truck } from '../../components/ui/Icons';
import { authenticateAsync, getPortalUrl } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Ensure form is fresh upon visiting login page
    setError('');
    setLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normId = identifier.trim();
    if (!normId || !password) {
      setError('Please enter both Email and Password.');
      return;
    }

    setLoading(true);

    try {
      // Real Backend path: authenticate against Spring Boot REST API
      const backendUser = await authenticateAsync(normId, password);
      setLoading(false);

      if (backendUser) {
        window.location.href = getPortalUrl(backendUser.role);
        return;
      }

      setError('Invalid email or password.');
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] flex flex-col justify-center py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#16425B] border-2 border-[#81C4D7] text-white shadow-md mb-3 sm:mb-4">
          <Truck size={26} />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#16425B] tracking-tight">
          SRI AMMAN ARUL TRANSPORTS
        </h1>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 sm:py-8 px-4 sm:px-10 shadow-sm rounded-xl border border-[#D9DBD6]">
          <div className="mb-6 pb-4 border-b border-[#D9DBD6]">
            <h2 className="text-base font-bold text-[#16425B]">Sign In to Workspace</h2>
            <p className="text-xs text-[#5A6E7F] mt-0.5">
              Enter your credentials to access your authorized portal.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. admin@transports"
                className="tms-input"
                autoComplete="email username"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="tms-input"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md break-words">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-2.5"
            >
              {loading ? 'Authenticating…' : 'Sign In'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#D9DBD6] flex items-center justify-center gap-1.5 text-[11px] text-[#5A6E7F]">
            <Lock size={12} />
            <span>Enterprise Transportation Management System</span>
          </div>
        </div>
      </div>
    </div>
  );
}
