'use client';

import React from 'react';
import { PageHeader } from '../layout/PageHeader';
import { Check, X } from '../ui/Icons';
import { UserRole } from '../../types';

interface RoleCapability {
  capability: string;
  description: string;
  worker: boolean;
  accounts: boolean;
  manager: boolean;
  md: boolean;
  admin: boolean;
}

const CAPABILITIES: RoleCapability[] = [
  {
    capability: 'Operational Trip Dispatch & Status',
    description: 'Create trips, advance operational status (Submitted, Loaded, Running, Delivered)',
    worker: true,
    accounts: false,
    manager: true,
    md: true,
    admin: true,
  },
  {
    capability: 'View Commercial Financial Figures',
    description: 'Inspect rates, revenue, customer balances, receivables, and invoices',
    worker: false,
    accounts: true,
    manager: false,
    md: true,
    admin: true,
  },
  {
    capability: 'Customer Payment & Receivable Posting',
    description: 'Post customer receipts, allocate across invoices, credit adjustments',
    worker: false,
    accounts: true,
    manager: false,
    md: false,
    admin: true,
  },
  {
    capability: 'Commercial Tax Invoice Generation',
    description: 'Consolidate delivered trips into invoices and calculate GST',
    worker: false,
    accounts: true,
    manager: false,
    md: true,
    admin: true,
  },
  {
    capability: 'Quarry & Commercial Rate Configuration',
    description: 'Configure crusher prices per ton and customer route rates',
    worker: false,
    accounts: false,
    manager: true,
    md: true,
    admin: true,
  },
  {
    capability: 'Approve Financial Corrections',
    description: 'Authorize amendment requests for posted financial transactions',
    worker: false,
    accounts: false,
    manager: false,
    md: true,
    admin: true,
  },
  {
    capability: 'Manage Fleet Assets & Drivers',
    description: 'Add and edit vehicles, driver licensing, and master rosters',
    worker: false,
    accounts: false,
    manager: true,
    md: true,
    admin: true,
  },
  {
    capability: 'Manage User Accounts & Roles',
    description: 'Provision credentials, reset access, and modify system settings',
    worker: false,
    accounts: false,
    manager: false,
    md: false,
    admin: true,
  },
  {
    capability: 'Excel Data Migration & Bulk Imports',
    description: 'Upload legacy workbooks and execute master data migration',
    worker: false,
    accounts: false,
    manager: false,
    md: false,
    admin: true,
  },
];

export function AdminRoles() {
  return (
    <div>
      <PageHeader
        title="Role-Based Access Control (RBAC) Matrix"
        description="Central authorization matrix · Enforces strict segregation of duties between operational and financial portals"
      />

      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5 shadow-sm">
        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>System Capability / Functional Area</th>
                <th className="text-center">Worker</th>
                <th className="text-center">Accounts</th>
                <th className="text-center">Manager</th>
                <th className="text-center">MD</th>
                <th className="text-center">Admin</th>
              </tr>
            </thead>
            <tbody>
              {CAPABILITIES.map((cap, idx) => (
                <tr key={idx}>
                  <td>
                    <strong className="text-xs font-bold text-[#16425B] block">{cap.capability}</strong>
                    <span className="text-[11px] text-[#5A6E7F]">{cap.description}</span>
                  </td>
                  <td className="text-center">
                    {cap.worker ? (
                      <span className="inline-flex text-emerald-600 bg-emerald-50 p-1 rounded">
                        <Check size={16} />
                      </span>
                    ) : (
                      <span className="inline-flex text-slate-300">
                        <X size={16} />
                      </span>
                    )}
                  </td>
                  <td className="text-center">
                    {cap.accounts ? (
                      <span className="inline-flex text-emerald-600 bg-emerald-50 p-1 rounded">
                        <Check size={16} />
                      </span>
                    ) : (
                      <span className="inline-flex text-slate-300">
                        <X size={16} />
                      </span>
                    )}
                  </td>
                  <td className="text-center">
                    {cap.manager ? (
                      <span className="inline-flex text-emerald-600 bg-emerald-50 p-1 rounded">
                        <Check size={16} />
                      </span>
                    ) : (
                      <span className="inline-flex text-slate-300">
                        <X size={16} />
                      </span>
                    )}
                  </td>
                  <td className="text-center">
                    {cap.md ? (
                      <span className="inline-flex text-emerald-600 bg-emerald-50 p-1 rounded">
                        <Check size={16} />
                      </span>
                    ) : (
                      <span className="inline-flex text-slate-300">
                        <X size={16} />
                      </span>
                    )}
                  </td>
                  <td className="text-center">
                    {cap.admin ? (
                      <span className="inline-flex text-emerald-600 bg-emerald-50 p-1 rounded">
                        <Check size={16} />
                      </span>
                    ) : (
                      <span className="inline-flex text-slate-300">
                        <X size={16} />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
