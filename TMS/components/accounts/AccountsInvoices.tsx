'use client';

import React, { useState } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency } from '../../lib/calculations';
import { FileText, Plus, Printer, Check, Search } from '../ui/Icons';
import { Invoice, InvoiceLineItem, Trip } from '../../types';
import { generateNextId } from '../../lib/ids';
import { downloadCSV } from '../../lib/csvExport';

export function AccountsInvoices() {
  const { invoices, trips, customers, createInvoice } = useTmsStore();

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // List filters
  const [filterCustomerId, setFilterCustomerId] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // New Invoice generator state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [isManualItem, setIsManualItem] = useState(false);
  const [manualDescription, setManualDescription] = useState('20mm Aggregate Supply & Transportation');
  const [manualVehicle, setManualVehicle] = useState('TN 58 AB 2345');
  const [manualQty, setManualQty] = useState(25);
  const [manualUnit, setManualUnit] = useState('Ton');
  const [manualRate, setManualRate] = useState(480);
  const [gstPercent, setGstPercent] = useState<number>(12);
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
  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);
  const eligibleTrips = trips.filter(
    (t) =>
      (t.customerId === selectedCustomerId || (currentCustomer && t.customerName?.toLowerCase() === currentCustomer.name?.toLowerCase())) &&
      !t.invoiceId
  );

  const selectedTrips = eligibleTrips.filter((t) => selectedTripIds.includes(t.id));
  const tripsSubtotal = selectedTrips.reduce((sum, t) => sum + (t.totalAmount || (t.quantity || 0) * (t.appliedRate || 0)), 0);
  const manualSubtotal = isManualItem ? Math.round(Number(manualQty || 0) * Number(manualRate || 0)) : 0;
  const subtotal = tripsSubtotal + manualSubtotal;
  const gstAmount = Math.round((subtotal * gstPercent) / 100);
  const totalAmount = subtotal + gstAmount;

  // Helper to count unbilled trips per customer
  const getCustomerUnbilledCount = (cust: typeof customers[0]) => {
    return trips.filter(
      (t) => (t.customerId === cust.id || t.customerName?.toLowerCase() === cust.name?.toLowerCase()) && !t.invoiceId
    ).length;
  };

  const handleOpenGenerate = () => {
    // Default to first customer with unbilled trips if available, otherwise first customer
    const customerWithTrips = customers.find((c) => getCustomerUnbilledCount(c) > 0);
    const targetCust = customerWithTrips || customers[0];
    const targetCustId = targetCust?.id || '';
    setSelectedCustomerId(targetCustId);

    const availableTrips = trips.filter(
      (t) =>
        (t.customerId === targetCustId || (targetCust && t.customerName?.toLowerCase() === targetCust.name?.toLowerCase())) &&
        !t.invoiceId
    );

    setSelectedTripIds(availableTrips.map((t) => t.id));
    setIsManualItem(availableTrips.length === 0);
    setGstPercent(12);
    setNotes('');
    setError('');
    setIsGenerateModalOpen(true);
  };

  const handleCustomerChange = (newCustId: string) => {
    setSelectedCustomerId(newCustId);
    const cust = customers.find((c) => c.id === newCustId);
    const available = trips.filter(
      (t) =>
        (t.customerId === newCustId || (cust && t.customerName?.toLowerCase() === cust.name?.toLowerCase())) &&
        !t.invoiceId
    );
    setSelectedTripIds(available.map((t) => t.id));
    if (available.length === 0) {
      setIsManualItem(true);
    }
  };

  const handleToggleTrip = (tripId: string) => {
    if (selectedTripIds.includes(tripId)) {
      setSelectedTripIds(selectedTripIds.filter((id) => id !== tripId));
    } else {
      setSelectedTripIds([...selectedTripIds, tripId]);
    }
  };

  const handleGenerateInvoice = async () => {
    if (totalAmount <= 0) {
      setError('Please select at least one delivered trip or add a direct billing line item with amount greater than 0.');
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId);
    if (!customer) {
      setError('Customer account not found.');
      return;
    }

    setIsSubmitting(true);
    setError('');

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

    if (isManualItem && manualSubtotal > 0) {
      lineItems.push({
        tripId: 'DIRECT-ITEM-1',
        date: invoiceDate,
        vehicle: manualVehicle || 'TN 58 AB 2345',
        material: manualDescription || '20mm Aggregate Supply & Transportation',
        quantity: Number(manualQty) || 1,
        unit: manualUnit || 'Ton',
        rate: Number(manualRate) || 0,
        amount: manualSubtotal,
      });
    }

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

    createInvoice(newInvoice, 'K. Venkat (Accounts)');

    // Backend synchronization
    try {
      const { apiClient } = await import('../../lib/api');
      const isoDate = new Date().toISOString().split('T')[0];
      const manualItemsPayload = isManualItem && manualSubtotal > 0 ? [{
        description: manualDescription,
        vehicle: manualVehicle || 'TN 58 AB 2345',
        quantity: Number(manualQty) || 1,
        unit: manualUnit || 'Ton',
        rate: Number(manualRate) || 0,
        amount: manualSubtotal,
        date: isoDate,
      }] : [];

      await apiClient.finance.generateInvoice({
        date: isoDate,
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        customerId: customer.id,
        customerName: customer.name,
        customerAddress: customer.address,
        customerGstin: customer.gstin,
        taxRate: gstPercent,
        tripIds: selectedTripIds,
        manualItems: manualItemsPayload,
        notes,
      });
    } catch (e: any) {
      console.warn('Backend sync note:', e?.message || e);
    } finally {
      setIsSubmitting(false);
      setIsConfirmOpen(false);
      setIsGenerateModalOpen(false);
      setSelectedInvoice(newInvoice);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesCust = filterCustomerId === 'ALL' || inv.customerId === filterCustomerId;
    const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus;
    const q = searchQuery.trim().toLowerCase();
    const matchesQ =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      (inv.notes && inv.notes.toLowerCase().includes(q));
    return matchesCust && matchesStatus && matchesQ;
  });

  const handleExportCSV = () => {
    const headers = [
      'Invoice Number',
      'Date',
      'Customer ID',
      'Customer Name',
      'Subtotal',
      'GST Amount',
      'Total Amount',
      'Received Amount',
      'Outstanding Amount',
      'Status',
      'Trips / Items',
      'Notes',
    ];

    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.date,
      inv.customerId,
      inv.customerName,
      inv.subtotal,
      inv.gstAmount,
      inv.totalAmount,
      inv.receivedAmount,
      inv.outstandingAmount,
      inv.status,
      inv.lineItems.map((li) => li.tripId || li.material).join('; '),
      inv.notes || '—',
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    const custTag = filterCustomerId !== 'ALL' ? `_${filterCustomerId}` : '';
    downloadCSV(`tax_invoices${custTag}_${dateStr}.csv`, headers, rows);
  };

  return (
    <div>
      <PageHeader
        title="Commercial Tax Invoices"
        description="Billing lifecycle management · Multi-trip consolidation, GST calculation, and printouts"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="btn-secondary text-xs flex items-center gap-1.5"
            title="Export filtered invoices as CSV"
          >
            <FileText size={15} />
            Export CSV ({filteredInvoices.length})
          </button>
          <button onClick={handleOpenGenerate} className="btn-primary">
            <Plus size={16} />
            Generate Invoice
          </button>
        </div>
      </PageHeader>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-lg border border-[#D9DBD6] mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-[#5A6E7F]" size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice #, customer..."
            className="tms-input pl-9 text-xs"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <select
            value={filterCustomerId}
            onChange={(e) => setFilterCustomerId(e.target.value)}
            className="tms-input text-xs w-full sm:w-56"
          >
            <option value="ALL">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.id})
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="tms-input text-xs w-full sm:w-36"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {/* INVOICES TABLE */}
      <div className="table-container">
        <table className="tms-table">
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Trips / Items</th>
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
            {filteredInvoices.map((inv) => (
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
                  {inv.lineItems.map((li) => li.tripId || li.material).join(', ') || 'Direct order'}
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
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center py-10 text-[#5A6E7F]">
                  No invoices found matching current filters.
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
        subtitle="Consolidate completed trips or add direct line items into an official invoice"
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
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="tms-input"
              >
                {customers.map((c) => {
                  const unbilled = getCustomerUnbilledCount(c);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id}) · {unbilled} {unbilled === 1 ? 'trip' : 'trips'} available
                    </option>
                  );
                })}
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

          {/* DELIVERED TRIPS SELECTION */}
          {eligibleTrips.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-[#16425B]">
                  Select Delivered Trips for Billing ({eligibleTrips.length} Available)
                </label>
                <button
                  type="button"
                  onClick={() => setIsManualItem(!isManualItem)}
                  className="text-[11px] text-[#2F668F] font-semibold hover:underline"
                >
                  {isManualItem ? '– Remove direct line item' : '+ Add direct manual line item'}
                </button>
              </div>

              <div className="border border-[#D9DBD6] rounded-lg max-h-44 overflow-y-auto divide-y divide-[#D9DBD6]">
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
                        {formatCurrency(trip.totalAmount || (trip.quantity || 0) * (trip.appliedRate || 0))}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DIRECT MANUAL BILLING ITEM SECTION */}
          {(eligibleTrips.length === 0 || isManualItem) && (
            <div className="p-3 bg-[#f2f7fa] border border-[#bcd6e5] rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-[#16425B] text-xs">
                    {eligibleTrips.length === 0 ? 'Direct Invoice Line Item (No Trips Logged)' : 'Additional Direct Line Item'}
                  </span>
                  <p className="text-[11px] text-[#5A6E7F]">
                    Enter material, quantity, and agreed rate for official invoice generation.
                  </p>
                </div>
                {eligibleTrips.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsManualItem(false)}
                    className="text-xs text-red-600 font-bold hover:underline"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[#16425B] mb-0.5">Item Description / Material</label>
                  <input
                    type="text"
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    className="tms-input text-xs"
                    placeholder="e.g. 20mm Aggregate Supply & Transportation"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#16425B] mb-0.5">Vehicle Reg (Optional)</label>
                  <input
                    type="text"
                    value={manualVehicle}
                    onChange={(e) => setManualVehicle(e.target.value)}
                    className="tms-input text-xs"
                    placeholder="e.g. TN 58 AB 2345"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#16425B] mb-0.5">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={manualQty}
                      onChange={(e) => setManualQty(Number(e.target.value))}
                      className="tms-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#16425B] mb-0.5">Unit</label>
                    <select
                      value={manualUnit}
                      onChange={(e) => setManualUnit(e.target.value)}
                      className="tms-input text-xs"
                    >
                      <option value="Ton">Ton</option>
                      <option value="Load">Load</option>
                      <option value="Cu.M">Cu.M</option>
                      <option value="Trip">Trip</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#16425B] mb-0.5">Rate (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={manualRate}
                      onChange={(e) => setManualRate(Number(e.target.value))}
                      className="tms-input text-xs"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-[#bcd6e5]">
                <span className="text-[#5A6E7F]">Item Amount:</span>
                <strong className="text-[#16425B]">{formatCurrency(manualSubtotal)}</strong>
              </div>
            </div>
          )}

          {/* TOTALS COMPUTATION */}
          <div className="p-4 bg-[#f8faf5] border border-[#D9DBD6] rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-[#5A6E7F]">
                Subtotal ({selectedTrips.length} Trips {isManualItem && manualSubtotal > 0 ? '+ Direct Item' : ''}):
              </span>
              <strong className="text-[#16425B]">{formatCurrency(subtotal)}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#5A6E7F]">GST Tax Rate (%):</span>
              <select
                value={gstPercent}
                onChange={(e) => setGstPercent(Number(e.target.value))}
                className="tms-input w-28 h-7 text-xs"
              >
                <option value={0}>0% (Exempted)</option>
                <option value={5}>5% (Transport GTA)</option>
                <option value={12}>12% (Standard Supply)</option>
                <option value={18}>18% (Commercial GST)</option>
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
              placeholder="e.g. Work order #WO-112"
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
              disabled={totalAmount <= 0 || isSubmitting}
              onClick={() => setIsConfirmOpen(true)}
              className="btn-primary"
            >
              {isSubmitting ? 'Generating...' : `Generate Invoice (${formatCurrency(totalAmount)})`}
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
                  SRI AMMAN ARUL TRANSPORTS
                </h1>
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
                <p className="text-[#5A6E7F] mt-0.5">{selectedInvoice.customerAddress || 'Project Site Office'}</p>
                {selectedInvoice.customerGstin && (
                  <p className="font-mono text-[11px] mt-1 text-[#16425B]">
                    GSTIN: {selectedInvoice.customerGstin}
                  </p>
                )}
                {selectedInvoice.notes && (
                  <p className="text-[11px] text-[#5A6E7F] mt-1">
                    Ref: <strong>{selectedInvoice.notes}</strong>
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
                    <th className="p-2.5 font-bold text-[#5A6E7F]">Trip / Ref</th>
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
                      <td className="p-2.5 font-bold text-[#2F668F]">{item.tripId || `ITEM-${idx + 1}`}</td>
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
                Computer generated invoice · Authorized Sri Amman Arul Transports
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
        message={`This will issue ${formatCurrency(totalAmount)} to ${customers.find((c) => c.id === selectedCustomerId)?.name}. A credit receivable transaction will be created in Central Ledger.`}
        confirmLabel="Generate Invoice"
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleGenerateInvoice}
      />
    </div>
  );
}
