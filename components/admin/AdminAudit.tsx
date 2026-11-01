'use client';

import React, { useState } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Search } from '../ui/Icons';

export function AdminAudit() {
  const { auditLogs } = useTmsStore();
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = auditLogs.filter((l) => {
    const q = query.trim().toLowerCase();
    const matchQ =
      !q ||
      l.id.toLowerCase().includes(q) ||
      l.user.toLowerCase().includes(q) ||
      l.entity.toLowerCase().includes(q) ||
      l.entityId.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q);

    const matchAction = actionFilter === 'ALL' || l.action === actionFilter;
    return matchQ && matchAction;
  });

  return (
    <div>
      <PageHeader
        title="Central Audit Trail & Governance Journal"
        description="Immutable chronological record of business events · Who, When, What changed, Old value, New value and Business rationale"
      />

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-lg border border-[#D9DBD6] mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-[#5A6E7F]" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search audit trail, user, entity, description..."
            className="tms-input pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-[#16425B] whitespace-nowrap">Filter Action:</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="tms-input w-40"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="STATUS_CHANGE">Status Change</option>
            <option value="APPROVE">Approve</option>
            <option value="REJECT">Reject</option>
            <option value="DELETE">Delete</option>
          </select>
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5 shadow-sm">
        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>Audit ID</th>
                <th>Timestamp</th>
                <th>User / Operator</th>
                <th>Action</th>
                <th>Entity Target</th>
                <th>Description</th>
                <th>Previous Value</th>
                <th>New Value</th>
                <th>Reason / Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="font-bold text-[#2F668F]">{log.id}</td>
                  <td className="text-xs text-[#5A6E7F]">{log.timestamp}</td>
                  <td>
                    <strong className="text-xs text-[#16425B] block">{log.user}</strong>
                    <span className="text-[10px] text-[#2F668F] font-semibold">{log.userRole}</span>
                  </td>
                  <td>
                    <span className="px-2 py-0.5 rounded bg-[#f0f4f8] text-[11px] font-semibold text-[#16425B]">
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span className="font-bold text-xs">{log.entity}</span>
                    <small className="block text-[#5A6E7F] font-mono">{log.entityId}</small>
                  </td>
                  <td className="text-xs text-[#16425B] max-w-xs">{log.description}</td>
                  <td className="text-xs text-rose-800 font-mono bg-rose-50/50 p-1.5 rounded">
                    {log.oldValue || '—'}
                  </td>
                  <td className="text-xs text-emerald-800 font-mono bg-emerald-50/50 p-1.5 rounded font-bold">
                    {log.newValue || '—'}
                  </td>
                  <td className="text-xs text-[#5A6E7F] max-w-xs">{log.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
