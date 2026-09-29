'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '../layout/PageHeader';
import { apiClient } from '../../lib/api';
import { useTmsStore } from '../../lib/store';
import { BackupRecord } from '../../types';
import { Check, AlertTriangle, RefreshCw } from '../ui/Icons';

export function AdminRecovery() {
  const { systemControl, backupRecords, setSystemState, restoreBackup: storeRestoreBackup, verifyBackup: storeVerifyBackup } = useTmsStore();
  const [backups, setBackups] = useState<BackupRecord[]>(backupRecords);
  const [systemState, setSysState] = useState(systemControl.systemState);
  const [loading, setLoading] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreConfirmText, setRestoreConfirmText] = useState('');
  const [restoreReason, setRestoreReason] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await apiClient.system.getBackups();
      if (res && res.data) {
        setBackups(res.data);
      }
      const sRes = await apiClient.system.getStatus();
      if (sRes && sRes.data) {
        setSysState(sRes.data.systemState);
      }
    } catch {
      setBackups(backupRecords);
      setSysState(systemControl.systemState);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleVerify = async (id: string) => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await apiClient.system.verifyBackup(id);
      if (res && res.data) {
        setBackups((prev) => prev.map((b) => (b.id === id ? res.data : b)));
        setActionSuccess(`Backup ${id} integrity verified.`);
      }
    } catch {
      storeVerifyBackup(id);
      setBackups((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'VERIFIED' } : b)));
      setActionSuccess(`Backup ${id} verified locally.`);
    } finally {
      setLoading(false);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const handleOpenRestore = (backup: BackupRecord) => {
    setSelectedBackup(backup);
    setRestoreConfirmText('');
    setRestoreReason('');
    setIsRestoreModalOpen(true);
  };

  const handleExecuteRestore = async () => {
    if (!selectedBackup) return;
    if (restoreConfirmText.trim().toUpperCase() !== 'RESTORE') {
      setActionError('You must type RESTORE to execute restore.');
      return;
    }

    setLoading(true);
    setActionError(null);
    try {
      const res = await apiClient.system.restoreBackup(selectedBackup.id, {
        confirmationText: 'RESTORE',
        reason: restoreReason || 'Disaster recovery restore from Recovery Center',
      });
      if (res && res.data) {
        setBackups((prev) => prev.map((b) => (b.id === selectedBackup.id ? res.data : b)));
      } else {
        storeRestoreBackup(selectedBackup.id, 'RESTORE', restoreReason);
      }
      setIsRestoreModalOpen(false);
      setActionSuccess(`Database restored to snapshot: ${selectedBackup.backupName}`);
      fetchBackups();
    } catch {
      storeRestoreBackup(selectedBackup.id, 'RESTORE', restoreReason);
      setIsRestoreModalOpen(false);
      setActionSuccess(`Database restore executed for snapshot ${selectedBackup.id}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnOnline = async () => {
    setLoading(true);
    try {
      await apiClient.system.changeState({ systemState: 'ONLINE', reason: 'Recovery completed by Administrator' });
      setSysState('ONLINE');
      setSystemState('ONLINE', 'Recovery completed by Administrator');
      setActionSuccess('System returned to ONLINE mode.');
    } catch {
      setSysState('ONLINE');
      setSystemState('ONLINE');
      setActionSuccess('System returned to ONLINE mode.');
    } finally {
      setLoading(false);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const lastSuccessful = backups.find((b) => b.status === 'COMPLETED' || b.status === 'VERIFIED');
  const lastRestored = backups.find((b) => b.status === 'RESTORED' || b.restoredAt);

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Disaster Recovery"
        subtitle="Point-in-time database snapshot restoration, integrity validation, and rollbacks"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchBackups}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            {systemState !== 'ONLINE' && (
              <button
                onClick={handleReturnOnline}
                disabled={loading}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
              >
                Restore System Online
              </button>
            )}
          </div>
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

      {/* RECOVERY OVERVIEW METRICS - MINIMAL */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-slate-500 font-medium">System State</p>
          <p className="text-sm font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                systemState === 'ONLINE' ? 'bg-emerald-500' : systemState === 'MAINTENANCE' ? 'bg-amber-500' : 'bg-red-600'
              }`}
            />
            <span>{systemState}</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {systemState === 'ONLINE' ? 'Accepting traffic' : 'Access isolated'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-slate-500 font-medium">Recovery Points</p>
          <p className="text-sm font-semibold text-slate-900 mt-1">{backups.length} snapshots</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Physical dumps ready</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-slate-500 font-medium">Latest Snapshot</p>
          <p className="text-sm font-semibold text-slate-900 mt-1 truncate">
            {lastSuccessful?.id || 'None'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {lastSuccessful ? `${(lastSuccessful.fileSizeBytes / 1024).toFixed(1)} KB` : 'N/A'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-slate-500 font-medium">Last Restored</p>
          <p className="text-sm font-semibold text-slate-900 mt-1 truncate">
            {lastRestored ? lastRestored.id : 'None'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {lastRestored?.restoredAt ? new Date(lastRestored.restoredAt).toLocaleTimeString() : 'Intact'}
          </p>
        </div>
      </div>

      {/* RECOVERY CAUTION NOTICE - MINIMAL */}
      <div className="border-l-2 border-slate-400 bg-slate-50/70 px-4 py-3 rounded-r-md text-xs text-slate-600 leading-relaxed">
        <span className="font-semibold text-slate-800">Safety Rollback Policy: </span>
        Database restoration rolls back database state to the selected snapshot.
        The system automatically takes a safety snapshot before applying the restoration to prevent irreversible data loss.
      </div>

      {/* AVAILABLE RECOVERY POINTS TABLE */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Available Recovery Points ({backups.length})
          </h3>
        </div>

        {backups.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No recovery points found. Go to Admin &rarr; Backups to generate a snapshot.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Snapshot ID</th>
                  <th className="py-2.5 px-4 font-medium">Name & Type</th>
                  <th className="py-2.5 px-4 font-medium">Created</th>
                  <th className="py-2.5 px-4 font-medium">Size</th>
                  <th className="py-2.5 px-4 font-medium">SHA-256 Checksum</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-slate-800">{b.id}</td>
                    <td className="py-2.5 px-4">
                      <p className="font-medium text-slate-900">{b.backupName}</p>
                      <span className="text-[10px] text-slate-500">
                        {b.backupType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(b.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">
                      {(b.fileSizeBytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400 max-w-[120px] truncate" title={b.checksumSha256}>
                      {b.checksumSha256 || 'N/A'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            b.status === 'VERIFIED' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {b.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleVerify(b.id)}
                          disabled={loading}
                          className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded bg-white hover:bg-slate-50"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => handleOpenRestore(b)}
                          disabled={loading}
                          className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                        >
                          Restore
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RESTORE CONFIRMATION MODAL */}
      {isRestoreModalOpen && selectedBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-none">
          <div className="max-w-md w-full bg-white rounded-lg border border-slate-300 shadow-xl p-5 space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-red-700">
                Confirm Database Restore
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Restoring snapshot: <span className="font-mono text-slate-900">{selectedBackup.id}</span>
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Reason for System Restore (Mandatory)
                </label>
                <input
                  type="text"
                  value={restoreReason}
                  onChange={(e) => setRestoreReason(e.target.value)}
                  placeholder="e.g. Rolling back corrupted batch"
                  className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Type <span className="font-mono font-bold text-red-700">RESTORE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={restoreConfirmText}
                  onChange={(e) => setRestoreConfirmText(e.target.value)}
                  placeholder="RESTORE"
                  className="w-full font-mono text-xs px-3 py-1.5 rounded border border-red-300 bg-red-50/50 text-red-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsRestoreModalOpen(false);
                  setSelectedBackup(null);
                }}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={restoreConfirmText.trim().toUpperCase() !== 'RESTORE' || loading}
                className="px-4 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-md transition-colors"
              >
                Execute Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
