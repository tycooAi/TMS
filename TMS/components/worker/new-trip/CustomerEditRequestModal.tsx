'use client';

import React, { useState } from 'react';
import { Customer } from '../../../types';
import { useTmsStore } from '../../../lib/store';
import { generateNextId } from '../../../lib/ids';
import { Modal } from '../../ui/Modal';
import { Shield, AlertCircle, CheckCircle2, UserRound, Phone, MapPin, FileText, Clock } from '../../ui/Icons';

interface CustomerEditRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onRequestSubmitted?: () => void;
}

export function CustomerEditRequestModal({
  isOpen,
  onClose,
  customer,
  onRequestSubmitted,
}: CustomerEditRequestModalProps) {
  const { requestCorrection } = useTmsStore();

  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [alternatePhone, setAlternatePhone] = useState(customer.alternatePhone || '');
  const [address, setAddress] = useState(customer.address);
  const [gstin, setGstin] = useState(customer.gstin || '');
  const [creditTerms, setCreditTerms] = useState(customer.creditTerms || '30 Days');
  const [notes, setNotes] = useState(customer.notes || '');
  const [reason, setReason] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('Please provide a business justification / reason for requesting customer details change.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit primary phone number.');
      return;
    }

    // Determine what changed
    const changes: Record<string, { old: string; new: string }> = {};
    if (name.trim() !== customer.name) changes['name'] = { old: customer.name, new: name.trim() };
    if (phone.trim() !== customer.phone) changes['phone'] = { old: customer.phone, new: phone.trim() };
    if ((alternatePhone.trim() || '') !== (customer.alternatePhone || ''))
      changes['alternatePhone'] = { old: customer.alternatePhone || '', new: alternatePhone.trim() };
    if (address.trim() !== customer.address) changes['address'] = { old: customer.address, new: address.trim() };
    if ((gstin.trim() || '') !== (customer.gstin || ''))
      changes['gstin'] = { old: customer.gstin || '', new: gstin.trim().toUpperCase() };
    if (creditTerms !== customer.creditTerms)
      changes['creditTerms'] = { old: customer.creditTerms || '', new: creditTerms };
    if ((notes.trim() || '') !== (customer.notes || ''))
      changes['notes'] = { old: customer.notes || '', new: notes.trim() };

    if (Object.keys(changes).length === 0) {
      setError('No changes detected compared to existing customer record.');
      return;
    }

    setIsSubmitting(true);

    try {
      const today = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const originalJson = JSON.stringify(
        Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.old]))
      );
      const requestedJson = JSON.stringify(
        Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.new]))
      );

      // Add to store corrections
      requestCorrection(
        {
          transactionId: customer.id,
          entityName: customer.name,
          entityType: 'CUSTOMER',
          date: today,
          requestedDate: today,
          requestedBy: 'Worker (Arun Kumar)',
          originalValue: originalJson,
          requestedValue: requestedJson,
          reason: reason.trim(),
          status: 'PENDING_MANAGER_APPROVAL',
        },
        'Worker (Arun Kumar)'
      );

      // Try sending to backend approval API
      try {
        const { apiClient } = await import('../../../lib/api');
        await apiClient.approvals.submitCorrectionRequest({
          entityType: 'CUSTOMER',
          entityId: customer.id,
          reason: reason.trim(),
          changes: Object.entries(changes).map(([field, v]) => ({
            field,
            newValue: v.new,
          })),
        });
      } catch (beErr) {
        console.warn('Backend approval request warning:', beErr);
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        if (onRequestSubmitted) {
          onRequestSubmitted();
        }
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit customer change request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Customer Details Edit"
      maxWidth="max-w-2xl"
    >
      {isSuccess ? (
        <div className="text-center py-8 space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 size={28} />
          </div>
          <h3 className="text-base font-bold text-[#16425B]">Customer Change Request Submitted</h3>
          <p className="text-xs text-[#5A6E7F] max-w-md mx-auto">
            Your requested changes for <strong className="text-[#16425B]">{customer.name}</strong> have been forwarded to the Manager Portal for review. You can continue your trip dispatch using the current customer record.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-[#f0f4f8] border border-[#2F668F]/30 rounded-lg flex items-start gap-2.5">
            <Shield size={18} className="text-[#2F668F] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#16425B]">Master Data Governance Policy</p>
              <p className="text-[11px] text-[#5A6E7F] mt-0.5 leading-relaxed">
                Worker role cannot directly alter protected customer master data. Submitting this form creates a formal <strong>Customer Change Request</strong> sent to the Operations Manager for validation and approval.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <div className="p-3 bg-white border border-[#D9DBD6] rounded-lg">
            <span className="text-[10px] font-bold text-[#5A6E7F] uppercase tracking-wider block mb-1">
              Customer Identity (Permanent & Immutable)
            </span>
            <div className="flex justify-between items-center">
              <strong className="text-sm font-bold text-[#16425B]">{customer.name}</strong>
              <span className="font-mono text-xs font-bold text-[#2F668F] bg-[#e8f1f5] px-2 py-0.5 rounded">
                {customer.id}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Requested Customer Name
              </label>
              <div className="relative">
                <UserRound size={15} className="absolute left-3 top-2.5 text-[#5A6E7F]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="tms-input pl-9 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Requested Primary Phone
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-2.5 text-[#5A6E7F]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="tms-input pl-9 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Requested Alternate Phone
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-2.5 text-[#5A6E7F]" />
                <input
                  type="tel"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                  className="tms-input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Requested GSTIN
              </label>
              <div className="relative">
                <FileText size={15} className="absolute left-3 top-2.5 text-[#5A6E7F]" />
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  maxLength={15}
                  className="tms-input pl-9 uppercase font-mono"
                />
              </div>
            </div>


            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Requested Billing / Site Address
              </label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-2.5 text-[#5A6E7F]" />
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="tms-input pl-9 resize-none"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Reason / Business Justification for Request <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why customer details need to be updated (e.g. Updated primary contact number as per site engineer request)..."
                rows={2}
                className="tms-input resize-none"
                required
              />
              <span className="text-[11px] text-[#5A6E7F] mt-1 block">
                Required for governance audit log reviewed by Operations Manager.
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#D9DBD6] flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto btn-secondary text-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto btn-primary text-center justify-center"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request to Manager'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
