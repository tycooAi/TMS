'use client';

import React, { useState } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency, calculateNetWage } from '../../lib/calculations';
import { DollarSign, Users, Plus } from '../ui/Icons';
import { Worker } from '../../types';

export function AccountsWorkersWages() {
  const { workers, accounts, recordWorkerWage } = useTmsStore();

  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [wageAmount, setWageAmount] = useState<number>(0);
  const [entryKind, setEntryKind] = useState<'Wage Payment' | 'Advance Payment'>('Wage Payment');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'BANK' | 'UPI' | 'ONLINE' | 'OTHER'>('BANK');
  const [targetAccount, setTargetAccount] = useState<string>(accounts[0]?.name || 'State Bank of India (Main A/C)');
  const [reference, setReference] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  const totalMonthlyPayroll = workers.reduce((sum, w) => sum + w.salary, 0);
  const totalPaid = workers.reduce((sum, w) => sum + w.paid, 0);
  const totalPending = workers.reduce((sum, w) => sum + Math.max(0, w.salary - w.paid), 0);
  const totalAdvances = workers.reduce((sum, w) => sum + w.advance, 0);

  const handleOpenWageEntry = (w: Worker) => {
    setSelectedWorker(w);
    const balanceDue = Math.max(0, w.salary - w.paid);
    setWageAmount(balanceDue > 0 ? balanceDue : 5000);
    setEntryKind(balanceDue > 0 ? 'Wage Payment' : 'Advance Payment');
    setError('');
  };

  const handleConfirmDisbursement = () => {
    if (!selectedWorker) return;
    if (wageAmount <= 0) {
      setError('Disbursement amount must be greater than zero.');
      return;
    }

    recordWorkerWage(
      selectedWorker.id,
      wageAmount,
      paymentMode,
      entryKind,
      targetAccount,
      'Anitha S'
    );

    setIsConfirmOpen(false);
    setSelectedWorker(null);
  };

  return (
    <div>
      <PageHeader
        title="Workers & Wage Ledgers"
        description="Payroll disbursement and driver advances · Operational worker identity is read-only"
      />

      {/* SUMMARY KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Total Active Workforce
          </span>
          <strong className="text-2xl font-bold text-[#16425B] block my-1">
            {workers.length} Employees
          </strong>
          <span className="text-xs text-[#5A6E7F]">Drivers, Operators & Staff</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Pending Wages
          </span>
          <strong className="text-2xl font-bold text-[#b45309] block my-1">
            {formatCurrency(totalPending)}
          </strong>
          <span className="text-xs text-[#5A6E7F]">Current September period</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Disbursed This Period
          </span>
          <strong className="text-2xl font-bold text-emerald-700 block my-1">
            {formatCurrency(totalPaid)}
          </strong>
          <span className="text-xs text-[#5A6E7F]">Posted salary payouts</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Active Driver Advances
          </span>
          <strong className="text-2xl font-bold text-[#16425B] block my-1">
            {formatCurrency(totalAdvances)}
          </strong>
          <span className="text-xs text-[#5A6E7F]">Recoverable advance balances</span>
        </div>
      </div>

      {/* WAGES ROSTER TABLE */}
      <div className="table-container">
        <table className="tms-table">
          <thead>
            <tr>
              <th>Worker Name</th>
              <th>Employee ID</th>
              <th>Phone</th>
              <th>Assigned Role</th>
              <th>Monthly Wage</th>
              <th>Advance</th>
              <th>Paid Amount</th>
              <th>Pending Balance</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => {
              const pending = Math.max(0, w.salary - w.paid);
              return (
                <tr key={w.id}>
                  <td className="font-bold text-[#16425B]">{w.name}</td>
                  <td className="font-bold text-[#2F668F]">{w.id}</td>
                  <td>{w.phone}</td>
                  <td className="text-xs text-[#5A6E7F]">{w.role}</td>
                  <td>{formatCurrency(w.salary)}</td>
                  <td className="text-amber-800 font-semibold">{formatCurrency(w.advance)}</td>
                  <td className="text-emerald-700 font-semibold">{formatCurrency(w.paid)}</td>
                  <td className="font-bold text-[#b45309]">
                    {pending > 0 ? formatCurrency(pending) : 'Cleared'}
                  </td>
                  <td>
                    <StatusBadge status={pending > 0 ? 'PENDING' : 'PAID'} />
                  </td>
                  <td>
                    <button
                      onClick={() => handleOpenWageEntry(w)}
                      className="btn-primary py-1 px-2.5 text-xs flex items-center gap-1"
                    >
                      <DollarSign size={13} />
                      Wage Entry
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* WAGE DISBURSEMENT MODAL */}
      {selectedWorker && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedWorker(null)}
          title={`Disburse Wage / Advance: ${selectedWorker.name}`}
          subtitle={`Employee ID: ${selectedWorker.id} · Role: ${selectedWorker.role} (Read-Only Master)`}
          maxWidth="max-w-xl"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-[#f8faf5] border border-[#D9DBD6] rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-[#5A6E7F] block">Salary / Base:</span>
                <strong>{formatCurrency(selectedWorker.salary)}</strong>
              </div>
              <div>
                <span className="text-[#5A6E7F] block">Disbursed So Far:</span>
                <span className="text-emerald-700 font-semibold">
                  {formatCurrency(selectedWorker.paid)}
                </span>
              </div>
              <div>
                <span className="text-[#5A6E7F] block">Driver Advance:</span>
                <span className="text-amber-800 font-semibold">
                  {formatCurrency(selectedWorker.advance)}
                </span>
              </div>
              <div>
                <span className="text-[#5A6E7F] block">Net Due:</span>
                <strong className="text-rose-700 font-bold">
                  {formatCurrency(Math.max(0, selectedWorker.salary - selectedWorker.paid))}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">Voucher Type</label>
                <select
                  value={entryKind}
                  onChange={(e) => setEntryKind(e.target.value as any)}
                  className="tms-input"
                >
                  <option value="Wage Payment">Regular Wage Payout</option>
                  <option value="Advance Payment">Trip / Driver Advance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Disbursement Amount (₹) *
                </label>
                <input
                  type="number"
                  value={wageAmount || ''}
                  onChange={(e) => setWageAmount(Number(e.target.value))}
                  className="tms-input font-bold text-[#16425B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="tms-input"
                >
                  <option value="BANK">Bank Transfer / IMPS</option>
                  <option value="CASH">Cash Voucher</option>
                  <option value="UPI">UPI / GPay</option>
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
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Reference / Voucher Remarks
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. Salary tranche 2 or trip advance for Madurai route"
                  className="tms-input"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900">
              Note: Posted wage transactions debit the selected treasury account and are locked in the central ledger.
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#D9DBD6]">
              <button
                type="button"
                onClick={() => setSelectedWorker(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                className="btn-primary"
              >
                Post Wage Voucher
              </button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Post Wage Disbursement?"
        message={`This will post ${formatCurrency(wageAmount)} (${entryKind}) to ${selectedWorker?.name} debited from ${targetAccount}. Continue?`}
        confirmLabel="Confirm & Post"
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDisbursement}
      />
    </div>
  );
}
