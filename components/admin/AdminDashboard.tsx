'use client';

import React from 'react';
import Link from 'next/link';
import { useTmsStore } from '../../lib/store';
import { DEMO_USERS } from '../../lib/auth';
import { PageHeader } from '../layout/PageHeader';
import { KpiCard } from '../ui/KpiCard';
import { StatusBadge } from '../ui/StatusBadge';
import { ClipboardList, Database, Lock, Settings, Shield, Upload, Users } from '../ui/Icons';

export function AdminDashboard() {
  const { auditLogs, customers, vehicles, drivers, workers, trips } = useTmsStore();

  const recentLogs = auditLogs.slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Admin System Control Center"
        description="Global system administration · User accounts, access control, audit governance, imports and configuration"
      >
        <Link href="/admin/imports" className="btn-secondary">
          <Upload size={15} />
          Excel Import Center
        </Link>
        <Link href="/admin/users" className="btn-primary">
          <Users size={15} />
          Manage Users
        </Link>
      </PageHeader>

      {/* SYSTEM HEALTH KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Provisioned Users"
          value={DEMO_USERS.length}
          note="Across 5 system roles"
        />
        <KpiCard
          label="Central Audit Records"
          value={auditLogs.length}
          note="Immutable journal entries"
        />
        <KpiCard
          label="Total Master Records"
          value={customers.length + vehicles.length + drivers.length + workers.length}
          note="Synchronized database records"
        />
        <KpiCard
          label="Total Operational Trips"
          value={trips.length}
          note="Dispatches in store"
        />
      </div>

      {/* ADMIN SHORTCUT PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Link
          href="/admin/users"
          className="p-5 bg-white rounded-lg border border-[#D9DBD6] hover:border-[#2F668F] transition-all shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-[#e8f1f5] text-[#2F668F] flex items-center justify-center mb-3">
              <Users size={18} />
            </div>
            <strong className="text-sm font-bold text-[#16425B] block">User & Staff Accounts</strong>
            <p className="text-xs text-[#5A6E7F] mt-1">
              Create, deactivate, reset access and assign portal scopes.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#2F668F] mt-4 block">Manage Access →</span>
        </Link>

        <Link
          href="/admin/audit"
          className="p-5 bg-white rounded-lg border border-[#D9DBD6] hover:border-[#2F668F] transition-all shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-[#e8f1f5] text-[#2F668F] flex items-center justify-center mb-3">
              <ClipboardList size={18} />
            </div>
            <strong className="text-sm font-bold text-[#16425B] block">Audit & Governance</strong>
            <p className="text-xs text-[#5A6E7F] mt-1">
              Detailed chronological history of all updates with before/after tracking.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#2F668F] mt-4 block">View Trail →</span>
        </Link>

        <Link
          href="/admin/imports"
          className="p-5 bg-white rounded-lg border border-[#D9DBD6] hover:border-[#2F668F] transition-all shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-[#e8f1f5] text-[#2F668F] flex items-center justify-center mb-3">
              <Upload size={18} />
            </div>
            <strong className="text-sm font-bold text-[#16425B] block">Excel Data Migration</strong>
            <p className="text-xs text-[#5A6E7F] mt-1">
              Upload legacy workbooks, map column headers, validate duplicates, and preview imports.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#2F668F] mt-4 block">Open Import Tool →</span>
        </Link>
      </div>

      {/* RECENT AUDIT LOG PREVIEW */}
      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#16425B]">Recent Central Audit Events</h2>
            <p className="text-xs text-[#5A6E7F]">System-wide changes across all portals</p>
          </div>
          <Link href="/admin/audit" className="text-xs font-semibold text-[#2F668F] hover:underline">
            View All ({auditLogs.length})
          </Link>
        </div>

        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Timestamp</th>
                <th>User / Operator</th>
                <th>Action</th>
                <th>Entity Target</th>
                <th>Description</th>
                <th>Previous Value</th>
                <th>New Value</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log) => (
                <tr key={log.id}>
                  <td className="font-bold text-[#2F668F]">{log.id}</td>
                  <td>{log.timestamp}</td>
                  <td>
                    <strong>{log.user}</strong>
                    <small className="block text-[#5A6E7F] font-normal">{log.userRole}</small>
                  </td>
                  <td>
                    <span className="px-2 py-0.5 rounded bg-[#f0f4f8] text-xs font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="font-semibold text-[#16425B]">{log.entity}</td>
                  <td className="text-xs text-[#16425B] max-w-xs">{log.description}</td>
                  <td className="text-xs text-[#5A6E7F] font-mono">{log.oldValue || '—'}</td>
                  <td className="text-xs text-emerald-800 font-bold font-mono">{log.newValue || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
