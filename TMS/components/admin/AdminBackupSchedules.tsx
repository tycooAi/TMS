'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '../layout/PageHeader';
import { apiClient } from '../../lib/api';
import { useTmsStore } from '../../lib/store';
import { BackupSchedule } from '../../types';
import { Check, AlertTriangle, RefreshCw } from '../ui/Icons';

export function AdminBackupSchedules() {
  const { backupSchedules, updateBackupSchedule: storeUpdateSchedule } = useTmsStore();
  const [schedules, setSchedules] = useState<BackupSchedule[]>(backupSchedules);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await apiClient.system.getBackupSchedules();
      if (res && res.data) {
        setSchedules(res.data);
      }
    } catch {
      setSchedules(backupSchedules);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleUpdate = async (id: string, updatedFields: Partial<BackupSchedule>) => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await apiClient.system.updateBackupSchedule(id, updatedFields);
      if (res && res.data) {
        setSchedules((prev) => prev.map((s) => (s.id === id ? res.data : s)));
      } else {
        storeUpdateSchedule(id, updatedFields);
        setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedFields } : s)));
      }
      setActionSuccess(`Schedule ${id} updated.`);
    } catch {
      storeUpdateSchedule(id, updatedFields);
      setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedFields } : s)));
      setActionSuccess(`Schedule ${id} updated locally.`);
    } finally {
      setLoading(false);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const weekly = schedules.find((s) => s.id === 'WEEKLY') || {
    id: 'WEEKLY',
    scheduleType: 'WEEKLY',
    enabled: true,
    dayOfWeek: 7,
    dayOfMonth: 1,
    executionTime: '02:00',
    retentionCount: 4,
    destination: 'LOCAL_SNAPSHOT_STORE',
  };

  const monthly = schedules.find((s) => s.id === 'MONTHLY') || {
    id: 'MONTHLY',
    scheduleType: 'MONTHLY',
    enabled: true,
    dayOfWeek: 7,
    dayOfMonth: 1,
    executionTime: '03:00',
    retentionCount: 12,
    destination: 'LOCAL_SNAPSHOT_STORE',
  };

  const daysOfWeek = [
    { val: 1, label: 'Monday' },
    { val: 2, label: 'Tuesday' },
    { val: 3, label: 'Wednesday' },
    { val: 4, label: 'Thursday' },
    { val: 5, label: 'Friday' },
    { val: 6, label: 'Saturday' },
    { val: 7, label: 'Sunday' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Backup Schedules & Retention"
        subtitle="Automated periodic snapshot policies and retention rules"
        actions={
          <button
            onClick={fetchSchedules}
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

      {/* POLICY NOTICE - MINIMAL */}
      <div className="border-l-2 border-slate-400 bg-slate-50/70 px-4 py-3 rounded-r-md text-xs text-slate-600 leading-relaxed">
        <span className="font-semibold text-slate-800">Retention Governance: </span>
        Retention defines how many historical snapshots are preserved before older versions are pruned.
        The database engine prevents pruning the sole remaining backup point under any circumstances.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WEEKLY SCHEDULE */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Weekly Routine Backup
            </h3>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                weekly.enabled ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {weekly.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">Weekly Backup Status</p>
                <p className="text-[11px] text-slate-500">Run automatic snapshot once per week</p>
              </div>
              <button
                onClick={() => handleUpdate('WEEKLY', { enabled: !weekly.enabled })}
                className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                  weekly.enabled
                    ? 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                    : 'border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                {weekly.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Execution Day</label>
              <select
                value={weekly.dayOfWeek}
                onChange={(e) => handleUpdate('WEEKLY', { dayOfWeek: parseInt(e.target.value) })}
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-500"
              >
                {daysOfWeek.map((d) => (
                  <option key={d.val} value={d.val}>
                    Every {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Execution Time (24h)</label>
              <input
                type="time"
                value={weekly.executionTime}
                onChange={(e) => handleUpdate('WEEKLY', { executionTime: e.target.value })}
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Retention Count (Snapshots)</label>
              <input
                type="number"
                min="1"
                max="52"
                value={weekly.retentionCount}
                onChange={(e) => handleUpdate('WEEKLY', { retentionCount: parseInt(e.target.value) || 1 })}
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Keeps the {weekly.retentionCount} most recent weekly snapshots</p>
            </div>
          </div>
        </div>

        {/* MONTHLY SCHEDULE */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Monthly Routine Backup
            </h3>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                monthly.enabled ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {monthly.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">Monthly Backup Status</p>
                <p className="text-[11px] text-slate-500">Run automatic snapshot once per month</p>
              </div>
              <button
                onClick={() => handleUpdate('MONTHLY', { enabled: !monthly.enabled })}
                className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                  monthly.enabled
                    ? 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                    : 'border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                {monthly.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Execution Day of Month</label>
              <select
                value={monthly.dayOfMonth}
                onChange={(e) => handleUpdate('MONTHLY', { dayOfMonth: parseInt(e.target.value) })}
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-500"
              >
                {[1, 5, 10, 15, 20, 25, 28].map((d) => (
                  <option key={d} value={d}>
                    Day {d} of each month
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Execution Time (24h)</label>
              <input
                type="time"
                value={monthly.executionTime}
                onChange={(e) => handleUpdate('MONTHLY', { executionTime: e.target.value })}
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Retention Count (Snapshots)</label>
              <input
                type="number"
                min="1"
                max="36"
                value={monthly.retentionCount}
                onChange={(e) => handleUpdate('MONTHLY', { retentionCount: parseInt(e.target.value) || 1 })}
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Keeps the {monthly.retentionCount} most recent monthly snapshots</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
