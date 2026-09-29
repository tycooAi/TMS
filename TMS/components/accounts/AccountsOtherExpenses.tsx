'use client';

import React, { useState } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency } from '../../lib/calculations';
import { Plus, Search, FileText } from '../ui/Icons';
import { OtherExpense } from '../../types';
import { generateNextId } from '../../lib/ids';
import { downloadCSV } from '../../lib/csvExport';

export function AccountsOtherExpenses() {
  const { otherExpenses, accounts, recordOtherExpense } = useTmsStore();

  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterAccount, setFilterAccount] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [category, setCategory] = useState<OtherExpense['category']>('Office Expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'BANK' | 'UPI' | 'ONLINE' | 'OTHER'>('CASH');
  const [targetAccount, setTargetAccount] = useState<string>(accounts[0]?.name || 'Cash in Hand');
  const [referenceBill, setReferenceBill] = useState('');
  const [error, setError] = useState('');

  const filteredOtherExpenses = otherExpenses.filter((e) => {
    const q = query.trim().toLowerCase();
    const matchesQ =
      !q ||
      e.id.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      (e.referenceBill && e.referenceBill.toLowerCase().includes(q));

    const matchesCategory = filterCategory === 'ALL' || e.category === filterCategory;
    const matchesAccount = filterAccount === 'ALL' || e.account === filterAccount;

    return matchesQ && matchesCategory && matchesAccount;
  });

  const handleExportCSV = () => {
    const headers = [
      'Voucher ID',
      'Date',
      'Time',
      'Category',
      'Description',
      'Amount (₹)',
      'Payment Mode',
      'Account',
      'Reference Bill',
      'Status',
    ];
    const rows = filteredOtherExpenses.map((e) => [
      e.id,
      e.date,
      e.time,
      e.category,
      e.description,
      e.amount,
      e.paymentMode,
      e.account,
      e.referenceBill || '',
      e.status,
    ]);
    downloadCSV('sri_amman_arul_other_expenses_filtered.csv', headers, rows);
  };

  const totalOtherExpenses = otherExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handlePostExpense = () => {
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (amount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    const nextId = generateNextId('OEX', otherExpenses.map((e) => e.id));
    const now = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const newExpense: OtherExpense = {
      id: nextId,
      category,
      description: description.trim(),
      date: now,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      amount,
      paymentMode,
      account: targetAccount,
      referenceBill,
      status: 'POSTED',
      createdBy: 'Anitha S',
    };

    recordOtherExpense(newExpense, 'Anitha S');
    setIsConfirmOpen(false);
    setIsModalOpen(false);
    setDescription('');
    setAmount(0);
    setReferenceBill('');
  };

  return (
    <div>
      <PageHeader
        title="Administrative & Other Expenses"
        description="Nut & bolt, office stationery, electricity, travel, and miscellaneous operational vouchers"
      >
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={16} />
          Log Other Expense
        </button>
      </PageHeader>

      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#16425B]">Other Operational Vouchers</h2>
            <p className="text-xs text-[#5A6E7F]">
              Total Cumulative: <strong>{formatCurrency(totalOtherExpenses)}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="relative w-full md:w-56">
              <Search className="absolute left-3 top-2.5 text-[#5A6E7F]" size={15} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search voucher, bill..."
                className="tms-input pl-8 py-1.5 text-xs"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="tms-input py-1.5 text-xs w-36"
            >
              <option value="ALL">All Categories</option>
              <option value="Office Expense">Office Expense</option>
              <option value="Refreshments">Refreshments</option>
              <option value="Travel">Travel</option>
              <option value="Repairs & Tools">Repairs & Tools</option>
              <option value="Postage & Printing">Postage & Printing</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>

            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="tms-input py-1.5 text-xs w-36"
            >
              <option value="ALL">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleExportCSV}
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 shrink-0"
              title="Export filtered vouchers to CSV"
            >
              <FileText size={14} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>Voucher ID</th>
                <th>Date & Time</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Account</th>
                <th>Reference Bill</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOtherExpenses.map((e) => (
                <tr key={e.id}>
                  <td className="font-bold text-[#2F668F]">{e.id}</td>
                  <td>{e.date} {e.time}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded bg-[#f0f4f8] text-[#16425B] text-xs font-semibold">
                      {e.category}
                    </span>
                  </td>
                  <td className="font-semibold text-[#16425B]">{e.description}</td>
                  <td className="font-bold text-rose-700">{formatCurrency(e.amount)}</td>
                  <td>{e.paymentMode}</td>
                  <td className="text-xs text-[#5A6E7F]">{e.account}</td>
                  <td className="font-mono text-xs">{e.referenceBill || '—'}</td>
                  <td>
                    <StatusBadge status={e.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Administrative / Other Expense"
        subtitle="Vouchers are debited from the chosen account and posted to the central ledger"
        maxWidth="max-w-xl"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Expense Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="tms-input"
              >
                <option value="Nut & Bolt">Nut & Bolt Expenses</option>
                <option value="Office Expense">Office Expense</option>
                <option value="Electricity">Electricity & Utilities</option>
                <option value="Rent">Yard / Office Rent</option>
                <option value="Travel">Staff Travel & Fuel</option>
                <option value="Food">Driver & Staff Meals</option>
                <option value="Miscellaneous">Miscellaneous Operations</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Amount (₹) *</label>
              <input
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0"
                className="tms-input font-bold text-[#16425B]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#16425B] mb-1">Description *</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Tailgate fasteners replacement or Office stationery register"
                className="tms-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="tms-input"
              >
                <option value="CASH">Cash in Hand</option>
                <option value="UPI">UPI / Online</option>
                <option value="BANK">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Disburse From Account</label>
              <select
                value={targetAccount}
                onChange={(e) => setTargetAccount(e.target.value)}
                className="tms-input"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name} ({formatCurrency(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#16425B] mb-1">Bill / Invoice Reference (optional)</label>
              <input
                type="text"
                value={referenceBill}
                onChange={(e) => setReferenceBill(e.target.value)}
                placeholder="e.g. FAST-8812"
                className="tms-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#D9DBD6]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="btn-primary"
            >
              Post Expense Voucher
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Post Expense Voucher?"
        message={`This will disburse ${formatCurrency(amount)} from ${targetAccount} for "${description}". Continue?`}
        confirmLabel="Confirm & Post"
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handlePostExpense}
      />
    </div>
  );
}
