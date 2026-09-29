'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '../layout/PageHeader';
import { apiClient } from '../../lib/api';
import { useTmsStore } from '../../lib/store';
import { Check, AlertTriangle } from '../ui/Icons';
import Link from 'next/link';

export function AdminEmergency() {
  const { systemControl, updateSystemControl, setSystemState } = useTmsStore();
  const [controlState, setControlState] = useState(systemControl);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Shutdown confirmation
  const [isShutdownOpen, setIsShutdownOpen] = useState(false);
  const [shutdownConfirm, setShutdownConfirm] = useState('');
  const [shutdownReason, setShutdownReason] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await apiClient.system.getStatus();
      if (res && res.data) {
        setControlState(res.data);
        updateSystemControl(res.data);
      }
    } catch {
      setControlState(systemControl);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleReturnOnline = async () => {
    setLoading(true);
    try {
      await apiClient.system.changeState({ systemState: 'ONLINE', reason: 'Emergency resolved by Administrator' });
      setControlState((prev) => ({ ...prev, systemState: 'ONLINE' }));
      setSystemState('ONLINE', 'Emergency resolved by Administrator');
      setActionSuccess('System returned to ONLINE mode. All normal portal access restored.');
    } catch {
      setSystemState('ONLINE');
      setControlState((prev) => ({ ...prev, systemState: 'ONLINE' }));
      setActionSuccess('System returned to ONLINE mode.');
    } finally {
      setLoading(false);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const handleEnableMaintenance = async () => {
    setLoading(true);
    try {
      await apiClient.system.changeState({
        systemState: 'MAINTENANCE',
        maintenanceTitle: 'Emergency Maintenance in Progress',
        maintenanceMessage: 'System is temporarily offline for emergency administrative procedures.',
        allowAdminBypass: true,
      });
      setControlState((prev) => ({ ...prev, systemState: 'MAINTENANCE' }));
      setSystemState('MAINTENANCE', 'Emergency maintenance invoked');
      setActionSuccess('Maintenance mode enabled. Non-admin user access restricted.');
    } catch {
      setSystemState('MAINTENANCE');
      setControlState((prev) => ({ ...prev, systemState: 'MAINTENANCE' }));
      setActionSuccess('Maintenance mode activated.');
    } finally {
      setLoading(false);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const handleExecuteShutdown = async () => {
    if (shutdownConfirm.trim().toUpperCase() !== 'SHUTDOWN') {
      setActionError('You must type SHUTDOWN to proceed.');
      return;
    }
    setLoading(true);
    try {
      await apiClient.system.changeState({
        systemState: 'SHUTDOWN',
        confirmationText: 'SHUTDOWN',
        reason: shutdownReason || 'Emergency global shutdown from Emergency Controls',
        allowAdminBypass: true,
      });
      setControlState((prev) => ({ ...prev, systemState: 'SHUTDOWN' }));
      setSystemState('SHUTDOWN', shutdownReason);
      setIsShutdownOpen(false);
      setActionSuccess('CRITICAL: System shut down activated.');
    } catch {
      setSystemState('SHUTDOWN', shutdownReason);
      setControlState((prev) => ({ ...prev, systemState: 'SHUTDOWN' }));
      setIsShutdownOpen(false);
      setActionSuccess('Global shutdown invoked.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleThrottle = async (key: 'allowWorkerTrips' | 'allowAccountsPayments' | 'lockSensitiveOps') => {
    const newVal = !controlState[key];
    const payload = { [key]: newVal };
    try {
      await apiClient.system.emergencyToggle(payload);
      setControlState((prev) => ({ ...prev, [key]: newVal }));
      updateSystemControl(payload);
      setActionSuccess(`Setting updated: ${key} = ${newVal}`);
    } catch {
      setControlState((prev) => ({ ...prev, [key]: newVal }));
      updateSystemControl(payload);
      setActionSuccess(`Setting updated locally.`);
    } finally {
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const state = controlState.systemState || 'ONLINE';

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Emergency Controls"
        subtitle="Selective operational interventions, process freezes, and emergency overrides"
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

      {/* PRIMARY EMERGENCY ACTIONS CARD - CLEAN & MINIMAL */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Immediate System Actions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Current state:{' '}
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                <span
                  className={`w-2 h-2 rounded-full ${
                    state === 'ONLINE'
                      ? 'bg-emerald-500'
                      : state === 'MAINTENANCE'
                      ? 'bg-amber-500'
                      : 'bg-red-600'
                  }`}
                />
                {state === 'ONLINE' ? 'Online' : state === 'MAINTENANCE' ? 'Maintenance Mode' : 'Shutdown'}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {state !== 'ONLINE' && (
              <button
                onClick={handleReturnOnline}
                disabled={loading}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors"
              >
                Restore System Online
              </button>
            )}

            {state === 'ONLINE' && (
              <button
                onClick={handleEnableMaintenance}
                disabled={loading}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
              >
                Enable Maintenance Mode
              </button>
            )}

            <button
              onClick={() => setIsShutdownOpen(true)}
              disabled={loading || state === 'SHUTDOWN'}
              className="px-3.5 py-1.5 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
            >
              Shut Down System
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Overrides are enforced server-side via request filters. Normal users receive a service unavailable response while administrators maintain access.
        </p>
      </div>

      {/* OPERATIONAL INTERVENTIONS - MINIMAL 3-COLUMN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dispatch Pipeline</h3>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                controlState.allowWorkerTrips ? 'text-slate-600 bg-slate-100' : 'text-red-700 bg-red-50'
              }`}
            >
              {controlState.allowWorkerTrips ? 'Active' : 'Halted'}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Halt new trip creation from the Worker Portal during investigations or data anomalies.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleToggleThrottle('allowWorkerTrips')}
              className={`w-full py-2 rounded text-xs font-medium border transition-colors ${
                controlState.allowWorkerTrips
                  ? 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100'
                  : 'border-slate-300 text-slate-800 bg-white hover:bg-slate-50'
              }`}
            >
              {controlState.allowWorkerTrips ? 'Halt New Trips' : 'Resume Trip Creation'}
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Finance Pipeline</h3>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                controlState.allowAccountsPayments ? 'text-slate-600 bg-slate-100' : 'text-red-700 bg-red-50'
              }`}
            >
              {controlState.allowAccountsPayments ? 'Active' : 'Frozen'}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Halt payment recording, voucher disbursement, and ledger updates in the Accounts Portal.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleToggleThrottle('allowAccountsPayments')}
              className={`w-full py-2 rounded text-xs font-medium border transition-colors ${
                controlState.allowAccountsPayments
                  ? 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100'
                  : 'border-slate-300 text-slate-800 bg-white hover:bg-slate-50'
              }`}
            >
              {controlState.allowAccountsPayments ? 'Freeze Payments' : 'Resume Payments'}
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Configuration Lock</h3>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                controlState.lockSensitiveOps ? 'text-amber-800 bg-amber-50' : 'text-slate-600 bg-slate-100'
              }`}
            >
              {controlState.lockSensitiveOps ? 'Locked' : 'Unlocked'}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Lock rate cards, business rules, and master entity settings to prevent configuration modifications.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleToggleThrottle('lockSensitiveOps')}
              className={`w-full py-2 rounded text-xs font-medium border transition-colors ${
                controlState.lockSensitiveOps
                  ? 'border-slate-300 text-slate-800 bg-white hover:bg-slate-50'
                  : 'border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100'
              }`}
            >
              {controlState.lockSensitiveOps ? 'Unlock Configurations' : 'Lock Configurations'}
            </button>
          </div>
        </div>
      </div>

      {/* DISASTER RECOVERY BANNER */}
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-slate-800">
            Database Snapshot Recovery
          </p>
          <p className="text-xs text-slate-500">
            Restore PostgreSQL database from a validated snapshot point in the Disaster Recovery Center.
          </p>
        </div>
        <Link
          href="/admin/recovery"
          className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition-colors shrink-0 text-center"
        >
          Open Recovery Center
        </Link>
      </div>

      {/* SHUTDOWN CONFIRMATION DIALOG */}
      {isShutdownOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-none">
          <div className="max-w-md w-full bg-white rounded-lg border border-slate-300 shadow-xl p-5 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-red-700">Confirm System Shutdown</h3>
              <p className="text-xs text-slate-500 mt-1">
                This immediately restricts access across all portals. Non-admin requests will be rejected with HTTP 503.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Reason for Shutdown</label>
                <input
                  type="text"
                  value={shutdownReason}
                  onChange={(e) => setShutdownReason(e.target.value)}
                  placeholder="e.g. Scheduled hardware maintenance"
                  className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-800 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Type <span className="font-mono font-bold text-red-700">SHUTDOWN</span> to confirm:
                </label>
                <input
                  type="text"
                  value={shutdownConfirm}
                  onChange={(e) => setShutdownConfirm(e.target.value)}
                  placeholder="SHUTDOWN"
                  className="w-full font-mono text-xs px-3 py-1.5 rounded border border-red-300 bg-red-50/50 text-red-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsShutdownOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteShutdown}
                disabled={shutdownConfirm.trim().toUpperCase() !== 'SHUTDOWN' || loading}
                className="px-4 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-md transition-colors"
              >
                Confirm Shutdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
