'use client';

import React, { useState } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { Check, X, Eye, AlertCircle, CheckCircle2, UserRound, ArrowRight } from '../ui/Icons';
import { CorrectionRequest, Customer } from '../../types';
import { apiClient } from '../../lib/api';

function normalizeFieldKey(raw: string): string {
  const clean = raw.toLowerCase().replace(/[\s_-]/g, '');
  if (clean === 'name' || clean === 'customername' || clean === 'companyname') return 'name';
  if (clean === 'phone' || clean === 'phonenumber' || clean === 'mobile' || clean === 'contact') return 'phone';
  if (clean === 'alternatephone' || clean === 'altphone' || clean === 'secondaryphone') return 'alternatePhone';
  if (clean === 'address' || clean === 'billingaddress' || clean === 'customeraddress') return 'address';
  if (clean === 'creditterms' || clean === 'terms' || clean === 'paymentterms') return 'creditTerms';
  if (clean === 'gstin' || clean === 'gst' || clean === 'gstnumber') return 'gstin';
  if (clean === 'notes' || clean === 'remarks' || clean === 'comment') return 'notes';
  return clean;
}

function extractValuesSafe(val: any, items?: any[]): Record<string, string> {
  const result: Record<string, string> = {};

  if (Array.isArray(items)) {
    for (const item of items) {
      const k = normalizeFieldKey(item.fieldName || item.field || '');
      const v = item.requestedValue ?? item.newValue ?? item.value;
      if (k) result[k] = v !== undefined && v !== null ? String(v) : '';
    }
  }

  if (val && typeof val === 'object' && !Array.isArray(val)) {
    for (const [k, v] of Object.entries(val)) {
      const fieldKey = normalizeFieldKey(k);
      if (fieldKey) result[fieldKey] = v !== undefined && v !== null ? String(v) : '';
    }
    return result;
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          for (const [k, v] of Object.entries(parsed)) {
            const fieldKey = normalizeFieldKey(k);
            if (fieldKey) result[fieldKey] = v !== undefined && v !== null ? String(v) : '';
          }
          return result;
        }
      } catch {
        // Fallback to regex
      }
    }

    const regex = /([a-zA-Z0-9_]+)\s*[:=]\s*["']?([^"',\n]+)["']?/g;
    let match;
    while ((match = regex.exec(val)) !== null) {
      const fieldKey = normalizeFieldKey(match[1]);
      if (fieldKey) {
        result[fieldKey] = match[2].trim();
      }
    }
  }

  return result;
}

function getCustomerFieldValue(customer: Customer | undefined, fieldKey: string): string {
  if (!customer) return '';
  switch (fieldKey) {
    case 'name':
      return customer.name || '';
    case 'phone':
      return customer.phone || '';
    case 'alternatePhone':
      return customer.alternatePhone || '';
    case 'address':
      return customer.address || '';
    case 'creditTerms':
      return customer.creditTerms || '';
    case 'gstin':
      return customer.gstin || '';
    case 'notes':
      return customer.notes || '';
    default:
      return (customer as any)[fieldKey] ? String((customer as any)[fieldKey]) : '';
  }
}

export function ManagerCustomerRequests() {
  const { corrections, customers, approveCorrection, rejectCorrection } = useTmsStore();

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedReq, setSelectedReq] = useState<CorrectionRequest | null>(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isConfirmApprove, setIsConfirmApprove] = useState(false);
  const [isConfirmReject, setIsConfirmReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filter for customer requests only
  const customerRequests = corrections.filter(
    (c) =>
      c.entityType === 'CUSTOMER' ||
      c.transactionId?.startsWith('CUS-') ||
      c.requestedBy === 'Arun Kumar' ||
      c.reason.toLowerCase().includes('customer')
  );

  const filteredRequests = customerRequests.filter((c) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'PENDING')
      return (
        c.status === 'PENDING_MANAGER_APPROVAL' ||
        c.status === 'PENDING_MD' ||
        (c.status as string) === 'PENDING'
      );
    if (filterStatus === 'APPROVED') return c.status === 'APPROVED';
    if (filterStatus === 'REJECTED') return c.status === 'REJECTED';
    return true;
  });

  const handleOpenDiff = (req: CorrectionRequest) => {
    setSelectedReq(req);
    setActionError(null);
    setActionSuccess(null);
    setIsDiffModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedReq) return;
    setActionError(null);

    // Parse requested values
    const requested = extractValuesSafe(selectedReq.requestedValue, (selectedReq as any).items);
    const customerId = selectedReq.transactionId;

    // Check duplicate phone if phone changed
    if (requested?.phone) {
      const duplicate = customers.find(
        (c) => c.phone.trim() === requested.phone.trim() && c.id !== customerId
      );
      if (duplicate) {
        setActionError(
          `Cannot approve: Phone number ${requested.phone} is already assigned to active customer "${duplicate.name}" (${duplicate.id}). Duplicate phone numbers are prohibited.`
        );
        return;
      }
    }

    try {
      // 1. Try backend approval API
      try {
        await apiClient.approvals.approve(selectedReq.id, 'Approved authorized customer modification.');
      } catch (e: any) {
        console.warn('Backend approval sync:', e.message);
      }

      // 2. Apply to local unified store
      approveCorrection(selectedReq.id, 'Rajesh V (Manager)');

      setIsConfirmApprove(false);
      setIsDiffModalOpen(false);
      setActionSuccess(`Customer Change Request ${selectedReq.id} approved successfully. Customer master updated.`);
      setSelectedReq(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve customer request.');
    }
  };

  const handleReject = async () => {
    if (!selectedReq) return;
    if (!rejectReason.trim()) {
      setActionError('Please provide a reason for rejecting this change request.');
      return;
    }

    try {
      // 1. Try backend reject API
      try {
        await apiClient.approvals.reject(selectedReq.id, rejectReason.trim());
      } catch (e: any) {
        console.warn('Backend reject sync:', e.message);
      }

      // 2. Reject in local unified store
      rejectCorrection(selectedReq.id, rejectReason.trim(), 'Rajesh V (Manager)');

      setIsConfirmReject(false);
      setIsDiffModalOpen(false);
      setActionSuccess(`Customer Change Request ${selectedReq.id} has been rejected.`);
      setSelectedReq(null);
      setRejectReason('');
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject customer request.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Customer Change Requests"
        description="Worker customer change submissions · Strict approval workflow before master data is modified"
      />

      {/* SUCCESS / ERROR ALERTS */}
      {actionSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* FILTER TABS */}
      <div className="flex gap-2 mb-6 border-b border-[#D9DBD6] pb-3">
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterStatus === st
                ? 'bg-[#2F668F] text-white shadow-sm'
                : 'bg-white text-[#16425B] border border-[#D9DBD6] hover:bg-[#f0f4f8]'
            }`}
          >
            {st === 'PENDING'
              ? 'Pending Review'
              : st === 'ALL'
              ? 'All Requests'
              : st.charAt(0) + st.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* REQUESTS TABLE */}
      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5 shadow-sm">
        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Customer ID</th>
                <th>Requester</th>
                <th>Request Date</th>
                <th>Reason for Change</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => {
                const isPending =
                  req.status === 'PENDING_MANAGER_APPROVAL' ||
                  req.status === 'PENDING_MD' ||
                  (req.status as string) === 'PENDING';
                return (
                  <tr key={req.id}>
                    <td className="font-mono font-bold text-[#2F668F]">{req.id}</td>
                    <td className="font-mono font-bold text-[#16425B]">{req.transactionId}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <UserRound size={13} className="text-[#5A6E7F]" />
                        <span className="font-medium text-xs">{req.requestedBy}</span>
                      </div>
                    </td>
                    <td>{req.requestedDate || req.date}</td>
                    <td className="max-w-xs truncate text-[#5A6E7F]">{req.reason}</td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          isPending
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : req.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isPending ? 'PENDING' : req.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDiff(req)}
                        className="btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1"
                      >
                        <Eye size={13} />
                        View Diff & Review
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-[#5A6E7F]">
                    No customer change requests found in this status view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIFF & REVIEW MODAL */}
      <Modal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        title={`Review Customer Change Request — ${selectedReq?.id}`}
        maxWidth="max-w-3xl"
      >
        {selectedReq && (
          <div className="space-y-4 text-xs">
            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                <AlertCircle size={15} className="text-red-500 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* REQUEST METADATA */}
            <div className="p-3 bg-[#f8faf5] border border-[#D9DBD6] rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-[#5A6E7F] block">Request ID:</span>
                <strong className="font-mono text-[#2F668F]">{selectedReq.id}</strong>
              </div>
              <div>
                <span className="text-[#5A6E7F] block">Customer ID:</span>
                <strong className="font-mono text-[#16425B]">{selectedReq.transactionId}</strong>
              </div>
              <div>
                <span className="text-[#5A6E7F] block">Requester:</span>
                <strong>{selectedReq.requestedBy}</strong>
              </div>
              <div>
                <span className="text-[#5A6E7F] block">Submission Date:</span>
                <span>{selectedReq.requestedDate || selectedReq.date}</span>
              </div>
            </div>

            {/* REASON */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block mb-1">
                Reason for Change
              </span>
              <p className="text-amber-950 font-medium">{selectedReq.reason}</p>
            </div>

            {/* SIDE-BY-SIDE DIFF VIEW */}
            <div>
              <h4 className="text-xs font-bold text-[#16425B] uppercase tracking-wider mb-2">
                Field-by-Field Comparison (Original vs Requested)
              </h4>
              <div className="border border-[#D9DBD6] rounded-lg overflow-x-auto bg-white shadow-sm">
                <table className="w-full border-collapse text-left text-xs min-w-[580px]">
                  <thead>
                    <tr className="bg-[#f0f4f8] border-b border-[#D9DBD6]">
                      <th className="py-2.5 px-3 font-bold text-[#16425B] uppercase text-[11px] tracking-wider w-[28%]">
                        Field
                      </th>
                      <th className="py-2.5 px-3 font-bold text-[#5A6E7F] uppercase text-[11px] tracking-wider w-[36%]">
                        Original / Current Master Value
                      </th>
                      <th className="py-2.5 px-3 font-bold text-[#16425B] uppercase text-[11px] tracking-wider w-[36%]">
                        Requested / New Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9DBD6]">
                    {(() => {
                      const currentCustomer =
                        customers.find(
                          (c) =>
                            c.id === selectedReq.transactionId ||
                            c.id === (selectedReq as any).entityId
                        ) ||
                        customers.find(
                          (c) =>
                            c.name?.toLowerCase().trim() ===
                            selectedReq.entityName?.toLowerCase().trim()
                        );

                      const origFromReq = extractValuesSafe(
                        selectedReq.originalValue,
                        (selectedReq as any).items?.map((it: any) => ({
                          fieldName: it.fieldName || it.field,
                          requestedValue: it.oldValue,
                        }))
                      );

                      const requested = extractValuesSafe(
                        selectedReq.requestedValue,
                        (selectedReq as any).items
                      );

                      // Standard required fields
                      const fields: Array<{ key: string; label: string }> = [
                        { key: 'name', label: 'Customer Name' },
                        { key: 'phone', label: 'Phone Number' },
                        { key: 'address', label: 'Billing Address' },
                        { key: 'creditTerms', label: 'Credit Terms' },
                        { key: 'gstin', label: 'GSTIN' },
                      ];

                      // Additional supported fields if present on customer or in request
                      if (
                        currentCustomer?.alternatePhone ||
                        origFromReq['alternatePhone'] ||
                        requested['alternatePhone'] !== undefined
                      ) {
                        fields.push({ key: 'alternatePhone', label: 'Alternate Phone' });
                      }

                      if (
                        currentCustomer?.notes ||
                        origFromReq['notes'] ||
                        requested['notes'] !== undefined
                      ) {
                        fields.push({ key: 'notes', label: 'Notes / Remarks' });
                      }

                      // Any other fields from request not yet listed
                      for (const reqKey of Object.keys(requested)) {
                        if (!fields.some((f) => f.key === reqKey)) {
                          const formattedLabel = reqKey
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, (str) => str.toUpperCase());
                          fields.push({ key: reqKey, label: formattedLabel });
                        }
                      }

                      return fields.map((f) => {
                        // 1. Resolve Original / Current Master Value
                        const rawMaster = getCustomerFieldValue(currentCustomer, f.key);
                        const rawOrig = rawMaster || origFromReq[f.key] || '';
                        const hasOrig = Boolean(rawOrig && rawOrig.trim() !== '');

                        // 2. Resolve Requested / New Value
                        const hasReq = Object.prototype.hasOwnProperty.call(requested, f.key);
                        const rawReq = hasReq ? (requested[f.key] ?? '') : '';
                        const isCleared =
                          hasReq &&
                          (!rawReq ||
                            rawReq.trim() === '' ||
                            rawReq.toLowerCase() === 'clear' ||
                            rawReq.toLowerCase() === 'clear value');

                        const isChanged =
                          hasReq &&
                          !isCleared &&
                          rawReq.trim() !== (hasOrig ? rawOrig.trim() : '');

                        const isRowDiff = isChanged || isCleared;

                        return (
                          <tr
                            key={f.key}
                            className={`transition-colors ${
                              isRowDiff ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-[#fbfcf9]'
                            }`}
                          >
                            <td className="py-2.5 px-3 font-bold text-[#16425B] align-middle">
                              {f.label}
                            </td>
                            <td className="py-2.5 px-3 align-middle">
                              {hasOrig ? (
                                <span className="font-mono text-xs text-[#2F668F]">
                                  {rawOrig}
                                </span>
                              ) : (
                                <span className="text-xs text-[#8C9BA5] italic">
                                  Not provided
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 align-middle">
                              {isCleared ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 italic">
                                  Clear value
                                </span>
                              ) : isChanged ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs">
                                  {rawReq}
                                </span>
                              ) : hasReq ? (
                                <span className="font-mono text-xs text-[#5A6E7F]">
                                  {rawReq || '—'}
                                </span>
                              ) : (
                                <span className="text-xs text-[#5A6E7F]">
                                  {hasOrig ? (
                                    <span className="font-mono">
                                      {rawOrig}{' '}
                                      <span className="text-[11px] text-[#8C9BA5] font-sans font-normal">
                                        (Unchanged)
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-[#8C9BA5] italic">Not provided</span>
                                  )}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ACTIONS IF PENDING */}
            {(selectedReq.status === 'PENDING_MANAGER_APPROVAL' ||
              selectedReq.status === 'PENDING_MD' ||
              (selectedReq.status as string) === 'PENDING') ? (
              <div className="pt-3 border-t border-[#D9DBD6] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#5A6E7F]">
                    Approving this request will immediately update the shared Customer record across all portals.
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsConfirmReject(true)}
                      className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 font-bold text-xs flex items-center gap-1"
                    >
                      <X size={14} />
                      Reject Request
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmApprove(true)}
                      className="btn-primary bg-emerald-700 hover:bg-emerald-800 border-emerald-700 flex items-center gap-1"
                    >
                      <Check size={14} />
                      Approve & Update Customer
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#f8faf5] border border-[#D9DBD6] rounded-lg text-xs">
                <span className="text-[#5A6E7F] block">
                  Reviewed by <strong>{selectedReq.reviewedBy}</strong> on {selectedReq.reviewedDate}:
                </span>
                <span className="font-semibold text-[#16425B]">
                  {selectedReq.reviewNotes || selectedReq.status}
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* CONFIRM APPROVE DIALOG */}
      <ConfirmDialog
        isOpen={isConfirmApprove}
        title="Confirm Customer Modification?"
        message={`This will approve change request ${selectedReq?.id} and update Customer ${selectedReq?.transactionId} across Accounts, Worker, and MD portals. Phone uniqueness will be enforced.`}
        confirmLabel="Confirm & Apply Changes"
        onCancel={() => setIsConfirmApprove(false)}
        onConfirm={handleApprove}
      />

      {/* REJECT MODAL WITH REASON */}
      <Modal
        isOpen={isConfirmReject}
        onClose={() => setIsConfirmReject(false)}
        title={`Reject Customer Change Request ${selectedReq?.id}`}
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#5A6E7F]">
            Please enter a formal reason for rejecting this request. The customer master data will remain unchanged.
          </p>
          <div>
            <label className="block text-xs font-bold text-[#16425B] mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Incomplete GST verification / Phone number mismatch"
              required
              className="tms-input"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-[#D9DBD6]">
            <button
              type="button"
              onClick={() => setIsConfirmReject(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
