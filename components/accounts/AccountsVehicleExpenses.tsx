'use client';

import React, { useState } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency } from '../../lib/calculations';
import { Plus, Wrench, Truck } from '../ui/Icons';
import { VehicleExpense } from '../../types';
import { generateNextId } from '../../lib/ids';

export function AccountsVehicleExpenses() {
  const { vehicles, vehicleExpenses, accounts, recordVehicleExpense } = useTmsStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Form state
  const [selectedReg, setSelectedReg] = useState<string>(vehicles[0]?.registration || '');
  const [expenseType, setExpenseType] = useState<VehicleExpense['expenseType']>('Maintenance');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'BANK' | 'UPI' | 'ONLINE' | 'OTHER'>('BANK');
  const [targetAccount, setTargetAccount] = useState<string>(accounts[0]?.name || 'State Bank of India (Main A/C)');
  const [supplier, setSupplier] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const selectedVehicle = vehicles.find((v) => v.registration === selectedReg) || vehicles[0];

  const handlePostExpense = () => {
    if (amount <= 0) {
      setError('Expense amount must be greater than zero.');
      return;
    }

    const nextId = generateNextId('VEX', vehicleExpenses.map((e) => e.id));
    const now = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const newExpense: VehicleExpense = {
      id: nextId,
      vehicleRegistration: selectedReg,
      expenseType,
      date: now,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      amount,
      paymentMode,
      account: targetAccount,
      serviceStationSupplier: supplier || 'Authorized Service Station',
      billNumber: billNumber || `BILL-${Date.now().toString().slice(-5)}`,
      notes,
      status: 'POSTED',
      createdBy: 'Anitha S',
    };

    recordVehicleExpense(newExpense, 'Anitha S');
    setIsConfirmOpen(false);
    setIsModalOpen(false);
    setAmount(0);
    setSupplier('');
    setBillNumber('');
    setNotes('');
  };

  return (
    <div>
      <PageHeader
        title="Vehicle Expenses & Fleet Maintenance"
        description="Record fleet operational expenses · Vehicle master data is read-only"
      >
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={16} />
          Log Vehicle Expense
        </button>
      </PageHeader>

      {/* FLEET COMPLIANCE & ASSET CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {vehicles.map((v) => (
          <div key={v.registration} className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
            <div className="flex justify-between items-start">
              <div>
                <strong className="text-sm font-bold text-[#16425B] block">{v.registration}</strong>
                <span className="text-xs text-[#5A6E7F]">{v.type} ({v.ownership})</span>
              </div>
              <StatusBadge status={v.status} />
            </div>

            <div className="mt-3 pt-3 border-t border-[#edf1f5] grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[#5A6E7F] block">Payload Capacity:</span>
                <strong>{v.capacity}</strong>
              </div>
              <div>
                <span className="text-[#5A6E7F] block">Odometer KM:</span>
                <strong>{v.currentKm.toLocaleString('en-IN')} KM</strong>
              </div>
              <div>
                <span className="text-[#5A6E7F] block">Fitness (FC) Expiry:</span>
                <span className="text-[#16425B] font-semibold">{v.fcExpiry || '2027-01-20'}</span>
              </div>
              <div>
                <span className="text-[#5A6E7F] block">Insurance Expiry:</span>
                <span className="text-[#16425B] font-semibold">{v.insuranceExpiry || '2027-03-15'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* VEHICLE EXPENSES TABLE */}
      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5">
        <h2 className="text-sm font-bold text-[#16425B] mb-3">Vehicle Expense Records</h2>
        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>Expense ID</th>
                <th>Date & Time</th>
                <th>Vehicle No</th>
                <th>Expense Type</th>
                <th>Amount</th>
                <th>Supplier / Workshop</th>
                <th>Bill / Reference</th>
                <th>Payment Account</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicleExpenses.map((exp) => (
                <tr key={exp.id}>
                  <td className="font-bold text-[#2F668F]">{exp.id}</td>
                  <td>{exp.date} {exp.time}</td>
                  <td className="font-bold text-[#16425B]">{exp.vehicleRegistration}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded bg-[#f0f4f8] text-[#16425B] text-xs font-semibold">
                      {exp.expenseType}
                    </span>
                  </td>
                  <td className="font-bold text-rose-700">{formatCurrency(exp.amount)}</td>
                  <td>{exp.serviceStationSupplier || '—'}</td>
                  <td>{exp.billNumber || '—'}</td>
                  <td className="text-xs text-[#5A6E7F]">{exp.account}</td>
                  <td>
                    <StatusBadge status={exp.status} />
                  </td>
                </tr>
              ))}
              {vehicleExpenses.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-[#5A6E7F]">
                    No vehicle maintenance or repair expenses logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW VEHICLE EXPENSE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Vehicle Expense / Maintenance"
        subtitle="Debit treasury account and attach expense to specific vehicle asset"
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
              <label className="block text-xs font-bold text-[#16425B] mb-1">Vehicle Registration *</label>
              <select
                value={selectedReg}
                onChange={(e) => setSelectedReg(e.target.value)}
                className="tms-input font-semibold text-[#16425B]"
              >
                {vehicles.map((v) => (
                  <option key={v.registration} value={v.registration}>
                    {v.registration} ({v.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Expense Type *</label>
              <select
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value as any)}
                className="tms-input"
              >
                <option value="Maintenance">Scheduled Maintenance</option>
                <option value="Repair">Breakdown Repair</option>
                <option value="Service">Oil & Grease Service</option>
                <option value="Tyre">Tyre Retread / Replacement</option>
                <option value="Spare Parts">Spare Parts Purchase</option>
                <option value="FC / Permit">FC / Fitness Renewal</option>
                <option value="Insurance">Insurance Premium</option>
                <option value="Other">Other Vehicle Expense</option>
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

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="tms-input"
              >
                <option value="BANK">Bank Transfer / NEFT</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI / Online</option>
              </select>
            </div>

            <div className="sm:col-span-2">
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

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Workshop / Supplier</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. Madurai Auto Garage"
                className="tms-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Bill / Invoice Number</label>
              <input
                type="text"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="e.g. MAG-4891"
                className="tms-input"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#16425B] mb-1">Work Description / Remarks</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Front wheel bearing and brake shoe replacement"
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
              Post Vehicle Expense
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Post Vehicle Expense?"
        message={`This will post ${formatCurrency(amount)} for ${selectedReg} (${expenseType}) debited from ${targetAccount}. Continue?`}
        confirmLabel="Confirm & Post"
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handlePostExpense}
      />
    </div>
  );
}
