'use client';

import React from 'react';
import Link from 'next/link';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { KpiCard } from '../ui/KpiCard';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/calculations';
import { Plus, ArrowRight, DollarSign, FileText } from '../ui/Icons';

export function AccountsDashboard() {
  const { customers, transactions, accounts, workers, vehicleExpenses, otherExpenses } = useTmsStore();

  const totalReceivables = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
  const cashBalance = accounts.find((a) => a.type === 'CASH')?.balance || 0;
  const bankBalance = accounts.find((a) => a.type === 'BANK')?.balance || 0;
  const onlineBalance = accounts.find((a) => a.type === 'ONLINE')?.balance || 0;
  const totalLiquidCash = cashBalance + bankBalance + onlineBalance;

  // Wage pending
  const wagePending = workers.reduce((sum, w) => sum + Math.max(0, w.salary - w.paid), 0);

  // Month-to-date expenses
  const totalVehicleExp = vehicleExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalOtherExp = otherExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Today's collections
  const todayCollections = transactions
    .filter((t) => t.type === 'CUSTOMER_PAYMENT' && t.date.includes('13 Sep'))
    .reduce((sum, t) => sum + t.amount, 0);

  const recentTransactions = transactions.slice(0, 6);

  return (
    <div>
      <PageHeader
        title="Accounts & Financial Dashboard"
        description="Comprehensive treasury, customer receivables, billing and ledger management"
      >
        <Link href="/accounts/customers?new=true" className="btn-secondary">
          <Plus size={15} />
          New Customer Entry
        </Link>
        <Link href="/accounts/invoices" className="btn-primary">
          <FileText size={15} />
          Generate Invoice
        </Link>
      </PageHeader>

      {/* CORE FINANCIAL KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KpiCard
          label="Today's Collections"
          value={formatCurrency(todayCollections)}
          note="Posted customer receipts"
        />
        <KpiCard
          label="Customer Receivables"
          value={formatCurrency(totalReceivables)}
          note="Total outstanding balance"
        />
        <KpiCard
          label="Worker Wage Pending"
          value={formatCurrency(wagePending)}
          note="Active pay period balance"
        />
        <KpiCard
          label="Vehicle Expenses"
          value={formatCurrency(totalVehicleExp)}
          note="Maintenance & repairs"
        />
        <KpiCard
          label="Other Expenses"
          value={formatCurrency(totalOtherExp)}
          note="Office & misc operations"
        />
        <KpiCard
          label="Cash & Bank Total"
          value={formatCurrency(totalLiquidCash)}
          note={`Cash: ${formatCurrency(cashBalance)}`}
        />
      </div>

      {/* WORKFLOW DISPATCH & ACTIVITY STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Today's Pending Items
          </span>
          <strong className="text-xl font-bold text-[#16425B] my-1 block">5 Items</strong>
          <p className="text-xs text-[#5A6E7F]">Delivered trips ready for invoice & wage vouchers</p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Today's Posted Postings
          </span>
          <strong className="text-xl font-bold text-[#16425B] my-1 block">{transactions.length} Postings</strong>
          <p className="text-xs text-[#5A6E7F]">Locked and auditable in central ledger</p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Week Collections
          </span>
          <strong className="text-xl font-bold text-[#16425B] my-1 block">{formatCurrency(186500)}</strong>
          <p className="text-xs text-[#5A6E7F]">Credited to bank and online accounts</p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Monthly Billing
          </span>
          <strong className="text-xl font-bold text-[#16425B] my-1 block">{formatCurrency(782400)}</strong>
          <p className="text-xs text-[#5A6E7F]">Total freight delivery billing volume</p>
        </div>
      </div>

      {/* RECENT CENTRAL POSTINGS */}
      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#16425B]">Recent Posted Financial Transactions</h2>
            <p className="text-xs text-[#5A6E7F]">Derived double-entry central ledger</p>
          </div>
          <Link
            href="/accounts/transactions"
            className="text-xs font-semibold text-[#2F668F] hover:underline flex items-center gap-1"
          >
            View All Transactions
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Date</th>
                <th>Party / Entity</th>
                <th>Type</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Payment Mode</th>
                <th>Account</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="font-bold text-[#2F668F]">{tx.id}</td>
                  <td>{tx.date}</td>
                  <td className="font-semibold">{tx.entity}</td>
                  <td className="text-xs">{tx.type.replace(/_/g, ' ')}</td>
                  <td className="text-rose-700 font-semibold">
                    {tx.debit > 0 ? formatCurrency(tx.debit) : '—'}
                  </td>
                  <td className="text-emerald-700 font-semibold">
                    {tx.credit > 0 ? formatCurrency(tx.credit) : '—'}
                  </td>
                  <td>{tx.paymentMode || '—'}</td>
                  <td className="text-xs text-[#5A6E7F]">{tx.account || 'Accounts Receivable'}</td>
                  <td>
                    <StatusBadge status={tx.status} />
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
