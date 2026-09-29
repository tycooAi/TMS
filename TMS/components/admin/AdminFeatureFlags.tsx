'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '../layout/PageHeader';
import { apiClient } from '../../lib/api';
import { useTmsStore } from '../../lib/store';
import { FeatureFlag } from '../../types';
import { Check, AlertTriangle, RefreshCw } from '../ui/Icons';

export function AdminFeatureFlags() {
  const { featureFlags, toggleFeatureFlag: storeToggle } = useTmsStore();
  const [flags, setFlags] = useState<FeatureFlag[]>(featureFlags);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const res = await apiClient.system.getFeatureFlags();
      if (res && res.data) {
        setFlags(res.data);
      }
    } catch {
      setFlags(featureFlags);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleToggle = async (flagKey: string, currentEnabled: boolean) => {
    const nextVal = !currentEnabled;
    setLoading(true);
    setActionError(null);
    try {
      const res = await apiClient.system.toggleFeatureFlag(flagKey, nextVal);
      if (res && res.data) {
        setFlags((prev) => prev.map((f) => (f.flagKey === flagKey ? res.data : f)));
      } else {
        storeToggle(flagKey, nextVal);
        setFlags((prev) => prev.map((f) => (f.flagKey === flagKey ? { ...f, enabled: nextVal } : f)));
      }
      setActionSuccess(`Feature toggle ${flagKey} set to ${nextVal ? 'ENABLED' : 'DISABLED'}`);
    } catch {
      storeToggle(flagKey, nextVal);
      setFlags((prev) => prev.map((f) => (f.flagKey === flagKey ? { ...f, enabled: nextVal } : f)));
      setActionSuccess(`Feature toggle ${flagKey} updated locally.`);
    } finally {
      setLoading(false);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Feature Flags"
        subtitle="Runtime capability switches for application modules and integration services"
        actions={
          <button
            onClick={fetchFlags}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        }
      />

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* FEATURE FLAG LIST - MINIMAL */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Registered Feature Flags ({flags.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {flags.map((flag) => (
            <div
              key={flag.flagKey}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-800 font-medium">
                    {flag.flagKey}
                  </span>
                  <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-100">
                    {flag.category}
                  </span>
                </div>
                <h4 className="text-xs font-medium text-slate-900">{flag.name}</h4>
                <p className="text-xs text-slate-500">{flag.description}</p>
                <p className="text-[10px] text-slate-400">
                  Updated by {flag.updatedBy || 'SYSTEM'}
                  {flag.updatedAt ? ` · ${new Date(flag.updatedAt).toLocaleString()}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleToggle(flag.flagKey, flag.enabled)}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                    flag.enabled
                      ? 'border-slate-300 text-slate-900 bg-white hover:bg-slate-50'
                      : 'border-slate-200 text-slate-400 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        flag.enabled ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
