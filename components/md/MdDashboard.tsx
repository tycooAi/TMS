'use client';

import React from 'react';
import Link from 'next/link';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { KpiCard } from '../ui/KpiCard';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency } from '../../lib/calculations';
import { ArrowRight, Building2, DollarSign, Shield, Truck, Users, Wrench } from '../ui/Icons';

export function MdDashboard() {
  const { trips, customers, vehicles, workers, transactions, corrections, dieselRecords, vehicleExpenses, otherExpenses, accounts } = useTmsStore();

  // Cross-functional calculations
  const totalReceivables = customers.reduce((sum, c) => sum + c.balance, 0);
  const totalCollections = transactions
    .filter((t) => t.type === 'CUSTOMER_PAYMENT')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalBilled = customers.reduce((sum, c) => sum + c.totalCredit, 0);

  const totalDiesel = dieselRecords.reduce((sum, d) => sum + d.totalAmount, 0);
  const totalMaintenance = vehicleExpenses.reduce((sum, v) => sum + v.amount, 0);
  const totalWages = workers.reduce((sum, w) => sum + w.paid, 0);
  const totalOther = otherExpenses.reduce((sum, o) => sum + o.amount, 0);
  const totalExpenses = totalDiesel + totalMaintenance + totalWages + totalOther;
  const netContribution = totalBilled - totalExpenses;

  const activeTrips = trips.filter((t) => t.status === 'RUNNING' || t.status === 'LOADED').length;
  const deliveredTrips = trips.filter((t) => t.status === 'DELIVERED' || t.status === 'COMPLETED').length;
  const vehicleUtilization = vehicles.length > 0 ? Math.round((trips.filter(t => t.status === 'RUNNING').length / vehicles.length) * 100) : 0;

  const pendingCorrections = corrections.filter((c) => c.status === 'PENDING_MD');

  return (
    <div>
      <PageHeader
        title="Executive Management Cockpit"
        description="Managing Director Overview · Real-time operations, financial performance, and governance"
      >
        <Link href="/md/approvals" className="btn-secondary relative">
          <Shield size={15} />
          Pending Approvals
          {pendingCorrections.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingCorrections.length}
            </span>
          )}
        </Link>
        <Link href="/md/finance" className="btn-primary">
          <DollarSign size={15} />
          Executive Finance
        </Link>
      </PageHeader>

      {/* PENDING APPROVAL ALERT BANNER */}
      {pendingCorrections.length > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              !
            </div>
            <div>
              <strong className="text-xs font-bold text-amber-900 block">
                {pendingCorrections.length} Financial Correction Request(s) Awaiting MD Authorization
              </strong>
              <p className="text-[11px] text-amber-800">
                Accounts has requested value amendments on posted transactions.
              </p>
            </div>
          </div>
          <Link
            href="/md/approvals"
            className="btn-primary bg-amber-700 hover:bg-amber-800 border-amber-700 py-1.5 px-3 text-xs"
          >
            Review Requests
          </Link>
        </div>
      )}

      {/* EXECUTIVE SUMMARY 4-PILLAR KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="p-5 bg-white rounded-lg border border-[#D9DBD6] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider">
              Total Freight Billing
            </span>
            <DollarSign size={16} className="text-[#2F668F]" />
          </div>
          <strong className="text-2xl font-bold text-[#16425B] block my-1">
            {formatCurrency(totalBilled)}
          </strong>
          <div className="flex justify-between text-xs text-[#5A6E7F] mt-2 pt-2 border-t border-[#edf1f5]">
            <span>Collections: {formatCurrency(totalCollections)}</span>
            <span className="text-emerald-700 font-bold">
              {totalBilled > 0 ? Math.round((totalCollections / totalBilled) * 100) : 0}% Realized
            </span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-lg border border-[#D9DBD6] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider">
              Outstanding Receivables
            </span>
            <Building2 size={16} className="text-[#b45309]" />
          </div>
          <strong className="text-2xl font-bold text-[#b45309] block my-1">
            {formatCurrency(totalReceivables)}
          </strong>
          <div className="flex justify-between text-xs text-[#5A6E7F] mt-2 pt-2 border-t border-[#edf1f5]">
            <span>Across {customers.length} Customers</span>
            <Link href="/md/customers" className="text-[#2F668F] font-semibold hover:underline">
              View Aging →
            </Link>
          </div>
        </div>

        <div className="p-5 bg-white rounded-lg border border-[#D9DBD6] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider">
              Fleet Operations
            </span>
            <Truck size={16} className="text-[#2F668F]" />
          </div>
          <strong className="text-2xl font-bold text-[#16425B] block my-1">
            {activeTrips} Active / {deliveredTrips} Delivered
          </strong>
          <div className="flex justify-between text-xs text-[#5A6E7F] mt-2 pt-2 border-t border-[#edf1f5]">
            <span>{vehicles.length} Total Trucks</span>
            <span className="text-emerald-700 font-bold">{vehicleUtilization}% Active Utilization</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-lg border border-[#D9DBD6] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider">
              Estimated Net Contribution
            </span>
            <Shield size={16} className="text-emerald-700" />
          </div>
          <strong className="text-2xl font-bold text-emerald-700 block my-1">
            {formatCurrency(netContribution)}
          </strong>
          <div className="flex justify-between text-xs text-[#5A6E7F] mt-2 pt-2 border-t border-[#edf1f5]">
            <span>Total Cost: {formatCurrency(totalExpenses)}</span>
            <Link href="/md/finance" className="text-[#2F668F] font-semibold hover:underline">
              P&L Detail →
            </Link>
          </div>
        </div>
      </div>

      {/* OPERATIONS & FINANCIAL HIGHLIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* CUSTOMER EXPOSURE TABLE */}
        <div className="bg-white rounded-lg border border-[#D9DBD6] p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#16425B]">Top Customer Commercial Exposure</h2>
              <p className="text-xs text-[#5A6E7F]">Outstanding receivables and credit utilization</p>
            </div>
            <Link href="/md/customers" className="text-xs font-semibold text-[#2F668F] hover:underline">
              View All ({customers.length})
            </Link>
          </div>

          <div className="table-container">
            <table className="tms-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Credit Terms</th>
                  <th>Total Billed</th>
                  <th>Received</th>
                  <th>Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="font-bold text-[#16425B]">{c.name}</td>
                    <td>{c.creditTerms || 'Standard'}</td>
                    <td>{formatCurrency(c.totalCredit)}</td>
                    <td className="text-emerald-700 font-semibold">{formatCurrency(c.totalPaid)}</td>
                    <td className="font-bold text-amber-800">{formatCurrency(c.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FLEET & COST BREAKDOWN */}
        <div className="bg-white rounded-lg border border-[#D9DBD6] p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#16425B]">Fleet Operational Cost Breakdown</h2>
              <p className="text-xs text-[#5A6E7F]">Diesel, maintenance, wages and yard operations</p>
            </div>
            <Link href="/md/finance" className="text-xs font-semibold text-[#2F668F] hover:underline">
              Finance View
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#f8faf5] rounded border border-[#D9DBD6] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="font-semibold text-[#16425B]">Diesel & Fuel Consumption</span>
              </div>
              <strong className="text-[#16425B]">{formatCurrency(totalDiesel)}</strong>
            </div>

            <div className="p-3 bg-[#f8faf5] rounded border border-[#D9DBD6] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                <span className="font-semibold text-[#16425B]">Vehicle Maintenance & Parts</span>
              </div>
              <strong className="text-[#16425B]">{formatCurrency(totalMaintenance)}</strong>
            </div>

            <div className="p-3 bg-[#f8faf5] rounded border border-[#D9DBD6] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="font-semibold text-[#16425B]">Workforce Wages & Driver Advances</span>
              </div>
              <strong className="text-[#16425B]">{formatCurrency(totalWages)}</strong>
            </div>

            <div className="p-3 bg-[#f8faf5] rounded border border-[#D9DBD6] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <span className="font-semibold text-[#16425B]">Administrative & Other Operations</span>
              </div>
              <strong className="text-[#16425B]">{formatCurrency(totalOther)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
