'use client';

import React, { useState } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { formatCurrency } from '../../lib/calculations';
import { Download, FileText, Printer } from '../ui/Icons';

export function AccountsReports() {
  const { customers, transactions, dieselRecords, vehicleExpenses, otherExpenses, accounts } = useTmsStore();

  const [selectedReport, setSelectedReport] = useState('receivables');
  const [fromDate, setFromDate] = useState('2026-09-01');
  const [toDate, setToDate] = useState('2026-09-13');

  const reportCategories = [
    { id: 'receivables', title: 'Customer Receivables & Aging', desc: 'Outstanding customer balances and credit terms' },
    { id: 'payments', title: 'Customer Collections', desc: 'Posted customer receipts by payment mode' },
    { id: 'diesel', title: 'Diesel & Fuel Expenditure', desc: 'Attributable fleet fuel consumption & mileage' },
    { id: 'expenses', title: 'Vehicle & Operational Expenses', desc: 'Maintenance, repairs, spare parts & office' },
    { id: 'treasury', title: 'Cash & Bank Treasury Statement', desc: 'Derived balances and internal transfers' },
  ];

  return (
    <div>
      <PageHeader
        title="Financial & Operations Reports"
        description="Comprehensive audit-ready reporting statements with print & export support"
      >
        <button onClick={() => window.print()} className="btn-primary">
          <Printer size={15} />
          Print / PDF
        </button>
      </PageHeader>

      {/* REPORT SELECTOR CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {reportCategories.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setSelectedReport(r.id)}
            className={`p-4 rounded-lg border text-left transition-all ${
              selectedReport === r.id
                ? 'border-[#2F668F] bg-[#e8f1f5] shadow-sm'
                : 'border-[#D9DBD6] bg-white hover:border-[#3B7CA6]'
            }`}
          >
            <strong className="text-xs font-bold text-[#16425B] block">{r.title}</strong>
            <span className="text-[11px] text-[#5A6E7F] mt-1 block">{r.desc}</span>
          </button>
        ))}
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-lg border border-[#D9DBD6] mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div>
            <label className="block text-[10px] font-bold text-[#5A6E7F] uppercase mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="tms-input h-8 text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#5A6E7F] uppercase mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="tms-input h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Frontend prototype: Exporting spreadsheet format to CSV...')}
            className="btn-secondary text-xs py-1.5"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* REPORT TABLE VIEWER */}
      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#D9DBD6]">
          <div>
            <h2 className="text-sm font-bold text-[#16425B] uppercase tracking-wide">
              {reportCategories.find((r) => r.id === selectedReport)?.title}
            </h2>
            <p className="text-xs text-[#5A6E7F]">
              Reporting Period: {fromDate} to {toDate}
            </p>
          </div>
          <span className="text-xs font-bold text-[#2F668F] bg-[#e8f1f5] px-2.5 py-1 rounded">
            Verified Audit Source
          </span>
        </div>

        {selectedReport === 'receivables' && (
          <div className="table-container">
            <table className="tms-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Customer Name</th>
                  <th>Contact Phone</th>
                  <th>Credit Terms</th>
                  <th>Total Billed</th>
                  <th>Total Paid</th>
                  <th>Current Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="font-bold text-[#2F668F]">{c.id}</td>
                    <td className="font-bold">{c.name}</td>
                    <td>{c.phone}</td>
                    <td>{c.creditTerms || 'Standard'}</td>
                    <td>{formatCurrency(c.totalCredit)}</td>
                    <td className="text-emerald-700 font-semibold">{formatCurrency(c.totalPaid)}</td>
                    <td className="font-bold text-amber-800">{formatCurrency(c.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'payments' && (
          <div className="table-container">
            <table className="tms-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Payment Mode</th>
                  <th>Account Credited</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {transactions
                  .filter((t) => t.type === 'CUSTOMER_PAYMENT')
                  .map((t) => (
                    <tr key={t.id}>
                      <td className="font-bold text-[#2F668F]">{t.id}</td>
                      <td>{t.date}</td>
                      <td className="font-semibold">{t.entity}</td>
                      <td className="font-bold text-emerald-700">{formatCurrency(t.amount)}</td>
                      <td>{t.paymentMode || 'UPI'}</td>
                      <td>{t.account}</td>
                      <td className="font-mono text-xs">{t.reference || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'diesel' && (
          <div className="table-container">
            <table className="tms-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Date</th>
                  <th>Vehicle No</th>
                  <th>Driver</th>
                  <th>Station</th>
                  <th>Litres</th>
                  <th>Rate</th>
                  <th>Total Amount</th>
                  <th>Mileage</th>
                </tr>
              </thead>
              <tbody>
                {dieselRecords.map((d) => (
                  <tr key={d.id}>
                    <td className="font-bold text-[#2F668F]">{d.id}</td>
                    <td>{d.date}</td>
                    <td className="font-bold">{d.vehicleRegistration}</td>
                    <td>{d.driverName}</td>
                    <td>{d.fuelStation}</td>
                    <td>{d.litres} L</td>
                    <td>₹{d.ratePerLitre}</td>
                    <td className="font-bold text-rose-700">{formatCurrency(d.totalAmount)}</td>
                    <td className="font-bold text-emerald-700">{d.mileage} KM/L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'expenses' && (
          <div className="table-container">
            <table className="tms-table">
              <thead>
                <tr>
                  <th>Voucher ID</th>
                  <th>Date</th>
                  <th>Entity / Vehicle</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Payment Mode</th>
                </tr>
              </thead>
              <tbody>
                {vehicleExpenses.map((v) => (
                  <tr key={v.id}>
                    <td className="font-bold text-[#2F668F]">{v.id}</td>
                    <td>{v.date}</td>
                    <td className="font-bold">{v.vehicleRegistration}</td>
                    <td>{v.expenseType}</td>
                    <td>{v.serviceStationSupplier || v.notes}</td>
                    <td className="font-bold text-rose-700">{formatCurrency(v.amount)}</td>
                    <td>{v.paymentMode}</td>
                  </tr>
                ))}
                {otherExpenses.map((o) => (
                  <tr key={o.id}>
                    <td className="font-bold text-[#2F668F]">{o.id}</td>
                    <td>{o.date}</td>
                    <td className="font-bold">Operations</td>
                    <td>{o.category}</td>
                    <td>{o.description}</td>
                    <td className="font-bold text-rose-700">{formatCurrency(o.amount)}</td>
                    <td>{o.paymentMode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'treasury' && (
          <div className="table-container">
            <table className="tms-table">
              <thead>
                <tr>
                  <th>Account ID</th>
                  <th>Account Name</th>
                  <th>Type</th>
                  <th>Opening Balance</th>
                  <th>Current Derived Balance</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td className="font-bold text-[#2F668F]">{a.id}</td>
                    <td className="font-bold">{a.name}</td>
                    <td>{a.type}</td>
                    <td>{formatCurrency(a.openingBalance)}</td>
                    <td className="font-bold text-[#16425B]">{formatCurrency(a.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
