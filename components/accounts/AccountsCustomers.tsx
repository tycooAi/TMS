'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency } from '../../lib/calculations';
import { Plus, Search, Building2, Check } from '../ui/Icons';
import { Customer } from '../../types';
import { generateNextId } from '../../lib/ids';

export function AccountsCustomers() {
  const searchParams = useSearchParams();
  const openNewInitial = searchParams?.get('new') === 'true';

  const { customers, accounts, createCustomer } = useTmsStore();
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(openNewInitial);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [creditTerms, setCreditTerms] = useState('30 Days');
  const [notes, setNotes] = useState('');

  // Financial Entry State
  const [financialKind, setFinancialKind] = useState<'NONE' | 'INSTANT' | 'CREDIT'>('NONE');
  const [openingAmount, setOpeningAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'BANK' | 'UPI' | 'ONLINE' | 'OTHER'>('UPI');
  const [targetAccount, setTargetAccount] = useState<string>(accounts[0]?.name || 'Cash in Hand');
  const [reference, setReference] = useState('');

  const filteredCustomers = customers.filter((c) => {
    const q = query.trim().toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.gstin && c.gstin.toLowerCase().includes(q))
    );
  });

  const handleValidateStep1 = () => {
    setError('');
    if (!name.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required for duplicate protection.');
      return;
    }
    // Check duplicate phone
    const cleanPhone = phone.replace(/\D/g, '');
    const exists = customers.find((c) => c.phone.replace(/\D/g, '') === cleanPhone);
    if (exists) {
      setError(`A customer with phone number ${phone} already exists (${exists.name} - ${exists.id}). Controlled master prevents duplicates.`);
      return;
    }
    setStep(2);
  };

  const handleCreateCustomer = () => {
    try {
      const nextId = generateNextId('CUS', customers.map((c) => c.id));
      const newCustomer: Customer = {
        id: nextId,
        name: name.trim(),
        phone: phone.trim(),
        alternatePhone: alternatePhone.trim() || undefined,
        address: address.trim() || 'Tamil Nadu',
        gstin: gstin.trim() || undefined,
        creditTerms: creditTerms || '30 Days',
        status: 'ACTIVE',
        notes: notes.trim() || undefined,
        openingBalance: financialKind === 'CREDIT' ? openingAmount : 0,
        balance: financialKind === 'CREDIT' ? openingAmount : 0,
        totalCredit: financialKind === 'CREDIT' ? openingAmount : 0,
        totalPaid: financialKind === 'INSTANT' ? openingAmount : 0,
      };

      let initialFin: any = undefined;
      if (financialKind !== 'NONE' && openingAmount > 0) {
        initialFin = {
          kind: financialKind,
          amount: openingAmount,
          mode: financialKind === 'INSTANT' ? paymentMode : undefined,
          accountName: targetAccount,
          reference: reference || 'Opening settlement',
        };
      }

      createCustomer(newCustomer, initialFin, 'Anitha S');
      setIsConfirmOpen(false);
      setIsModalOpen(false);
      // Reset form
      setStep(1);
      setName('');
      setPhone('');
      setAlternatePhone('');
      setAddress('');
      setGstin('');
      setNotes('');
      setFinancialKind('NONE');
      setOpeningAmount(0);
    } catch (err: any) {
      setError(err.message || 'Error creating customer.');
      setIsConfirmOpen(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Customer Master Accounts"
        description="Shared central customer master · Derived ledger balances and financial terms"
      >
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={16} />
          New Customer Entry
        </button>
      </PageHeader>

      {/* SEARCH AND TOOLS */}
      <div className="bg-white p-4 rounded-lg border border-[#D9DBD6] mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 text-[#5A6E7F]" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Customer ID, name, phone or GSTIN..."
            className="tms-input pl-9"
          />
        </div>

        <div className="text-xs text-[#5A6E7F]">
          Showing <strong>{filteredCustomers.length}</strong> registered customer accounts
        </div>
      </div>

      {/* CUSTOMERS TABLE */}
      <div className="table-container">
        <table className="tms-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Customer Name</th>
              <th>Primary Phone</th>
              <th>Address</th>
              <th>GSTIN</th>
              <th>Credit Terms</th>
              <th>Current Balance</th>
              <th>Total Billed</th>
              <th>Total Paid</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id}>
                <td className="font-bold text-[#2F668F]">
                  <Link href={`/accounts/customers/${customer.id}`} className="hover:underline">
                    {customer.id}
                  </Link>
                </td>
                <td className="font-bold text-[#16425B]">{customer.name}</td>
                <td>{customer.phone}</td>
                <td className="text-xs text-[#5A6E7F] max-w-[160px] truncate">{customer.address}</td>
                <td className="font-mono text-[11px]">{customer.gstin || '—'}</td>
                <td>{customer.creditTerms || 'Standard'}</td>
                <td className="font-bold text-[#b45309]">
                  {formatCurrency(customer.balance)}
                </td>
                <td className="text-xs text-[#5A6E7F]">
                  {formatCurrency(customer.totalCredit)}
                </td>
                <td className="text-xs text-emerald-700 font-semibold">
                  {formatCurrency(customer.totalPaid)}
                </td>
                <td>
                  <StatusBadge status={customer.status} />
                </td>
                <td>
                  <Link
                    href={`/accounts/customers/${customer.id}`}
                    className="btn-secondary py-1 px-2.5 text-xs"
                  >
                    View Ledger
                  </Link>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center py-10 text-[#5A6E7F]">
                  No matching customer accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* NEW CUSTOMER MULTI-STEP MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setStep(1);
          setError('');
        }}
        title="Register New Customer Master"
        subtitle="Step-by-step master creation and opening balance accounting"
        maxWidth="max-w-2xl"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* STEP 1: DETAILS */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#5A6E7F] uppercase tracking-wider pb-1 border-b">
              Step 1: Customer Identity & Verification
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Customer / Business Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Meenakshi Infrastructure Pvt Ltd"
                  className="tms-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Primary Mobile Phone (Duplicate Protection Key) *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="tms-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Alternate Phone / Office Contact
                </label>
                <input
                  type="tel"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                  placeholder="e.g. 0452-248100"
                  className="tms-input"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#16425B] mb-1">Address *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, Site, City, District"
                  className="tms-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">GSTIN (optional)</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="33AAAAA0000A1Z5"
                  className="tms-input uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">Credit Terms</label>
                <select
                  value={creditTerms}
                  onChange={(e) => setCreditTerms(e.target.value)}
                  className="tms-input"
                >
                  <option value="Immediate">Immediate / Advance</option>
                  <option value="7 Days">7 Days Net</option>
                  <option value="15 Days">15 Days Net</option>
                  <option value="30 Days">30 Days Net</option>
                  <option value="45 Days">45 Days Net</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#D9DBD6]">
              <button type="button" onClick={handleValidateStep1} className="btn-primary">
                Next: Financial Opening
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: FINANCIAL TYPE */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#5A6E7F] uppercase tracking-wider pb-1 border-b">
              Step 2: Opening Balance / Transaction
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFinancialKind('NONE')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  financialKind === 'NONE'
                    ? 'border-[#2F668F] bg-[#e8f1f5]'
                    : 'border-[#D9DBD6] bg-white'
                }`}
              >
                <strong className="text-xs font-bold text-[#16425B] block">Zero Balance</strong>
                <span className="text-[10px] text-[#5A6E7F]">New account with ₹0 starting balance</span>
              </button>

              <button
                type="button"
                onClick={() => setFinancialKind('INSTANT')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  financialKind === 'INSTANT'
                    ? 'border-[#2F668F] bg-[#e8f1f5]'
                    : 'border-[#D9DBD6] bg-white'
                }`}
              >
                <strong className="text-xs font-bold text-[#16425B] block">Instant Payment</strong>
                <span className="text-[10px] text-[#5A6E7F]">Deposit or advance received now</span>
              </button>

              <button
                type="button"
                onClick={() => setFinancialKind('CREDIT')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  financialKind === 'CREDIT'
                    ? 'border-[#2F668F] bg-[#e8f1f5]'
                    : 'border-[#D9DBD6] bg-white'
                }`}
              >
                <strong className="text-xs font-bold text-[#16425B] block">Credit Receivable</strong>
                <span className="text-[10px] text-[#5A6E7F]">Opening balance owed by customer</span>
              </button>
            </div>

            {financialKind !== 'NONE' && (
              <div className="p-4 bg-[#f8faf5] border border-[#D9DBD6] rounded-lg space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#16425B] mb-1">
                      {financialKind === 'INSTANT' ? 'Received Amount (₹) *' : 'Opening Due Amount (₹) *'}
                    </label>
                    <input
                      type="number"
                      value={openingAmount || ''}
                      onChange={(e) => setOpeningAmount(Number(e.target.value))}
                      placeholder="0"
                      className="tms-input font-bold text-[#16425B]"
                    />
                  </div>

                  {financialKind === 'INSTANT' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-[#16425B] mb-1">Payment Mode</label>
                        <select
                          value={paymentMode}
                          onChange={(e) => setPaymentMode(e.target.value as any)}
                          className="tms-input"
                        >
                          <option value="UPI">UPI / Online</option>
                          <option value="BANK">Bank Transfer / NEFT</option>
                          <option value="CASH">Cash</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-[#16425B] mb-1">Deposit Account</label>
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
                    </>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#16425B] mb-1">Reference / Notes</label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="e.g. Cheque #49101 or Opening balance audit"
                      className="tms-input"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-[#D9DBD6]">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                Back
              </button>
              <button type="button" onClick={() => setStep(3)} className="btn-primary">
                Next: Review & Post
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW & CONFIRM */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#5A6E7F] uppercase tracking-wider pb-1 border-b">
              Step 3: Verification & Posting Preview
            </h3>

            <div className="p-4 bg-[#f8faf5] rounded-lg border border-[#D9DBD6] text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#5A6E7F]">Customer Name:</span>
                <strong className="text-[#16425B]">{name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6E7F]">Primary Mobile:</span>
                <span>{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6E7F]">Credit Terms:</span>
                <span>{creditTerms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6E7F]">Financial Type:</span>
                <span className="font-semibold text-[#16425B]">
                  {financialKind === 'NONE'
                    ? 'Zero Balance Account'
                    : financialKind === 'INSTANT'
                    ? `Instant Payment (${formatCurrency(openingAmount)} via ${paymentMode})`
                    : `Opening Credit (${formatCurrency(openingAmount)})`}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold">
                <span className="text-[#16425B]">Initial Outstanding Balance:</span>
                <span className="text-amber-800">
                  {formatCurrency(financialKind === 'CREDIT' ? openingAmount : 0)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded border border-amber-200 text-xs text-amber-900">
              Note: This master record will be available across the Worker, Manager, MD, and Accounts portals.
            </div>

            <div className="flex justify-between pt-4 border-t border-[#D9DBD6]">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary">
                Back
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                className="btn-primary"
              >
                Save Customer Entry
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Post Customer Entry?"
        message="This customer account and any opening financial transaction will be permanently posted to the central ledger. Continue?"
        confirmLabel="Post Customer Entry"
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleCreateCustomer}
      />
    </div>
  );
}
