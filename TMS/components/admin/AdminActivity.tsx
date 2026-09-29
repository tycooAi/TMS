'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from '../layout/PageHeader';
import { useTmsStore } from '../../lib/store';
import {
  Activity,
  ClipboardList,
  Search,
  Filter,
  Users,
  Shield,
  Truck,
  FileText,
  DollarSign,
  Layers,
  CheckCircle,
} from '../ui/Icons';

export function AdminActivity() {
  const { auditLogs } = useTmsStore();
  const [actorFilter, setActorFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const activities = useMemo(() => {
    return auditLogs.map((log, idx) => ({
      id: log.id || `ACT-${idx + 1}`,
      timestamp: log.timestamp || new Date().toISOString(),
      user: log.user || 'System Operator',
      userRole: log.userRole || 'ADMIN',
      action: log.action || 'UPDATE',
      entity: log.entity || 'System',
      entityId: log.entityId || 'SYS-001',
      description: log.description || 'System mutation executed',
      oldValue: log.oldValue,
      newValue: log.newValue,
    }));
  }, [auditLogs]);

  const actors = useMemo(() => {
    const set = new Set<string>();
    activities.forEach((a) => set.add(a.user));
    return Array.from(set);
  }, [activities]);

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (actorFilter !== 'ALL' && a.user !== actorFilter) return false;
      if (actionFilter !== 'ALL' && a.action !== actionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          a.description.toLowerCase().includes(q) ||
          a.entity.toLowerCase().includes(q) ||
          a.entityId.toLowerCase().includes(q) ||
          a.user.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [activities, actorFilter, actionFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Activity Logs & Operator Timeline"
        description="Chronological event stream tracking user sessions, dispatches, financial posts, and configurations"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f1f5] text-[#16425B] text-xs font-mono font-bold rounded-md border border-[#81C4D7]/40">
          <Activity size={14} className="text-[#2F668F]" />
          Timeline Live ({activities.length} Events)
        </span>
      </PageHeader>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-[#D9DBD6] shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8da3b5]" />
          <input
            type="text"
            placeholder="Search activity description, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tms-input pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="text-xs font-semibold bg-white border border-[#D9DBD6] rounded-lg px-2.5 py-1.5 text-[#16425B] focus:outline-none"
          >
            <option value="ALL">All Operators</option>
            {actors.map((actor) => (
              <option key={actor} value={actor}>
                {actor}
              </option>
            ))}
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs font-semibold bg-white border border-[#D9DBD6] rounded-lg px-2.5 py-1.5 text-[#16425B] focus:outline-none"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="APPROVE">APPROVE</option>
            <option value="PAYMENT">PAYMENT</option>
          </select>
        </div>
      </div>

      {/* ACTIVITY TIMELINE STREAM */}
      <div className="bg-white rounded-xl border border-[#D9DBD6] p-6 shadow-sm">
        <div className="relative border-l-2 border-[#D9DBD6] ml-4 space-y-6">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No activity events match your filter.</div>
          ) : (
            filtered.map((act) => {
              const roleBadge =
                act.userRole === 'ADMIN'
                  ? 'bg-purple-100 text-purple-800'
                  : act.userRole === 'MD'
                  ? 'bg-amber-100 text-amber-800'
                  : act.userRole === 'MANAGER'
                  ? 'bg-indigo-100 text-indigo-800'
                  : act.userRole === 'ACCOUNTS'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800';

              return (
                <div key={act.id} className="relative pl-6">
                  {/* Dot */}
                  <div className="absolute -left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-[#2F668F] border-2 border-white shadow-sm" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-bold text-[#16425B]">{act.user}</strong>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${roleBadge}`}>
                        {act.userRole}
                      </span>
                      <span className="text-[11px] font-bold text-[#2F668F] uppercase">{act.action}</span>
                      <span className="text-xs font-mono text-gray-500">[{act.entity} · {act.entityId}]</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {new Date(act.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-[#5A6E7F] leading-relaxed">{act.description}</p>
                  {(act.oldValue || act.newValue) && (
                    <div className="mt-2 p-2 bg-[#f8fafc] rounded border border-[#e2e8f0] font-mono text-[11px] text-[#334155]">
                      {act.oldValue && <div>Old: {act.oldValue}</div>}
                      {act.newValue && <div>New: {act.newValue}</div>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
