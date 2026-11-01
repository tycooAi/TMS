'use client';

import React from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency } from '../../lib/calculations';

export function MdWorkers() {
  const { workers } = useTmsStore();

  const totalPayroll = workers.reduce((sum, w) => sum + w.salary, 0);
  const totalPaid = workers.reduce((sum, w) => sum + w.paid, 0);
  const totalPending = workers.reduce((sum, w) => sum + Math.max(0, w.salary - w.paid), 0);

  return (
    <div>
      <PageHeader
        title="Workforce Deployment & Payroll Oversight"
        description="Executive workforce roster · Wage allocation, active operators, and drivers"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Total Monthly Payroll
          </span>
          <strong className="text-2xl font-bold text-[#16425B] block my-1">
            {formatCurrency(totalPayroll)}
          </strong>
          <span className="text-xs text-[#5A6E7F]">Monthly workforce commitment</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Disbursed To Date
          </span>
          <strong className="text-2xl font-bold text-emerald-700 block my-1">
            {formatCurrency(totalPaid)}
          </strong>
          <span className="text-xs text-[#5A6E7F]">Verified paid salaries</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Pending Wage Obligation
          </span>
          <strong className="text-2xl font-bold text-amber-700 block my-1">
            {formatCurrency(totalPending)}
          </strong>
          <span className="text-xs text-[#5A6E7F]">Awaiting end-of-period pay</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5">
        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Role Designation</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Monthly Salary</th>
                <th>Paid Amount</th>
                <th>Pending Wage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w.id}>
                  <td className="font-bold text-[#2F668F]">{w.id}</td>
                  <td className="font-bold text-[#16425B]">{w.name}</td>
                  <td className="text-xs text-[#5A6E7F]">{w.role}</td>
                  <td>{w.phone}</td>
                  <td className="text-xs text-[#5A6E7F]">{w.email}</td>
                  <td className="font-semibold">{formatCurrency(w.salary)}</td>
                  <td className="text-emerald-700 font-semibold">{formatCurrency(w.paid)}</td>
                  <td className="font-bold text-amber-800">
                    {formatCurrency(Math.max(0, w.salary - w.paid))}
                  </td>
                  <td>
                    <StatusBadge status={w.status} />
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
