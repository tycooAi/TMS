'use client';

import React, { useState } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency } from '../../lib/calculations';
import { DollarSign, RefreshCw, Plus, FileText, Search } from '../ui/Icons';
import { downloadCSV } from '../../lib/csvExport';

export function AccountsCashBank() {
  const { accounts, transactions, recordAccountTransfer } = useTmsStore();

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [fromAccount, setFromAccount] = useState<string>(accounts[0]?.name || 'State Bank of India (Main A/C)');
  const [toAccount, setToAccount] = useState<string>(accounts[1]?.name || 'Cash in Hand');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  // Filtering state
  const [accountFilter, setAccountFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const totalTreasury = accounts.reduce((sum, a) => sum + a.balance, 0);

  // Filter transfers & cash/bank related transactions
  const treasuryTransactions = transactions.filter(
    (t) => t.account || t.type === 'TRANSFER'
  );

  const filteredTreasuryTransactions = treasuryTransactions.filter((tx) => {
    const matchesAccount =
      accountFilter === 'ALL' ||
      (tx.account && tx.account.toLowerCase().includes(accountFilter.toLowerCase())) ||
      (accountFilter.toLowerCase().includes('cash') && tx.account?.toLowerCase().includes('cash')) ||
      (accountFilter.toLowerCase().includes('bank') && (tx.account?.toLowerCase().includes('bank') || tx.account?.toLowerCase().includes('sbi') || tx.account?.toLowerCase().includes('hdfc')));

    const matchesType =
      typeFilter === 'ALL' ||
      tx.type === typeFilter ||
      (typeFilter === 'RECEIPT' && (tx.credit > 0 || tx.type === 'CUSTOMER_PAYMENT')) ||
      (typeFilter === 'PAYMENT' && (tx.debit > 0 || tx.type === 'DIESEL' || tx.type === 'MAINTENANCE' || tx.type === 'SALARY' || tx.type === 'EXPENSE')) ||
      (typeFilter === 'TRANSFER' && tx.type === 'TRANSFER');

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      tx.id.toLowerCase().includes(q) ||
      tx.entity.toLowerCase().includes(q) ||
      (tx.reference && tx.reference.toLowerCase().includes(q)) ||
      (tx.notes && tx.notes.toLowerCase().includes(q)) ||
      (tx.account && tx.account.toLowerCase().includes(q));

    return matchesAccount && matchesType && matchesSearch;
  });

  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Date',
      'Party / Entity',
      'Description / Reference',
      'Account',
      'Debit (Withdrawal)',
      'Credit (Deposit)',
      'Transaction Type',
      'Status',
    ];

    const rows = filteredTreasuryTransactions.map((tx) => [
      tx.id,
      tx.date,
      tx.entity,
      tx.notes || tx.reference || '—',
      tx.account || '—',
      tx.debit > 0 ? tx.debit : 0,
      tx.credit > 0 ? tx.credit : 0,
      tx.type.replace(/_/g, ' '),
      tx.status,
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    const accTag = accountFilter !== 'ALL' ? `_${accountFilter.replace(/\s+/g, '_')}` : '';
    downloadCSV(`cash_bank_transactions${accTag}_${dateStr}.csv`, headers, rows);
  };

  const handleOpenTransfer = () => {
    setTransferAmount(10000);
    setReference(`TRF-${Date.now().toString().slice(-5)}`);
    setError('');
    setIsTransferModalOpen(true);
  };

  const handleSaveTransfer = () => {
    if (fromAccount === toAccount) {
      setError('Source and destination accounts must be different.');
      return;
    }
    if (transferAmount <= 0) {
      setError('Transfer amount must be greater than zero.');
      return;
    }
    const sourceAcc = accounts.find((a) => a.name === fromAccount);
    if (sourceAcc && sourceAcc.balance < transferAmount) {
      setError(`Insufficient balance in ${fromAccount} (${formatCurrency(sourceAcc.balance)}).`);
      return;
    }

    recordAccountTransfer(fromAccount, toAccount, transferAmount, reference, 'Anitha S');
    setIsConfirmOpen(false);
    setIsTransferModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Treasury, Cash & Bank Accounts"
        description="Liquid asset management · Balances are strictly derived from posted transactions and internal transfers"
      >
        <button onClick={handleOpenTransfer} className="btn-primary">
          <RefreshCw size={15} />
          Internal Fund Transfer
        </button>
      </PageHeader>

      {/* ACCOUNT BALANCES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {accounts.map((a) => (
          <div key={a.id} className="p-5 bg-white rounded-lg border border-[#D9DBD6] shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
                  {a.type} Account
                </span>
                <strong className="text-sm font-bold text-[#16425B] block mt-0.5">{a.name}</strong>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#edf7fc] text-[#1c648d] border border-[#81c4d7]">
                Active
              </span>
            </div>

            <div className="my-4">
              <span className="text-[10px] text-[#5A6E7F] block">Current Derived Balance:</span>
              <strong className="text-2xl font-bold text-[#16425B]">
                {formatCurrency(a.balance)}
              </strong>
            </div>

            <div className="pt-3 border-t border-[#edf1f5] flex justify-between text-[11px] text-[#5A6E7F]">
              <span>Opening Balance: {formatCurrency(a.openingBalance)}</span>
              {a.accountNumber && <span className="font-mono">A/C: …{a.accountNumber.slice(-4)}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* TREASURY ACTIVITY MANIFEST */}
      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#16425B]">Recent Treasury Ledger Activity</h2>
            <p className="text-xs text-[#5A6E7F]">
              Total Liquid Treasury: <strong>{formatCurrency(totalTreasury)}</strong> · Showing {filteredTreasuryTransactions.length} of {treasuryTransactions.length} entries
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="btn-secondary text-xs flex items-center gap-1.5"
            title="Export filtered cash & bank transactions as CSV"
          >
            <FileText size={14} />
            Export CSV
          </button>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-3 bg-[#f8faf5] rounded-lg border border-[#D9DBD6]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-[#5A6E7F]" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, party, account..."
              className="tms-input pl-9 text-xs"
            />
          </div>

          <div>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="tms-input text-xs"
            >
              <option value="ALL">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.name}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="tms-input text-xs"
            >
              <option value="ALL">All Transaction Types</option>
              <option value="RECEIPT">Receipts (Deposit)</option>
              <option value="PAYMENT">Payments (Withdrawal)</option>
              <option value="TRANSFER">Internal Transfers</option>
              <option value="CUSTOMER_PAYMENT">Customer Payments</option>
              <option value="DIESEL">Diesel</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="SALARY">Salary / Wages</option>
              <option value="EXPENSE">Other Expenses</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Date</th>
                <th>Party / Description</th>
                <th>Account</th>
                <th>Debit (Withdrawal)</th>
                <th>Credit (Deposit)</th>
                <th>Transaction Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTreasuryTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="font-bold text-[#2F668F]">{tx.id}</td>
                  <td>{tx.date}</td>
                  <td className="text-xs text-[#16425B] max-w-xs truncate">
                    {tx.entity} · {tx.notes || tx.reference}
                  </td>
                  <td className="font-semibold text-[#16425B]">{tx.account}</td>
                  <td className="text-rose-700 font-semibold">
                    {tx.debit > 0 ? formatCurrency(tx.debit) : '—'}
                  </td>
                  <td className="text-emerald-700 font-semibold">
                    {tx.credit > 0 ? formatCurrency(tx.credit) : '—'}
                  </td>
                  <td>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[#f8faf5] text-[#16425B] border">
                      {tx.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={tx.status} />
                  </td>
                </tr>
              ))}
              {filteredTreasuryTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-[#5A6E7F] text-xs">
                    No transactions match the selected account, type, or search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INTERNAL FUND TRANSFER MODAL */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Execute Internal Fund Transfer"
        subtitle="Transfer liquidity between company accounts (Transfers do not create revenue or expense)"
        maxWidth="max-w-lg"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div className="p-3 bg-[#f8faf5] border border-[#D9DBD6] rounded-lg text-[#16425B]">
            <strong className="block mb-1">Business Accounting Rule:</strong>
            Internal transfers move funds between balance sheet assets without affecting revenue, customer receivables, or vendor expenses.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Source Account (Debit) *</label>
              <select
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
                className="tms-input"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name} ({formatCurrency(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Destination Account (Credit) *</label>
              <select
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
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
              <label className="block text-xs font-bold text-[#16425B] mb-1">Transfer Amount (₹) *</label>
              <input
                type="number"
                value={transferAmount || ''}
                onChange={(e) => setTransferAmount(Number(e.target.value))}
                className="tms-input font-bold text-[#16425B]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#16425B] mb-1">Transfer Reference (optional)</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. Cheque self-withdrawal for yard cash"
                className="tms-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#D9DBD6]">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="btn-primary"
            >
              Execute Transfer
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Execute Internal Fund Transfer?"
        message={`Transfer ${formatCurrency(transferAmount)} from "${fromAccount}" to "${toAccount}"? This updates account balances immediately.`}
        confirmLabel="Confirm Transfer"
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleSaveTransfer}
      />
    </div>
  );
}
