'use client';

import React from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { formatCurrency } from '../../lib/calculations';
import { Printer } from '../ui/Icons';

export function MdFinance() {
  const { customers, transactions, dieselRecords, vehicleExpenses, otherExpenses, workers, accounts } = useTmsStore();

  const totalBilling = customers.reduce((sum, c) => sum + c.totalCredit, 0);
  const totalCollections = transactions
    .filter((t) => t.type === 'CUSTOMER_PAYMENT')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalReceivables = customers.reduce((sum, c) => sum + c.balance, 0);

  const totalDiesel = dieselRecords.reduce((sum, d) => sum + d.totalAmount, 0);
  const totalMaintenance = vehicleExpenses.reduce((sum, v) => sum + v.amount, 0);
  const totalWages = workers.reduce((sum, w) => sum + w.paid, 0);
  const totalOther = otherExpenses.reduce((sum, o) => sum + o.amount, 0);

  const totalOperatingCosts = totalDiesel + totalMaintenance + totalWages + totalOther;
  const netContribution = totalBilling - totalOperatingCosts;
  const contributionMargin = totalBilling > 0 ? ((netContribution / totalBilling) * 100).toFixed(1) : '0.0';

  return (
    <div>
      <PageHeader
        title="Executive Financial Statement (P&L Summary)"
        description="Comprehensive profit & loss analysis · Revenue, receivables, operating expenses and net contribution"
      >
        <button onClick={() => window.print()} className="btn-primary">
          <Printer size={15} />
          Print Statement
        </button>
      </PageHeader>

      {/* TOP METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="p-5 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Gross Freight Billing
          </span>
          <strong className="text-2xl font-bold text-[#16425B] block my-1">
            {formatCurrency(totalBilling)}
          </strong>
          <span className="text-xs text-[#5A6E7F]">From completed dispatches</span>
        </div>

        <div className="p-5 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Customer Collections
          </span>
          <strong className="text-2xl font-bold text-emerald-700 block my-1">
            {formatCurrency(totalCollections)}
          </strong>
          <span className="text-xs text-[#5A6E7F]">Realized liquid receipts</span>
        </div>

        <div className="p-5 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Total Operating Costs
          </span>
          <strong className="text-2xl font-bold text-rose-700 block my-1">
            {formatCurrency(totalOperatingCosts)}
          </strong>
          <span className="text-xs text-[#5A6E7F]">Fuel, parts, wages & admin</span>
        </div>

        <div className="p-5 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Net Operational Margin
          </span>
          <strong className="text-2xl font-bold text-[#2F668F] block my-1">
            {contributionMargin}%
          </strong>
          <span className="text-xs text-emerald-700 font-bold">
            Contribution: {formatCurrency(netContribution)}
          </span>
        </div>
      </div>

      {/* P&L STRUCTURED LEDGER */}
      <div className="bg-white rounded-lg border border-[#D9DBD6] p-6 shadow-sm">
        <h2 className="text-sm font-bold text-[#16425B] pb-3 border-b border-[#D9DBD6] mb-4">
          Freight Commercial Operating Statement
        </h2>

        <div className="space-y-6 text-xs">
          {/* Revenue */}
          <div>
            <h3 className="font-bold text-[#2F668F] uppercase tracking-wide text-[11px] mb-2">
              1. Commercial Freight Revenue
            </h3>
            <div className="p-3 bg-[#f8faf5] rounded border border-[#D9DBD6] space-y-2">
              <div className="flex justify-between">
                <span>Total Freight Billed to Customers</span>
                <strong className="text-[#16425B]">{formatCurrency(totalBilling)}</strong>
              </div>
              <div className="flex justify-between text-[#5A6E7F]">
                <span>Less: Current Outstanding Receivables</span>
                <span>({formatCurrency(totalReceivables)})</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#D9DBD6] font-bold">
                <span className="text-[#16425B]">Net Realized Collections</span>
                <span className="text-emerald-700">{formatCurrency(totalCollections)}</span>
              </div>
            </div>
          </div>

          {/* Direct Operating Expenses */}
          <div>
            <h3 className="font-bold text-[#b45309] uppercase tracking-wide text-[11px] mb-2">
              2. Attributable Fleet & Operations Expenditure
            </h3>
            <div className="p-3 bg-[#f8faf5] rounded border border-[#D9DBD6] space-y-2">
              <div className="flex justify-between">
                <span>Diesel & Fuel Station Costs</span>
                <strong className="text-rose-700">{formatCurrency(totalDiesel)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Fleet Maintenance, Spares & Garage Repairs</span>
                <strong className="text-rose-700">{formatCurrency(totalMaintenance)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Workforce Salary & Driver Wage Vouchers</span>
                <strong className="text-rose-700">{formatCurrency(totalWages)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Administrative Supplies & Miscellaneous Operations</span>
                <strong className="text-rose-700">{formatCurrency(totalOther)}</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#D9DBD6] font-bold">
                <span className="text-[#16425B]">Total Operating Expenses</span>
                <span className="text-rose-700">{formatCurrency(totalOperatingCosts)}</span>
              </div>
            </div>
          </div>

          {/* Net Contribution */}
          <div className="p-4 bg-[#e8f1f5] rounded-lg border border-[#2F668F] flex justify-between items-center text-sm font-bold">
            <span className="text-[#16425B]">Net Operating Contribution</span>
            <span className="text-xl text-[#2F668F] font-black">{formatCurrency(netContribution)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
