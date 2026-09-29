'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Shield, Truck } from '../../components/ui/Icons';
import { authenticate, authenticateAsync, DEMO_USERS, getCurrentSession, getPortalUrl, setSession } from '../../lib/auth';
import { UserRole } from '../../types';

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
      setError('Please enter both Employee ID / Username and Password.');
      return;
    }

    setLoading(true);

    try {
      // 1. Fast path: check local demo & stored registered users
      const localUser = authenticate(normId, password);
      if (localUser) {
        setSession(localUser);
        setLoading(false);
        authenticateAsync(normId, password).catch(() => {});
        window.location.href = getPortalUrl(localUser.role);
        return;
      }

      // 2. Real Backend path: authenticate against Spring Boot REST API
      const backendUser = await authenticateAsync(normId, password);
      setLoading(false);

      if (backendUser) {
        setSession(backendUser);
        window.location.href = getPortalUrl(backendUser.role);
        return;
      }

      setError('Invalid username or password. Please use worker / accounts / manager / md / admin with password: password123 (or use 1-Click demo below).');
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    const user = DEMO_USERS.find((u) => u.role === role);
    if (user) {
      setIdentifier(user.username);
      setPassword(user.password);
      setSession(user);
      authenticateAsync(user.username, user.password).catch(() => {});
      window.location.href = getPortalUrl(user.role);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#16425B] border-2 border-[#81C4D7] text-white shadow-md mb-4">
          <Truck size={28} />
        </div>
        <h1 className="text-2xl font-black text-[#16425B] tracking-tight">
          SRI AMMAN ARUL TRANSPORTS
        </h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-[#D9DBD6] sm:px-10">
          <div className="mb-6 pb-4 border-b border-[#D9DBD6]">
            <h2 className="text-base font-bold text-[#16425B]">Sign In to Workspace</h2>
            <p className="text-xs text-[#5A6E7F] mt-0.5">
              Enter your credentials to access your authorized portal.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Employee ID / Username
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. WRK-0024 or worker"
                className="tms-input"
                autoComplete="username"
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
              />
            </div>

            {error && (
              <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md">
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

          {/* DEMO QUICK SWITCHER */}
          <div className="mt-8 pt-6 border-t border-[#D9DBD6]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider">
                Prototype Quick Sign-In
              </span>
              <span className="text-[10px] bg-[#e8f1f5] text-[#2F668F] font-semibold px-2 py-0.5 rounded">
                1-Click Demo
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('WORKER')}
                className="p-2.5 text-left border border-[#D9DBD6] rounded-lg hover:border-[#2F668F] hover:bg-[#f8faf5] transition-all"
              >
                <div className="text-xs font-bold text-[#16425B]">Worker Portal</div>
                <div className="text-[10px] text-[#5A6E7F]">Arun Kumar (WRK-0024)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ACCOUNTS')}
                className="p-2.5 text-left border border-[#D9DBD6] rounded-lg hover:border-[#2F668F] hover:bg-[#f8faf5] transition-all"
              >
                <div className="text-xs font-bold text-[#16425B]">Accounts Portal</div>
                <div className="text-[10px] text-[#5A6E7F]">Anitha S (ACC-0018)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('MANAGER')}
                className="p-2.5 text-left border border-[#D9DBD6] rounded-lg hover:border-[#2F668F] hover:bg-[#f8faf5] transition-all"
              >
                <div className="text-xs font-bold text-[#16425B]">Manager Portal</div>
                <div className="text-[10px] text-[#5A6E7F]">Rajesh V (MGR-0005)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('MD')}
                className="p-2.5 text-left border border-[#D9DBD6] rounded-lg hover:border-[#2F668F] hover:bg-[#f8faf5] transition-all"
              >
                <div className="text-xs font-bold text-[#16425B]">MD Cockpit</div>
                <div className="text-[10px] text-[#5A6E7F]">Vikramaditya Rao (EXEC)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ADMIN')}
                className="col-span-2 p-2.5 text-center border border-[#D9DBD6] rounded-lg hover:border-[#2F668F] hover:bg-[#f8faf5] transition-all"
              >
                <div className="text-xs font-bold text-[#16425B]">Admin Control Center</div>
                <div className="text-[10px] text-[#5A6E7F]">Karthik Raja (ADM-0001)</div>
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#5A6E7F]">
            <Lock size={12} />
            <span>Frontend prototype simulation · State persisted in browser</span>
          </div>
        </div>
      </div>
    </div>
  );
}
