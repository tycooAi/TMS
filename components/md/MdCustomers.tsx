'use client';

import React from 'react';
import Link from 'next/link';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency } from '../../lib/calculations';

export function MdCustomers() {
  const { customers } = useTmsStore();

  return (
    <div>
      <PageHeader
        title="Customer Exposure & Receivables Aging"
        description="Executive analysis of client outstanding balances and credit terms compliance"
      />

      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5">
        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Company / Client Name</th>
                <th>Primary Contact</th>
                <th>Credit Terms</th>
                <th>Total Volume Billed</th>
                <th>Payments Received</th>
                <th>Current Outstanding</th>
                <th>Account Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="font-bold text-[#2F668F]">{c.id}</td>
                  <td className="font-bold text-[#16425B]">{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.creditTerms || 'Standard'}</td>
                  <td>{formatCurrency(c.totalCredit)}</td>
                  <td className="text-emerald-700 font-semibold">{formatCurrency(c.totalPaid)}</td>
                  <td className="font-bold text-amber-800">{formatCurrency(c.balance)}</td>
                  <td>
                    <StatusBadge status={c.status} />
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
