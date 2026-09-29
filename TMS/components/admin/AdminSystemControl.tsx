'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '../layout/PageHeader';
import { apiClient } from '../../lib/api';
import { useTmsStore } from '../../lib/store';
import { SystemControlState } from '../../types';
import { Check, RefreshCw, AlertTriangle } from '../ui/Icons';
import Link from 'next/link';

export function AdminSystemControl() {
  const { systemControl, updateSystemControl, setSystemState } = useTmsStore();
  const [controlState, setControlState] = useState<SystemControlState>(systemControl);
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Shutdown Dialog State
  const [isShutdownModalOpen, setIsShutdownModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [shutdownConfirmText, setShutdownConfirmText] = useState('');
  const [shutdownReason, setShutdownReason] = useState('');
  const [allowBypass, setAllowBypass] = useState(true);

  // Maintenance Config State
  const [maintTitle, setMaintTitle] = useState(systemControl.maintenanceTitle || 'System Maintenance');
  const [maintMsg, setMaintMsg] = useState(
    systemControl.maintenanceMessage || 'The system is undergoing scheduled maintenance. Please check back shortly.'
  );
  const [expectedRecovery, setExpectedRecovery] = useState(
    systemControl.expectedRecoveryTime ? systemControl.expectedRecoveryTime.slice(0, 16) : ''
  );

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await apiClient.system.getStatus();
      if (res && res.data) {
        setControlState(res.data);
        updateSystemControl(res.data);
        if (res.data.maintenanceTitle) setMaintTitle(res.data.maintenanceTitle);
        if (res.data.maintenanceMessage) setMaintMsg(res.data.maintenanceMessage);
        if (res.data.expectedRecoveryTime) setExpectedRecovery(res.data.expectedRecoveryTime.slice(0, 16));
      }
      const hRes = await apiClient.system.getHealth();
      if (hRes && hRes.data) {
        setHealthData(hRes.data);
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
    setActionError(null);
    try {
      const res = await apiClient.system.changeState({
        systemState: 'ONLINE',
        reason: 'Administrator returned system to ONLINE mode',
      });
      if (res && res.data) {
        setControlState(res.data);
        updateSystemControl(res.data);
      } else {
        setSystemState('ONLINE', 'Administrator returned system to ONLINE mode');
      }
      setActionSuccess('System returned to ONLINE mode. All portals are operational.');
    } catch {
      setSystemState('ONLINE', 'Administrator returned system to ONLINE mode');
      setActionSuccess('System returned to ONLINE mode locally.');
    } finally {
      setLoading(false);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const handleExecuteShutdown = async () => {
    if (shutdownConfirmText.trim().toUpperCase() !== 'SHUTDOWN') {
      setActionError('You must type SHUTDOWN to confirm system shutdown.');
      return;
    }

    setLoading(true);
    setActionError(null);
    try {
      const res = await apiClient.system.changeState({
        systemState: 'SHUTDOWN',
        confirmationText: 'SHUTDOWN',
        reason: shutdownReason || 'Emergency global system shutdown by Administrator',
        allowAdminBypass: allowBypass,
      });
      if (res && res.data) {
        setControlState(res.data);
        updateSystemControl(res.data);
      } else {
        setSystemState('SHUTDOWN', shutdownReason || 'Emergency global system shutdown by Administrator');
      }
      setIsShutdownModalOpen(false);
      setShutdownConfirmText('');
      setShutdownReason('');
      setActionSuccess('System shutdown activated. All non-admin access is restricted.');
    } catch {
      setSystemState('SHUTDOWN', shutdownReason);
      setIsShutdownModalOpen(false);
      setActionSuccess('System shutdown activated.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMaintenance = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await apiClient.system.changeState({
        systemState: 'MAINTENANCE',
        maintenanceTitle: maintTitle,
        maintenanceMessage: maintMsg,
        expectedRecoveryTime: expectedRecovery ? new Date(expectedRecovery).toISOString() : null,
        allowAdminBypass: true,
      });
      if (res && res.data) {
        setControlState(res.data);
        updateSystemControl(res.data);
      } else {
        updateSystemControl({
          systemState: 'MAINTENANCE',
          maintenanceTitle: maintTitle,
          maintenanceMessage: maintMsg,
          expectedRecoveryTime: expectedRecovery || null,
        });
      }
      setActionSuccess('Maintenance mode updated and broadcasted across user portals.');
    } catch {
      updateSystemControl({
        systemState: 'MAINTENANCE',
        maintenanceTitle: maintTitle,
        maintenanceMessage: maintMsg,
        expectedRecoveryTime: expectedRecovery || null,
      });
      setActionSuccess('Maintenance mode activated locally.');
    } finally {
      setLoading(false);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const handleToggleEmergency = async (key: 'allowWorkerTrips' | 'allowAccountsPayments' | 'lockSensitiveOps') => {
    const newVal = !controlState[key];
    const payload = { [key]: newVal };
    try {
      const res = await apiClient.system.emergencyToggle(payload);
      if (res && res.data) {
        setControlState(res.data);
        updateSystemControl(res.data);
      } else {
        updateSystemControl(payload);
        setControlState((prev) => ({ ...prev, [key]: newVal }));
      }
      setActionSuccess(`Setting updated: ${key} = ${newVal}`);
    } catch {
      updateSystemControl(payload);
      setControlState((prev) => ({ ...prev, [key]: newVal }));
      setActionSuccess(`Setting updated locally: ${key} = ${newVal}`);
    } finally {
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const state = controlState.systemState || 'ONLINE';

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="System Control"
        subtitle="Global application state, maintenance mode broadcast, and safe shutdown management"
        actions={
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
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

      {/* SYSTEM STATE BANNER - MINIMAL & CLEAN */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  state === 'ONLINE'
                    ? 'bg-emerald-500'
                    : state === 'MAINTENANCE'
                    ? 'bg-amber-500'
                    : 'bg-red-600'
                }`}
              />
              <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">System Status</span>
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              {state === 'ONLINE' && 'System is Online & Operational'}
              {state === 'MAINTENANCE' && 'System is in Maintenance Mode'}
              {state === 'SHUTDOWN' && 'System is Shut Down'}
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              {state === 'ONLINE' &&
                'All portals (Worker, Accounts, Manager, MD, Admin) are currently serving requests.'}
              {state === 'MAINTENANCE' &&
                `Non-admin users see maintenance notice: "${controlState.maintenanceTitle}". Admin bypass active.`}
              {state === 'SHUTDOWN' &&
                `Global shutdown active. Reason: ${controlState.shutdownReason || 'Administrative Shutdown'}. Normal requests return 503.`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {state === 'ONLINE' ? (
              <button
                onClick={() => setIsShutdownModalOpen(true)}
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <AlertTriangle size={14} className="text-red-600" />
                <span>Shut Down System</span>
              </button>
            ) : (
              <button
                onClick={() => setIsResumeModalOpen(true)}
                disabled={loading}
                className="px-4 py-2 rounded-md text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>Resume System</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PROMINENT SHUTDOWN ALERT BANNER */}
      {state === 'SHUTDOWN' && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-red-950/30 to-red-900/20 border-2 border-red-500/50 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                GLOBAL SYSTEM SHUTDOWN ACTIVE
              </span>
              <span className="text-xs text-red-600 font-mono font-semibold">HTTP 503 Enforced</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              The entire TMS application is functionally locked.
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              All non-admin users (Worker, Accounts, Manager, MD) are completely locked out from data operations and views. Backend rejection guarantees zero race-condition writes.
            </p>
            <div className="flex flex-wrap gap-4 text-[11px] text-slate-700 pt-1">
              <span><strong>Activated by:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-900">{controlState.shutdownBy || 'ADMIN'}</code></span>
              <span><strong>Timestamp:</strong> {controlState.shutdownAt ? new Date(controlState.shutdownAt).toLocaleString('en-IN') : 'Recently'}</span>
              <span><strong>Reason:</strong> {controlState.shutdownReason || 'Emergency Maintenance'}</span>
            </div>
          </div>
          <button
            onClick={() => setIsResumeModalOpen(true)}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all shrink-0 flex items-center gap-2"
          >
            <Check size={16} />
            <span>Resume System</span>
          </button>
        </div>
      )}

      {/* METRICS ROW - MINIMAL */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-slate-500 font-medium">Environment</p>
          <p className="text-sm font-semibold text-slate-900 mt-1">Production</p>
          <p className="text-[11px] text-slate-400 mt-0.5">PostgreSQL 18 · Spring Boot</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-slate-500 font-medium">Version</p>
          <p className="text-sm font-semibold text-slate-900 mt-1">v1.0.0 Enterprise</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Control Center Build</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-slate-500 font-medium">Database Pool</p>
          <p className="text-sm font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{healthData?.databaseStatus || 'ONLINE'}</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">HikariCP active</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-slate-500 font-medium">Admin Bypass</p>
          <p className="text-sm font-semibold text-slate-900 mt-1">
            {controlState.allowAdminBypass ? 'Permitted' : 'Disabled'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Emergency Recovery</p>
        </div>
      </div>

      {/* TWO COLUMN: MAINTENANCE MODE & OPERATIONAL THROTTLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MAINTENANCE MODE CONFIGURATION */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Maintenance Broadcast
            </h3>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                state === 'MAINTENANCE' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {state === 'MAINTENANCE' ? 'Active' : 'Inactive'}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Displays an official announcement to normal users on non-admin portals while allowing administrators to maintain access.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Maintenance Title</label>
              <input
                type="text"
                value={maintTitle}
                onChange={(e) => setMaintTitle(e.target.value)}
                placeholder="e.g. Scheduled Platform Maintenance"
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Notice to Users</label>
              <textarea
                rows={3}
                value={maintMsg}
                onChange={(e) => setMaintMsg(e.target.value)}
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Expected Recovery (Optional)</label>
              <input
                type="datetime-local"
                value={expectedRecovery}
                onChange={(e) => setExpectedRecovery(e.target.value)}
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-500"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            {state === 'MAINTENANCE' ? (
              <button
                onClick={handleReturnOnline}
                disabled={loading}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
              >
                Disable Maintenance & Return Online
              </button>
            ) : (
              <button
                onClick={handleSaveMaintenance}
                disabled={loading}
                className="px-3.5 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-md transition-colors"
              >
                Enable Maintenance Mode
              </button>
            )}

            <button
              onClick={handleSaveMaintenance}
              disabled={loading}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              Update Notice
            </button>
          </div>
        </div>

        {/* OPERATIONAL THROTTLES */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Operational Throttles
            </h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Selectively halt specific operations without shutting down the entire platform.
          </p>

          <div className="space-y-3 pt-1 text-xs">
            <div className="p-3 rounded border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Worker Trip Creation</p>
                <p className="text-[11px] text-slate-500">Allow or halt new trips submitted from field</p>
              </div>
              <button
                onClick={() => handleToggleEmergency('allowWorkerTrips')}
                className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                  controlState.allowWorkerTrips
                    ? 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                    : 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100'
                }`}
              >
                {controlState.allowWorkerTrips ? 'Active' : 'Halted'}
              </button>
            </div>

            <div className="p-3 rounded border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Accounts Payments & Advances</p>
                <p className="text-[11px] text-slate-500">Allow or freeze disbursement vouchers</p>
              </div>
              <button
                onClick={() => handleToggleEmergency('allowAccountsPayments')}
                className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                  controlState.allowAccountsPayments
                    ? 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                    : 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100'
                }`}
              >
                {controlState.allowAccountsPayments ? 'Active' : 'Frozen'}
              </button>
            </div>

            <div className="p-3 rounded border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Configuration Changes</p>
                <p className="text-[11px] text-slate-500">Lock rate cards and financial parameters</p>
              </div>
              <button
                onClick={() => handleToggleEmergency('lockSensitiveOps')}
                className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                  controlState.lockSensitiveOps
                    ? 'border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100'
                    : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                }`}
              >
                {controlState.lockSensitiveOps ? 'Locked' : 'Unlocked'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SHUTDOWN MODAL */}
      {isShutdownModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-none">
          <div className="max-w-md w-full bg-white rounded-lg border border-slate-300 shadow-xl p-5 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-red-700">Confirm System Shutdown</h3>
              <p className="text-xs text-slate-500 mt-1">
                Restricts all user traffic across portals with HTTP 503 responses.
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
                  value={shutdownConfirmText}
                  onChange={(e) => setShutdownConfirmText(e.target.value)}
                  placeholder="SHUTDOWN"
                  className="w-full font-mono text-xs px-3 py-1.5 rounded border border-red-300 bg-red-50/50 text-red-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsShutdownModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteShutdown}
                disabled={shutdownConfirmText.trim().toUpperCase() !== 'SHUTDOWN' || loading}
                className="px-4 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-md transition-colors"
              >
                Confirm Shutdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESUME SYSTEM CONFIRMATION MODAL */}
      {isResumeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white rounded-xl border border-slate-300 shadow-2xl p-6 space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Resume System</h3>
                <p className="text-xs text-slate-500">Restore global SaaS operations</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs leading-relaxed space-y-2">
              <p className="font-bold text-sm text-emerald-900">
                Resume the entire SaaS system?
              </p>
              <p className="text-emerald-800">
                This will restore access to Worker, Accounts, Manager, and MD portals. Normal operations, trips, payments, rate cards, and financial transactions will immediately be allowed again.
              </p>
            </div>

            <div className="p-3 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Current State:</span>
                <span className="font-mono font-bold text-red-600">SHUTDOWN</span>
              </div>
              <div className="flex justify-between">
                <span>New State:</span>
                <span className="font-mono font-bold text-emerald-600">ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span>Audit Action:</span>
                <span className="font-mono text-slate-700">SYSTEM_RESUMED</span>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResumeModalOpen(false)}
                disabled={loading}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsResumeModalOpen(false);
                  await handleReturnOnline();
                }}
                disabled={loading}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>Confirm & Resume System</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
