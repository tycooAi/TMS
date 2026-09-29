'use client';

import React, { useState } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Search, Shield, Filter } from '../ui/Icons';
import { AuditLog } from '../../types';

interface AuditTrailsViewProps {
  portalTitle: string;
  portalDescription: string;
  scope?: 'MANAGER' | 'MD' | 'CENTRAL';
}

export function AuditTrailsView({
  portalTitle,
  portalDescription,
  scope = 'CENTRAL',
}: AuditTrailsViewProps) {
  const { auditLogs } = useTmsStore();
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const filteredLogs = auditLogs.filter((l) => {
    // Role / scope based filtering if Manager
    if (scope === 'MANAGER') {
      // Exclude internal super-admin user permission grants if needed, keep operational & financial logs relevant to Manager
    }

    const q = query.trim().toLowerCase();
    const matchQ =
      !q ||
      l.id.toLowerCase().includes(q) ||
      l.user.toLowerCase().includes(q) ||
      l.entity.toLowerCase().includes(q) ||
      l.entityId.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      (l.reason && l.reason.toLowerCase().includes(q));

    const matchAction = actionFilter === 'ALL' || l.action === actionFilter;
    const matchEntity = entityFilter === 'ALL' || l.entity === entityFilter;

    return matchQ && matchAction && matchEntity;
  });

  const uniqueEntities = Array.from(new Set(auditLogs.map((l) => l.entity))).filter(Boolean);

  return (
    <div>
      <PageHeader
        title={portalTitle}
        description={portalDescription}
      />

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-lg border border-[#D9DBD6] mb-6 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-[#5A6E7F]" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID, user, entity, reason..."
            className="tms-input pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-[#16425B] whitespace-nowrap">Entity:</label>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="tms-input w-36 text-xs h-8"
            >
              <option value="ALL">All Entities</option>
              {uniqueEntities.map((ent) => (
                <option key={ent} value={ent}>
                  {ent}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-[#16425B] whitespace-nowrap">Action:</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="tms-input w-36 text-xs h-8"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="STATUS_CHANGE">STATUS_CHANGE</option>
              <option value="APPROVE">APPROVE</option>
              <option value="REJECT">REJECT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-[#16425B] uppercase tracking-wide">
            Immutable Audit Trail Log ({filteredLogs.length} events)
          </span>
          <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 font-semibold flex items-center gap-1">
            <Shield size={12} />
            Read-Only Immutable Store
          </span>
        </div>

        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>Audit ID</th>
                <th>Date & Time</th>
                <th>User / Operator</th>
                <th>Action</th>
                <th>Entity Type</th>
                <th>Record ID</th>
                <th>Previous Value</th>
                <th>New Value</th>
                <th>Reason / Business Note</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="font-mono font-bold text-[#2F668F] text-xs">{log.id}</td>
                  <td className="text-xs text-[#5A6E7F] whitespace-nowrap">{log.timestamp}</td>
                  <td>
                    <strong className="text-xs text-[#16425B] block">{log.user}</strong>
                    <span className="text-[10px] text-[#2F668F] font-semibold">{log.userRole}</span>
                  </td>
                  <td>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        log.action === 'APPROVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.action === 'REJECT'
                          ? 'bg-red-100 text-red-800'
                          : log.action === 'CREATE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-[#f0f4f8] text-[#16425B]'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span className="font-bold text-xs text-[#16425B]">{log.entity}</span>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-[#5A6E7F]">{log.entityId}</span>
                  </td>
                  <td className="text-xs font-mono text-[#5A6E7F] max-w-xs truncate">
                    {log.oldValue || '—'}
                  </td>
                  <td className="text-xs font-mono text-[#16425B] max-w-xs truncate">
                    {log.newValue ? (
                      <span className="font-semibold text-emerald-700">{log.newValue}</span>
                    ) : (
                      log.description || '—'
                    )}
                  </td>
                  <td className="text-xs text-[#5A6E7F] max-w-xs truncate">
                    {log.reason || log.description || 'System recorded'}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-xs text-[#5A6E7F]">
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
