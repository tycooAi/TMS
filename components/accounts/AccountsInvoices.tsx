'use client';

import React, { useState } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency } from '../../lib/calculations';
import { FileText, Plus, Printer, Check } from '../ui/Icons';
import { Invoice, InvoiceLineItem, Trip } from '../../types';
import { generateNextId } from '../../lib/ids';

export function AccountsInvoices() {
  const { invoices, trips, customers, createInvoice } = useTmsStore();

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // New Invoice generator state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [gstPercent, setGstPercent] = useState<number>(5);
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Uninvoiced delivered trips for selected customer
  const eligibleTrips = trips.filter(
    (t) =>
      t.customerId === selectedCustomerId &&
      (t.status === 'DELIVERED' || t.status === 'COMPLETED') &&
      !t.invoiceId
  );

  const selectedTrips = eligibleTrips.filter((t) => selectedTripIds.includes(t.id));
  const subtotal = selectedTrips.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const gstAmount = Math.round((subtotal * gstPercent) / 100);
  const totalAmount = subtotal + gstAmount;

  const handleOpenGenerate = () => {
    setSelectedCustomerId(customers[0]?.id || '');
    setSelectedTripIds([]);
    setError('');
    setIsGenerateModalOpen(true);
  };

  const handleToggleTrip = (tripId: string) => {
    if (selectedTripIds.includes(tripId)) {
      setSelectedTripIds(selectedTripIds.filter((id) => id !== tripId));
    } else {
      setSelectedTripIds([...selectedTripIds, tripId]);
    }
  };

  const handleGenerateInvoice = () => {
    if (selectedTripIds.length === 0) {
      setError('Please select at least one delivered trip to invoice.');
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId);
    if (!customer) return;

    const nextInvId = generateNextId('INV', invoices.map((i) => i.id));
    const invNumber = `INV-2026-${String(invoices.length + 1).padStart(4, '0')}`;

    const lineItems: InvoiceLineItem[] = selectedTrips.map((t) => ({
      tripId: t.id,
      date: t.date,
      vehicle: t.vehicleRegistration,
      material: t.material,
      quantity: t.quantity,
      unit: t.unit,
      rate: t.appliedRate,
      amount: t.totalAmount || t.quantity * t.appliedRate,
    }));

    const newInvoice: Invoice = {
      id: nextInvId,
      invoiceNumber: invNumber,
      date: invoiceDate,
      customerId: customer.id,
      customerName: customer.name,
      customerAddress: customer.address,
      customerGstin: customer.gstin,
      lineItems,
      subtotal,
      gstRate: gstPercent,
      gstAmount,
      totalAmount,
      receivedAmount: 0,
      outstandingAmount: totalAmount,
      status: 'GENERATED',
      notes,
    };

    createInvoice(newInvoice, 'Anitha S');
    setIsConfirmOpen(false);
    setIsGenerateModalOpen(false);
    setSelectedInvoice(newInvoice);
  };

  return (
    <div>
      <PageHeader
        title="Commercial Tax Invoices"
        description="Billing lifecycle management · Multi-trip consolidation, GST calculation, and printouts"
      >
        <button onClick={handleOpenGenerate} className="btn-primary">
          <Plus size={16} />
          Generate Invoice
        </button>
      </PageHeader>

      {/* INVOICES TABLE */}
      <div className="table-container">
        <table className="tms-table">
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Trips Included</th>
              <th>Subtotal</th>
              <th>GST</th>
              <th>Total Amount</th>
              <th>Received</th>
              <th>Outstanding</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="font-bold text-[#2F668F]">
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="hover:underline font-bold text-left"
                  >
                    {inv.invoiceNumber}
                  </button>
                </td>
                <td>{inv.date}</td>
                <td className="font-semibold text-[#16425B]">{inv.customerName}</td>
                <td className="text-xs text-[#5A6E7F]">
                  {inv.lineItems.map((li) => li.tripId).join(', ') || 'Direct order'}
                </td>
                <td>{formatCurrency(inv.subtotal)}</td>
                <td className="text-xs text-[#5A6E7F]">{formatCurrency(inv.gstAmount)}</td>
                <td className="font-bold text-[#16425B]">{formatCurrency(inv.totalAmount)}</td>
                <td className="text-emerald-700 font-semibold">{formatCurrency(inv.receivedAmount)}</td>
                <td className="font-bold text-amber-800">{formatCurrency(inv.outstandingAmount)}</td>
                <td>
                  <StatusBadge status={inv.status} />
                </td>
                <td>
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1"
                  >
                    <Printer size={13} />
                    View / Print
                  </button>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center py-10 text-[#5A6E7F]">
                  No invoices generated yet. Click Generate Invoice to bill delivered trips.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* GENERATE INVOICE MODAL */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate Commercial Tax Invoice"
        subtitle="Consolidate completed trips into an official invoice"
        maxWidth="max-w-2xl"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Customer Account</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setSelectedTripIds([]);
                }}
                className="tms-input"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Invoice Date</label>
              <input
                type="text"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="tms-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#16425B] mb-1">
              Select Delivered Trips for Billing ({eligibleTrips.length} Available)
            </label>
            <div className="border border-[#D9DBD6] rounded-lg max-h-48 overflow-y-auto divide-y divide-[#D9DBD6]">
              {eligibleTrips.map((trip) => {
                const isChecked = selectedTripIds.includes(trip.id);
                return (
                  <div
                    key={trip.id}
                    onClick={() => handleToggleTrip(trip.id)}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isChecked ? 'bg-[#e8f1f5]' : 'hover:bg-[#f8faf5]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-[#2F668F]"
                      />
                      <div>
                        <p className="font-bold text-[#16425B]">
                          {trip.id} · {trip.material} ({trip.quantity} {trip.unit})
                        </p>
                        <p className="text-[11px] text-[#5A6E7F]">
                          Vehicle: {trip.vehicleRegistration} · Delivered on {trip.date} · Rate: ₹{trip.appliedRate}/{trip.unit}
                        </p>
                      </div>
                    </div>
                    <strong className="text-xs text-[#16425B]">
                      {formatCurrency(trip.totalAmount || 0)}
                    </strong>
                  </div>
                );
              })}

              {eligibleTrips.length === 0 && (
                <div className="p-6 text-center text-[#5A6E7F]">
                  No unbilled delivered trips for this customer.
                </div>
              )}
            </div>
          </div>

          {/* TOTALS COMPUTATION */}
          <div className="p-4 bg-[#f8faf5] border border-[#D9DBD6] rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-[#5A6E7F]">Subtotal ({selectedTrips.length} Trips):</span>
              <strong className="text-[#16425B]">{formatCurrency(subtotal)}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#5A6E7F]">GST Tax Rate (%):</span>
              <select
                value={gstPercent}
                onChange={(e) => setGstPercent(Number(e.target.value))}
                className="tms-input w-24 h-7 text-xs"
              >
                <option value={0}>0%</option>
                <option value={5}>5% (Transport GST)</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
              </select>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5A6E7F]">GST Tax Amount:</span>
              <span>{formatCurrency(gstAmount)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#D9DBD6] font-bold text-sm">
              <span className="text-[#16425B]">Total Invoice Amount:</span>
              <span className="text-[#2F668F]">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#16425B] mb-1">Notes / PO Reference</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Work order #WO-9982"
              className="tms-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#D9DBD6]">
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedTripIds.length === 0}
              onClick={() => setIsConfirmOpen(true)}
              className="btn-primary"
            >
              Generate Invoice ({formatCurrency(totalAmount)})
            </button>
          </div>
        </div>
      </Modal>

      {/* PRINT-READY INVOICE DETAIL VIEW */}
      {selectedInvoice && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          subtitle={`Commercial Tax Invoice · Date: ${selectedInvoice.date}`}
          maxWidth="max-w-3xl"
        >
          <div className="p-4 border border-[#D9DBD6] rounded-lg bg-white space-y-6 text-xs print:border-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h1 className="text-base font-black text-[#16425B] tracking-wide">
                  TRANSLOGIX FREIGHT CARRIERS
                </h1>
                <p className="text-[11px] text-[#5A6E7F]">Bypass Road, Madurai - 625016, Tamil Nadu</p>
                <p className="text-[11px] text-[#5A6E7F]">GSTIN: 33AAACT9920A1Z2</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm text-[#2F668F] block">
                  {selectedInvoice.invoiceNumber}
                </span>
                <span className="text-[#5A6E7F]">Date: {selectedInvoice.date}</span>
                <div className="mt-1">
                  <StatusBadge status={selectedInvoice.status} />
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-[#5A6E7F] uppercase tracking-wider text-[10px]">
                  Billed To:
                </p>
                <strong className="text-sm font-bold text-[#16425B] block mt-1">
                  {selectedInvoice.customerName}
                </strong>
                <p className="text-[#5A6E7F] mt-0.5">{selectedInvoice.customerAddress}</p>
                {selectedInvoice.customerGstin && (
                  <p className="font-mono text-[11px] mt-1 text-[#16425B]">
                    GSTIN: {selectedInvoice.customerGstin}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-[#5A6E7F] uppercase tracking-wider text-[10px]">
                  Payment Status:
                </p>
                <div className="mt-1 space-y-1">
                  <p>
                    Total Billed: <strong>{formatCurrency(selectedInvoice.totalAmount)}</strong>
                  </p>
                  <p className="text-emerald-700">
                    Paid: <strong>{formatCurrency(selectedInvoice.receivedAmount)}</strong>
                  </p>
                  <p className="text-amber-800 font-bold">
                    Balance Due: {formatCurrency(selectedInvoice.outstandingAmount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Line items table */}
            <div className="border border-[#D9DBD6] rounded overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#f8faf5] border-b border-[#D9DBD6]">
                  <tr>
                    <th className="p-2.5 font-bold text-[#5A6E7F]">Trip Ref</th>
                    <th className="p-2.5 font-bold text-[#5A6E7F]">Date</th>
                    <th className="p-2.5 font-bold text-[#5A6E7F]">Vehicle</th>
                    <th className="p-2.5 font-bold text-[#5A6E7F]">Material</th>
                    <th className="p-2.5 font-bold text-[#5A6E7F]">Quantity</th>
                    <th className="p-2.5 font-bold text-[#5A6E7F]">Rate</th>
                    <th className="p-2.5 font-bold text-[#5A6E7F] text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1f5]">
                  {selectedInvoice.lineItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold text-[#2F668F]">{item.tripId}</td>
                      <td className="p-2.5">{item.date}</td>
                      <td className="p-2.5 font-semibold">{item.vehicle}</td>
                      <td className="p-2.5">{item.material}</td>
                      <td className="p-2.5">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="p-2.5">₹{item.rate}</td>
                      <td className="p-2.5 text-right font-bold text-[#16425B]">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#5A6E7F]">Subtotal:</span>
                  <strong className="text-[#16425B]">{formatCurrency(selectedInvoice.subtotal)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6E7F]">GST ({selectedInvoice.gstRate}%):</span>
                  <span>{formatCurrency(selectedInvoice.gstAmount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-bold text-sm text-[#16425B]">
                  <span>Total Amount:</span>
                  <span className="text-[#2F668F]">
                    {formatCurrency(selectedInvoice.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-between items-center">
              <span className="text-[11px] text-[#5A6E7F]">
                Computer generated invoice · Authorized Translogix Freight Systems
              </span>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="btn-primary">
                  <Printer size={15} />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Confirm Invoice Generation?"
        message={`This will issue ${formatCurrency(totalAmount)} to ${customers.find((c) => c.id === selectedCustomerId)?.name}. A credit receivable transaction will be created.`}
        confirmLabel="Generate Invoice"
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleGenerateInvoice}
      />
    </div>
  );
}
