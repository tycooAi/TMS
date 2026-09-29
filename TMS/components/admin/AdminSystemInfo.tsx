'use client';

import React from 'react';
import { PageHeader } from '../layout/PageHeader';
import {
  Server,
  Terminal,
  Database,
  Layers,
  Activity,
  CheckCircle,
  Shield,
} from '../ui/Icons';

export function AdminSystemInfo() {
  const envInfo = [
    { label: 'Application Name', value: 'TransFlow TMS - Sri Amman Arul Transports' },
    { label: 'System Architecture', value: 'Decoupled Next.js 15.5 + Spring Boot 3.3 REST Backend' },
    { label: 'Frontend Framework', value: 'Next.js 15.5.2 (React 19.1.1, Turbopack)' },
    { label: 'Backend Framework', value: 'Spring Boot 3.3.4 (Spring Framework 6.1.13)' },
    { label: 'Database Engine', value: 'PostgreSQL 18.6 (x64) via HikariCP' },
    { label: 'Database Schema', value: '17 Migrations via Flyway Database Tooling' },
    { label: 'Runtime Environment', value: 'Windows 11 (build 10.0 x64) / PowerShell 5.1' },
    { label: 'Java Virtual Machine', value: 'Java(TM) SE Runtime Environment (build 17.0.12+8-LTS-286)' },
    { label: 'Node.js Runtime', value: 'v24.11.1 (npm v11.7.0)' },
    { label: 'Default Timezone', value: 'Asia/Kolkata (IST +05:30)' },
    { label: 'Security Model', value: 'Stateless JWT Bearer HMAC-SHA256 (24-hour expiration)' },
    { label: 'Active Profile', value: 'default (development / localhost ports 3000 & 8080)' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="System Architecture & Runtime Information"
        description="Low-level environment telemetry, compilation details, JVM runtime, and database connection specifications"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-mono font-bold rounded-md border border-emerald-200">
          <CheckCircle size={14} className="text-emerald-600" />
          Environment: Active & Stable
        </span>
      </PageHeader>

      <div className="bg-white rounded-xl border border-[#D9DBD6] p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#16425B] uppercase tracking-wider mb-4 pb-2 border-b border-[#D9DBD6]">
          Runtime Environment & Framework Matrix
        </h3>

        <div className="divide-y divide-[#edf2f7]">
          {envInfo.map((item, idx) => (
            <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <span className="font-semibold text-[#5A6E7F]">{item.label}</span>
              <strong className="font-mono text-[#16425B]">{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#D9DBD6] shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-[#2F668F]">
            <Server size={18} />
            <h4 className="text-xs font-bold uppercase tracking-wider">Backend Gateway</h4>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Running on port <code>8080</code> with Spring Security, OpenAPI Swagger documentation enabled at <code>/swagger-ui/index.html</code>.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#D9DBD6] shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-indigo-700">
            <Database size={18} />
            <h4 className="text-xs font-bold uppercase tracking-wider">Relational Store</h4>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            PostgreSQL instance on port <code>5432</code> serving database <code>tms_db</code> with HikariCP connection pooling.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#D9DBD6] shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-emerald-700">
            <Terminal size={18} />
            <h4 className="text-xs font-bold uppercase tracking-wider">Frontend App</h4>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Next.js App Router serving at <code>http://localhost:3000</code> with client-side optimistic stores and synchronized API clients.
          </p>
        </div>
      </div>
    </div>
  );
}
