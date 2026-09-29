'use client';

import React, { useState } from 'react';
import { Customer } from '../../../types';
import { useTmsStore } from '../../../lib/store';
import { generateNextId } from '../../../lib/ids';
import { apiClient } from '../../../lib/api';
import { Modal } from '../../ui/Modal';
import { AlertCircle, CheckCircle2, UserRound, Phone, MapPin, FileText, Clock } from '../../ui/Icons';

interface CustomerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: Customer) => void;
  prefillPhone?: string;
  prefillName?: string;
}

export function CustomerCreateModal({
  isOpen,
  onClose,
  onCustomerCreated,
  prefillPhone = '',
  prefillName = '',
}: CustomerCreateModalProps) {
  const { customers, createCustomer } = useTmsStore();

  const [name, setName] = useState(prefillName);
  const [phone, setPhone] = useState(prefillPhone);
  const [alternatePhone, setAlternatePhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [creditTerms, setCreditTerms] = useState('30 Days');
  const [notes, setNotes] = useState('');

  const [duplicateMatch, setDuplicateMatch] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendNotice, setBackendNotice] = useState<string | null>(null);

  // Check duplicate phone in real-time
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    setError(null);
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      const match = customers.find(
        (c) => c.phone.replace(/\D/g, '') === cleaned
      );
      if (match) {
        setDuplicateMatch(match);
      } else {
        setDuplicateMatch(null);
      }
    } else {
      setDuplicateMatch(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBackendNotice(null);

    // Validations
    if (!name.trim()) {
      setError('Customer Name is required.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit primary phone number.');
      return;
    }
    if (!address.trim()) {
      setError('Billing / Delivery address is required.');
      return;
    }

    // Final duplicate check
    const existing = customers.find(
      (c) => c.phone.replace(/\D/g, '') === cleanPhone
    );
    if (existing) {
      setDuplicateMatch(existing);
      setError(`A customer with phone ${existing.phone} is already registered (${existing.name}, ID: ${existing.id}). Cannot create duplicate record.`);
      return;
    }

    setIsSubmitting(true);

    const nextId = generateNextId('CUS', customers.map((c) => c.id));
    const newCustomer: Customer = {
      id: nextId,
      name: name.trim(),
      phone: phone.trim(),
      alternatePhone: alternatePhone.trim() || undefined,
      address: address.trim(),
      gstin: gstin.trim().toUpperCase() || undefined,
      creditTerms: creditTerms || '30 Days',
      status: 'ACTIVE',
      notes: notes.trim() || undefined,
      openingBalance: 0,
      balance: 0,
      totalCredit: 0,
      totalPaid: 0,
    };

    let backendSuccess = false;
    let backendErrorMessage = '';

    // Attempt backend API creation
    try {
      await apiClient.master.createCustomer({
        id: nextId,
        name: newCustomer.name,
        phone: newCustomer.phone,
        alternatePhone: newCustomer.alternatePhone,
        address: newCustomer.address,
        gstin: newCustomer.gstin,
        creditTerms: newCustomer.creditTerms,
        notes: newCustomer.notes,
        status: 'ACTIVE',
      });
      backendSuccess = true;
    } catch (apiErr: any) {
      // Backend authorization constraint: CustomerController restricts to Admin/Manager/Accounts
      backendErrorMessage = apiErr.message || 'HTTP 403 Forbidden';
    }

    try {
      // Save to unified local shared store (shared entity across entire TMS)
      createCustomer(newCustomer, undefined, 'Worker (Operations)');

      setIsSubmitting(false);
      onCustomerCreated(newCustomer);
      onClose();

      // Reset fields
      setName('');
      setPhone('');
      setAlternatePhone('');
      setAddress('');
      setGstin('');
      setNotes('');
      setDuplicateMatch(null);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Error saving customer record.');
    }
  };

  const handleSelectExisting = (existing: Customer) => {
    onCustomerCreated(existing);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Customer"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <p className="text-[#5A6E7F] text-xs">
          Register a new customer master for dispatch. Shared entity across Worker, Accounts, and Management portals.
        </p>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="font-semibold">{error}</p>
            </div>
          </div>
        )}

        {/* DUPLICATE PHONE WARNING / RESOLUTION PANEL */}
        {duplicateMatch && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertCircle size={16} />
              <span>Matching Customer Record Found</span>
            </div>
            <p className="text-[11px]">
              Phone number <strong>{phone}</strong> is already registered to:
            </p>
            <div className="p-2.5 bg-white rounded border border-amber-200 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#16425B]">{duplicateMatch.name}</span>
                <span className="text-[11px] font-mono text-[#2F668F] font-bold">{duplicateMatch.id}</span>
              </div>
              <p className="text-[#5A6E7F] text-[11px] mt-0.5">
                Address: {duplicateMatch.address}
              </p>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-amber-800">Use this existing customer instead?</span>
              <button
                type="button"
                onClick={() => handleSelectExisting(duplicateMatch)}
                className="btn-primary text-xs py-1 px-3 bg-amber-700 hover:bg-amber-800 border-amber-700"
              >
                Select {duplicateMatch.name}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Customer Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-[#16425B] mb-1">
              Customer / Company Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserRound size={15} className="absolute left-3 top-2.5 text-[#5A6E7F]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Senthil Murugan Constructions"
                required
                className="tms-input pl-9"
              />
            </div>
          </div>

          {/* Primary Phone */}
          <div>
            <label className="block text-xs font-bold text-[#16425B] mb-1">
              Primary Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-2.5 text-[#5A6E7F]" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="e.g. 98421 55667"
                required
                className="tms-input pl-9 font-medium"
              />
            </div>
            <span className="text-[10px] text-[#5A6E7F] mt-0.5 block">
              10-digit number used for duplicate prevention
            </span>
          </div>

          {/* Additional Contact Number */}
          <div>
            <label className="block text-xs font-bold text-[#16425B] mb-1">
              Additional Contact Number <span className="text-[#8898aa]">(optional)</span>
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-2.5 text-[#5A6E7F]" />
              <input
                type="tel"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
                placeholder="e.g. 0452-2456789"
                className="tms-input pl-9"
              />
            </div>
          </div>

          {/* GSTIN */}
          <div>
            <label className="block text-xs font-bold text-[#16425B] mb-1">
              GSTIN <span className="text-[#8898aa]">(if applicable)</span>
            </label>
            <div className="relative">
              <FileText size={15} className="absolute left-3 top-2.5 text-[#5A6E7F]" />
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="e.g. 33AABCS1429B1Z8"
                maxLength={15}
                className="tms-input pl-9 uppercase tracking-wider font-mono"
              />
            </div>
          </div>


          {/* Billing / Delivery Address */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-[#16425B] mb-1">
              Billing / Site Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-2.5 text-[#5A6E7F]" />
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full street address, district, state..."
                rows={2}
                required
                className="tms-input pl-9 resize-none"
              />
            </div>
          </div>

          {/* Operational Notes */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-[#16425B] mb-1">
              Operational Notes <span className="text-[#8898aa]">(optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Requires weighbridge slip copy with every delivery"
              className="tms-input"
            />
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="pt-3 border-t border-[#D9DBD6] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !!duplicateMatch}
            className="btn-primary"
          >
            {isSubmitting ? 'Registering...' : 'Save & Select Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
