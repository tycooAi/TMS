'use client';

import React, { useState } from 'react';
import { PageHeader } from '../layout/PageHeader';
import {
  Database,
  Layers,
  Code,
  CheckCircle,
  Copy,
  Check,
  ChevronRight,
  Server,
  Terminal,
} from '../ui/Icons';

interface FlywayMigration {
  version: string;
  description: string;
  installedOn: string;
  executionTime: string;
  state: 'SUCCESS';
  type: 'SQL';
}

const MIGRATIONS: FlywayMigration[] = [
  { version: 'V1', description: 'Create security and RBAC tables', installedOn: '2026-09-22 15:13', executionTime: '112ms', state: 'SUCCESS', type: 'SQL' },
  { version: 'V2', description: 'Create master tables (Customers, Vehicles, Drivers, Sources, Materials)', installedOn: '2026-09-22 15:13', executionTime: '145ms', state: 'SUCCESS', type: 'SQL' },
  { version: 'V3', description: 'Create rate cards and pricing matrices', installedOn: '2026-09-22 15:13', executionTime: '88ms', state: 'SUCCESS', type: 'SQL' },
  { version: 'V4', description: 'Create trips core dispatch table', installedOn: '2026-09-22 15:13', executionTime: '130ms', state: 'SUCCESS', type: 'SQL' },
  { version: 'V5', description: 'Create invoices and invoice items', installedOn: '2026-09-22 15:13', executionTime: '95ms', state: 'SUCCESS', type: 'SQL' },
  { version: 'V6', description: 'Create payments and accounts', installedOn: '2026-09-22 15:13', executionTime: '110ms', state: 'SUCCESS', type: 'SQL' },
  { version: 'V7', description: 'Create ledgers and contra transactions', installedOn: '2026-09-22 15:13', executionTime: '82ms', state: 'SUCCESS', type: 'SQL' },
  { version: 'V8', description: 'Create diesel and maintenance logs', installedOn: '2026-09-22 15:13', executionTime: '98ms', state: 'SUCCESS', type: 'SQL' },
  { version: 'V9', description: 'Create driver and worker wages', installedOn: '2026-09-22 15:13', executionTime: '91ms', state: 'SUCCESS', type: 'SQL' },
  { version: 'V10', description: 'Create corrections and approval requests', installedOn: '2026-09-22 15:13', executionTime: '79ms', state: 'SUCCESS', type: 'SQL' },
  { version: 'V11', description: 'Create governance audit logs and company settings', installedOn: '2026-09-22 15:13', executionTime: '105ms', state: 'SUCCESS', type: 'SQL' },
  { version: 'V12', description: 'Insert initial seed data and RBAC permissions', installedOn: '2026-09-22 15:13', executionTime: '240ms', state: 'SUCCESS', type: 'SQL' },
  { version: 'V13', description: 'Allow direct invoice items allocation', installedOn: '2026-09-23 10:14', executionTime: '45ms', state: 'SUCCESS', type: 'SQL' },
  { version: 'V14', description: 'Relax customer address constraint', installedOn: '2026-09-24 11:20', executionTime: '38ms', state: 'SUCCESS', type: 'SQL' },
  { version: 'V15', description: 'Update branding to Sri Amman Arul Transports', installedOn: '2026-09-25 14:06', executionTime: '42ms', state: 'SUCCESS', type: 'SQL' },
  { version: 'V16', description: 'Add trip frozen transport and purchase rates', installedOn: '2026-09-25 14:06', executionTime: '56ms', state: 'SUCCESS', type: 'SQL' },
  { version: 'V17', description: 'Create global system control, backups, and feature flags', installedOn: '2026-09-29 07:57', executionTime: '82ms', state: 'SUCCESS', type: 'SQL' },
];

export function AdminSchema() {
  const [selectedMigration, setSelectedMigration] = useState<FlywayMigration>(MIGRATIONS[16]);
  const [copied, setCopied] = useState(false);

  const sampleDdl = `CREATE TABLE system_control (
    id INT PRIMARY KEY DEFAULT 1,
    system_state VARCHAR(32) NOT NULL DEFAULT 'ONLINE',
    maintenance_title VARCHAR(255) DEFAULT 'System Maintenance',
    maintenance_message TEXT,
    expected_recovery_time TIMESTAMP,
    shutdown_reason TEXT,
    shutdown_by VARCHAR(128),
    shutdown_at TIMESTAMP,
    allow_admin_bypass BOOLEAN DEFAULT TRUE,
    allow_worker_trips BOOLEAN DEFAULT TRUE,
    allow_accounts_payments BOOLEAN DEFAULT TRUE,
    lock_sensitive_ops BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(128) DEFAULT 'SYSTEM'
);

CREATE TABLE backup_records (
    id VARCHAR(64) PRIMARY KEY,
    backup_name VARCHAR(255) NOT NULL,
    backup_type VARCHAR(32) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    checksum_sha256 VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
    entity_counts_json TEXT,
    created_by VARCHAR(128) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    restored_at TIMESTAMP,
    notes TEXT
);

CREATE INDEX idx_backup_created ON backup_records(created_at DESC);`;

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="PostgreSQL Database Schema & Flyway History"
        description="Inspect relational schema DDL, migration versioning ledger, primary key indexes, and foreign constraints"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-mono font-bold rounded-md border border-emerald-200">
          <CheckCircle size={14} className="text-emerald-600" />
          Flyway Current: Schema v17
        </span>
      </PageHeader>

      {/* METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#D9DBD6] shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A6E7F] block">Database Engine</span>
          <strong className="text-base font-black text-[#16425B] mt-1 block">PostgreSQL 18.6</strong>
          <span className="text-[11px] text-[#5A6E7F]">Port 5432 · tms_db</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#D9DBD6] shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A6E7F] block">Schema Migrations</span>
          <strong className="text-base font-black text-[#2F668F] mt-1 block font-mono">17 Applied</strong>
          <span className="text-[11px] text-[#5A6E7F]">All validated cleanly</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#D9DBD6] shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A6E7F] block">Table Entities</span>
          <strong className="text-base font-black text-indigo-700 mt-1 block font-mono">25 Tables</strong>
          <span className="text-[11px] text-[#5A6E7F]">Public schema</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[#D9DBD6] shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A6E7F] block">JPA Hibernate State</span>
          <strong className="text-base font-black text-emerald-700 mt-1 block">ddl-auto: validate</strong>
          <span className="text-[11px] text-[#5A6E7F]">Strict zero drift</span>
        </div>
      </div>

      {/* FLYWAY MIGRATION HISTORY TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#D9DBD6] shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-[#f8fafc] border-b border-[#D9DBD6] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#16425B]">Flyway Migration Ledger</span>
            <span className="text-[11px] font-mono text-[#5A6E7F]">flyway_schema_history</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] border-b text-gray-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Ver</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Execution</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {MIGRATIONS.map((m) => {
                  const isSelected = selectedMigration.version === m.version;
                  return (
                    <tr
                      key={m.version}
                      onClick={() => setSelectedMigration(m)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/70 font-bold' : ''
                      }`}
                    >
                      <td className="p-3 text-[#2F668F] font-bold">{m.version}</td>
                      <td className="p-3 font-sans text-gray-800">{m.description}</td>
                      <td className="p-3 text-gray-500">{m.executionTime}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {m.state}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* MIGRATION DETAIL / DDL INSPECTOR (RIGHT 5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#111827] text-white rounded-xl border border-[#374151] p-5 shadow-lg space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#374151]">
              <div className="flex items-center gap-2">
                <Code size={16} className="text-cyan-400" />
                <span className="font-bold text-gray-200">
                  {selectedMigration.version}__migration.sql
                </span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sampleDdl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-gray-400 hover:text-white p-1"
                title="Copy DDL"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>

            <div className="text-gray-400 text-[11px] space-y-1">
              <div>Description: <span className="text-gray-200">{selectedMigration.description}</span></div>
              <div>Installed On: <span className="text-gray-200">{selectedMigration.installedOn}</span></div>
              <div>Execution Time: <span className="text-emerald-400">{selectedMigration.executionTime}</span></div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">SQL DDL Definition</span>
              <pre className="p-3 bg-[#030712] rounded-lg text-emerald-400 text-[11px] overflow-x-auto leading-relaxed border border-[#1f2937]">
                {sampleDdl}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
