'use client';

import React, { useState } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency } from '../../lib/calculations';
import { Search, Shield, AlertTriangle } from '../ui/Icons';
import { FinancialTransaction } from '../../types';

export function AccountsTransactions() {
  const { transactions, requestCorrection } = useTmsStore();

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedTx, setSelectedTx] = useState<FinancialTransaction | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Correction form
  const [reason, setReason] = useState('');
  const [requestedValue, setRequestedValue] = useState('');
  const [error, setError] = useState('');

  const filteredTransactions = transactions.filter((t) => {
    const q = query.trim().toLowerCase();
    const matchesQ =
      !q ||
      t.id.toLowerCase().includes(q) ||
      t.entity.toLowerCase().includes(q) ||
      (t.reference && t.reference.toLowerCase().includes(q)) ||
      t.type.toLowerCase().includes(q);

    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;

    return matchesQ && matchesType && matchesStatus;
  });

  const handleOpenCorrection = (tx: FinancialTransaction) => {
    setSelectedTx(tx);
    setReason('');
    setRequestedValue(`Amount: ₹${tx.amount.toLocaleString('en-IN')}`);
    setError('');
    setIsCorrectionModalOpen(true);
  };

  const handleSaveCorrectionRequest = () => {
    if (!selectedTx) return;
    if (!reason.trim()) {
      setError('A business justification / reason is required for correction approval.');
      return;
    }
    if (!requestedValue.trim()) {
      setError('Please specify the requested new value or correction details.');
      return;
    }

    const now = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    requestCorrection(
      {
        transactionId: selectedTx.id,
        entityName: `${selectedTx.entity} (${selectedTx.type.replace(/_/g, ' ')})`,
        date: now,
        requestedBy: 'Anitha S (Accounts)',
        originalValue: `Amount: ₹${selectedTx.amount.toLocaleString('en-IN')} | Mode: ${selectedTx.paymentMode || 'N/A'} | Ref: ${selectedTx.reference || 'N/A'}`,
        requestedValue: requestedValue.trim(),
        reason: reason.trim(),
      },
      'Anitha S'
    );

    setIsConfirmOpen(false);
    setIsCorrectionModalOpen(false);
    setSelectedTx(null);
  };

  return (
    <div>
      <PageHeader
        title="Central Financial Ledger"
        description="Unified double-entry audit journal · Posted records are locked against direct mutation"
      />

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-lg border border-[#D9DBD6] mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-[#5A6E7F]" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transaction ID, party, reference..."
            className="tms-input pl-9"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="tms-input w-full md:w-44"
          >
            <option value="ALL">All Transaction Types</option>
            <option value="CUSTOMER_PAYMENT">Customer Payment</option>
            <option value="CUSTOMER_CREDIT">Customer Credit</option>
            <option value="SALARY">Salary / Wage</option>
            <option value="DRIVER_ADVANCE">Driver Advance</option>
            <option value="DIESEL">Diesel Fuel</option>
            <option value="MAINTENANCE">Vehicle Maintenance</option>
            <option value="EXPENSE">Other Expense</option>
            <option value="TRANSFER">Internal Transfer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="tms-input w-full md:w-44"
          >
            <option value="ALL">All Statuses</option>
            <option value="POSTED">Posted & Locked</option>
            <option value="CORRECTION_REQUESTED">Correction Requested</option>
            <option value="CORRECTED">Approved Corrected</option>
          </select>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
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
              <th>Account</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((tx) => (
              <tr key={tx.id}>
                <td className="font-bold text-[#2F668F]">{tx.id}</td>
                <td>{tx.date}</td>
                <td className="font-semibold text-[#16425B]">{tx.entity}</td>
                <td>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#f0f4f8] text-[#16425B]">
                    {tx.type.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="text-rose-700 font-semibold">
                  {tx.debit > 0 ? formatCurrency(tx.debit) : '—'}
                </td>
                <td className="text-emerald-700 font-semibold">
                  {tx.credit > 0 ? formatCurrency(tx.credit) : '—'}
                </td>
                <td className="text-xs text-[#5A6E7F]">{tx.account || 'Receivable'}</td>
                <td>{tx.paymentMode || '—'}</td>
                <td>
                  <StatusBadge status={tx.status} />
                </td>
                <td>
                  <button
                    onClick={() => handleOpenCorrection(tx)}
                    disabled={tx.status === 'CORRECTION_REQUESTED'}
                    className="btn-secondary py-1 px-2.5 text-xs disabled:opacity-50"
                  >
                    {tx.status === 'CORRECTION_REQUESTED' ? 'Under Review' : 'Request Correction'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* REQUEST CORRECTION MODAL */}
      {selectedTx && (
        <Modal
          isOpen={isCorrectionModalOpen}
          onClose={() => setIsCorrectionModalOpen(false)}
          title={`Request Financial Correction: ${selectedTx.id}`}
          subtitle="Posted records cannot be directly edited. This request is routed to MD for formal approval."
          maxWidth="max-w-xl"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#f8faf5] border border-[#D9DBD6] rounded-lg space-y-1">
              <div className="flex justify-between">
                <span className="text-[#5A6E7F]">Transaction ID:</span>
                <strong>{selectedTx.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6E7F]">Entity / Party:</span>
                <span className="font-semibold text-[#16425B]">{selectedTx.entity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6E7F]">Original Amount:</span>
                <strong className="text-rose-700">{formatCurrency(selectedTx.amount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6E7F]">Created By:</span>
                <span>{selectedTx.createdBy} on {selectedTx.date}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Requested New Value / Corrected Figure *
              </label>
              <input
                type="text"
                value={requestedValue}
                onChange={(e) => setRequestedValue(e.target.value)}
                placeholder="e.g. Amount: ₹9,500 (Adding overtime allowance)"
                className="tms-input font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Detailed Reason & Justification for Correction *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why the posting requires correction and cite any supporting voucher or receipt..."
                className="w-full p-2.5 border border-[#D9DBD6] rounded-md text-xs h-24 focus:outline-none focus:border-[#2F668F]"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-900">
              Upon submission, the status will shift to <strong>Correction Requested</strong> and appear in the MD Approvals Center with full audit tracing.
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#D9DBD6]">
              <button
                type="button"
                onClick={() => setIsCorrectionModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                className="btn-primary"
              >
                Submit for MD Approval
              </button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Submit Correction Request to MD?"
        message={`This will send a correction request for Transaction ${selectedTx?.id} to the Managing Director. The original posted audit trail will remain intact.`}
        confirmLabel="Submit Request"
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleSaveCorrectionRequest}
      />
    </div>
  );
}
