'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency } from '../../lib/calculations';
import { DollarSign, FileText, Plus } from '../ui/Icons';
import { Payment } from '../../types';
import { generateNextId } from '../../lib/ids';

interface AccountsCustomerDetailProps {
  customerId: string;
}

export function AccountsCustomerDetail({ customerId }: AccountsCustomerDetailProps) {
  const router = useRouter();
  const { customers, invoices, transactions, payments, accounts, recordCustomerPayment } = useTmsStore();

  const customer = customers.find((c) => c.id === customerId);

  // Modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'BANK' | 'UPI' | 'ONLINE' | 'OTHER'>('UPI');
  const [targetAccount, setTargetAccount] = useState(accounts[0]?.name || 'State Bank of India (Main A/C)');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [allocationStrategy, setAllocationStrategy] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [error, setError] = useState('');

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-xs text-[#5A6E7F]">Customer account not found.</p>
        <Link href="/accounts/customers" className="btn-primary mt-4">
          Back to Customer Master
        </Link>
      </div>
    );
  }

  // Open invoices for this customer
  const customerInvoices = invoices.filter(
    (inv) => inv.customerId === customer.id && inv.outstandingAmount > 0
  );

  // Customer transactions history
  const customerHistory = transactions.filter(
    (tx) => tx.entityId === customer.id || tx.entity.toLowerCase().includes(customer.name.toLowerCase())
  );

  const handleOpenPayment = () => {
    setPaymentAmount(customer.balance > 0 ? customer.balance : 10000);
    setPaymentReference(`REF-${Date.now().toString().slice(-6)}`);
    setError('');
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = () => {
    if (paymentAmount <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    const payId = generateNextId('PAY', payments.map((p) => p.id));
    const now = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // Allocate across open invoices
    let remaining = paymentAmount;
    const allocations: { invoiceId: string; amount: number }[] = [];

    for (const inv of customerInvoices) {
      if (remaining <= 0) break;
      const allocAmt = Math.min(remaining, inv.outstandingAmount);
      allocations.push({ invoiceId: inv.id, amount: allocAmt });
      remaining -= allocAmt;
    }

    const newPayment: Payment = {
      id: payId,
      date: now,
      customerId: customer.id,
      customerName: customer.name,
      amount: paymentAmount,
      mode: paymentMode,
      accountId: accounts.find((a) => a.name === targetAccount)?.id || 'acc_default',
      accountName: targetAccount,
      reference: paymentReference,
      allocations,
      notes: paymentNotes || 'Customer payment posted against ledger statement',
      recordedBy: 'Anitha S',
    };

    recordCustomerPayment(newPayment, 'Anitha S');
    setIsConfirmOpen(false);
    setIsPaymentModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={`Customer Account Ledger: ${customer.id} · Phone: ${customer.phone}`}
        badge={<StatusBadge status={customer.status} />}
      >
        <button onClick={handleOpenPayment} className="btn-primary">
          <DollarSign size={16} />
          Record Payment
        </button>
        <Link href="/accounts/customers" className="btn-secondary">
          Customer Roster
        </Link>
      </PageHeader>

      {/* FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Current Outstanding Balance
          </span>
          <strong className="text-2xl font-bold text-[#b45309] block my-1">
            {formatCurrency(customer.balance)}
          </strong>
          <span className="text-xs text-[#5A6E7F]">Strictly derived from postings</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Total Billed / Credit
          </span>
          <strong className="text-2xl font-bold text-[#16425B] block my-1">
            {formatCurrency(customer.totalCredit)}
          </strong>
          <span className="text-xs text-[#5A6E7F]">Cumulative billing volume</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Total Payments Received
          </span>
          <strong className="text-2xl font-bold text-emerald-700 block my-1">
            {formatCurrency(customer.totalPaid)}
          </strong>
          <span className="text-xs text-[#5A6E7F]">Verified posted receipts</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Payment Terms & GST
          </span>
          <strong className="text-base font-bold text-[#16425B] block my-1 truncate">
            {customer.creditTerms || 'Standard'}
          </strong>
          <span className="text-xs text-[#5A6E7F] block font-mono">
            {customer.gstin || 'Unregistered'}
          </span>
        </div>
      </div>

      {/* OPEN INVOICES STRIP */}
      {customerInvoices.length > 0 && (
        <div className="bg-white rounded-lg border border-[#D9DBD6] p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-bold text-[#16425B] uppercase tracking-wider">
                Open Pending Invoices ({customerInvoices.length})
              </h2>
              <p className="text-xs text-[#5A6E7F]">Invoices awaiting payment clearance</p>
            </div>
          </div>

          <div className="table-container">
            <table className="tms-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Subtotal</th>
                  <th>GST</th>
                  <th>Total Amount</th>
                  <th>Received</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customerInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-bold text-[#2F668F]">{inv.invoiceNumber}</td>
                    <td>{inv.date}</td>
                    <td>{formatCurrency(inv.subtotal)}</td>
                    <td>{formatCurrency(inv.gstAmount)}</td>
                    <td className="font-bold">{formatCurrency(inv.totalAmount)}</td>
                    <td className="text-emerald-700 font-semibold">{formatCurrency(inv.receivedAmount)}</td>
                    <td className="text-amber-800 font-bold">{formatCurrency(inv.outstandingAmount)}</td>
                    <td>
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ACCOUNT TRANSACTION LEDGER */}
      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#16425B]">Customer Account Ledger Statement</h2>
            <p className="text-xs text-[#5A6E7F]">
              Audit trail of debits (billings/credits) and credits (receipts)
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="btn-secondary py-1 px-3 text-xs"
          >
            Print Statement
          </button>
        </div>

        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction ID</th>
                <th>Description / Reference</th>
                <th>Billing (Debit)</th>
                <th>Payment (Credit)</th>
                <th>Mode</th>
                <th>Account</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customerHistory.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.date}</td>
                  <td className="font-bold text-[#2F668F]">{tx.id}</td>
                  <td className="text-xs text-[#16425B] max-w-xs truncate">
                    {tx.notes || tx.reference || tx.type.replace(/_/g, ' ')}
                  </td>
                  <td className="font-semibold text-rose-700">
                    {tx.debit > 0 ? formatCurrency(tx.debit) : '—'}
                  </td>
                  <td className="font-semibold text-emerald-700">
                    {tx.credit > 0 ? formatCurrency(tx.credit) : '—'}
                  </td>
                  <td>{tx.paymentMode || '—'}</td>
                  <td className="text-xs text-[#5A6E7F]">{tx.account || 'Receivable'}</td>
                  <td>
                    <StatusBadge status={tx.status} />
                  </td>
                </tr>
              ))}
              {customerHistory.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-[#5A6E7F]">
                    No transactions recorded for this customer yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD CUSTOMER PAYMENT MODAL */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Record Customer Payment: ${customer.name}`}
        subtitle="Post customer receipt, allocate across invoices, and update account balance"
        maxWidth="max-w-xl"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div className="p-3 bg-[#f8faf5] border border-[#D9DBD6] rounded-lg flex justify-between items-center">
            <span className="text-[#5A6E7F]">Current Customer Outstanding:</span>
            <strong className="text-sm font-bold text-amber-800">
              {formatCurrency(customer.balance)}
            </strong>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Payment Amount (₹) *
              </label>
              <input
                type="number"
                value={paymentAmount || ''}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
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
                <option value="UPI">UPI / QR Payment</option>
                <option value="BANK">Bank Transfer / NEFT</option>
                <option value="CASH">Cash in Hand</option>
                <option value="ONLINE">Cheque Deposit</option>
                <option value="OTHER">Other Adjustment</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#16425B] mb-1">Deposit To Account</label>
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

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Bank / UPI Transaction Reference
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. UPI/260913/49102"
                className="tms-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Invoice Allocation Mode
              </label>
              <select
                value={allocationStrategy}
                onChange={(e) => setAllocationStrategy(e.target.value as any)}
                className="tms-input"
              >
                <option value="AUTO">Automatic (FIFO across open invoices)</option>
                <option value="MANUAL">Specific Invoices</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#16425B] mb-1">Remarks / Notes</label>
              <input
                type="text"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="e.g. Received via WhatsApp receipt confirmation"
                className="tms-input"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
            <strong>Resulting Balance After Post:</strong>{' '}
            {formatCurrency(Math.max(0, customer.balance - paymentAmount))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#D9DBD6]">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="btn-primary"
            >
              Review & Post Payment
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Post Customer Payment?"
        message={`This will post a receipt of ${formatCurrency(paymentAmount)} from ${customer.name} into ${targetAccount}. Financial postings are permanent and locked.`}
        confirmLabel="Post Payment"
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleSavePayment}
      />
    </div>
  );
}
