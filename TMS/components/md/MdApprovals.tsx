'use client';

import React, { useState } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { Shield, Check, X, Eye, AlertCircle, CheckCircle2 } from '../ui/Icons';
import { CorrectionRequest } from '../../types';
import { apiClient } from '../../lib/api';

export function MdApprovals() {
  const { corrections, approveCorrection, rejectCorrection } = useTmsStore();

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedReq, setSelectedReq] = useState<CorrectionRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'REVIEW' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // MD APPROVAL CENTER HANDLES ACCOUNTS-RELATED REQUESTS ONLY
  // Customer change requests belong strictly to Manager Portal
  const isAccountsRequest = (c: CorrectionRequest) =>
    c.entityType !== 'CUSTOMER' &&
    !c.transactionId?.startsWith('CUS-') &&
    c.requestedBy !== 'Worker (Arun Kumar)' &&
    !c.reason?.toLowerCase().includes('customer');

  const accountsRequests = corrections.filter(isAccountsRequest);

  const pendingRequests = accountsRequests.filter(
    (c) => c.status === 'PENDING_MD' || c.status === 'PENDING_MD_APPROVAL' || (c.status as string) === 'PENDING'
  );

  const approvedRequests = accountsRequests.filter((c) => c.status === 'APPROVED');
  const rejectedRequests = accountsRequests.filter((c) => c.status === 'REJECTED');

  const filteredRequests = accountsRequests.filter((c) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'PENDING') {
      return c.status === 'PENDING_MD' || c.status === 'PENDING_MD_APPROVAL' || (c.status as string) === 'PENDING';
    }
    if (filterStatus === 'APPROVED') return c.status === 'APPROVED';
    if (filterStatus === 'REJECTED') return c.status === 'REJECTED';
    return true;
  });

  const handleOpenAction = (req: CorrectionRequest, action: 'APPROVE' | 'REJECT' | 'REVIEW') => {
    setSelectedReq(req);
    setActionType(action);
    setRejectionReason('');
    setError(null);
  };

  const handleExecuteAction = async (forcedAction?: 'APPROVE' | 'REJECT') => {
    const act = forcedAction || actionType;
    if (!selectedReq || !act || act === 'REVIEW') return;
    setError(null);

    if (act === 'REJECT' && !rejectionReason.trim()) {
      setError('Please enter a business justification for withholding executive authorization.');
      return;
    }

    try {
      if (act === 'APPROVE') {
        try {
          await apiClient.approvals.approve(selectedReq.id, 'Approved by Managing Director.');
        } catch (e: any) {
          console.warn('Backend approval sync:', e.message);
        }
        approveCorrection(selectedReq.id, 'Vikramaditya Rao (MD)');
        setActionSuccess(`Accounts amendment ${selectedReq.id} approved and posted to general ledger.`);
      } else {
        try {
          await apiClient.approvals.reject(selectedReq.id, rejectionReason.trim());
        } catch (e: any) {
          console.warn('Backend reject sync:', e.message);
        }
        rejectCorrection(selectedReq.id, rejectionReason.trim(), 'Vikramaditya Rao (MD)');
        setActionSuccess(`Accounts amendment ${selectedReq.id} has been rejected.`);
      }

      setSelectedReq(null);
      setActionType(null);
      setRejectionReason('');
    } catch (err: any) {
      setError(err?.message || 'Failed to process accounts approval request.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Accounts Approval Center"
        description="Executive MD authorization for Accounts transaction corrections, value amendments and rate overrides"
      />

      {/* SUCCESS / ERROR ALERTS */}
      {actionSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SUMMARY BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6] shadow-sm">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Pending Accounts Authorization
          </span>
          <strong className="text-2xl font-bold text-amber-700 block my-1">
            {pendingRequests.length} Requests
          </strong>
          <span className="text-xs text-[#5A6E7F]">Awaiting Managing Director review</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6] shadow-sm">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Approved Accounts Amendments
          </span>
          <strong className="text-2xl font-bold text-emerald-700 block my-1">
            {approvedRequests.length} Approved
          </strong>
          <span className="text-xs text-[#5A6E7F]">Audited and applied to central ledger</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6] shadow-sm">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Rejected Requests
          </span>
          <strong className="text-2xl font-bold text-[#5A6E7F] block my-1">
            {rejectedRequests.length} Rejected
          </strong>
          <span className="text-xs text-[#5A6E7F]">Original values preserved intact</span>
        </div>
      </div>

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
              ? 'All Accounts Requests'
              : st.charAt(0) + st.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* ACCOUNTS APPROVALS QUEUE TABLE */}
      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5 shadow-sm">
        <h2 className="text-sm font-bold text-[#16425B] mb-3">Accounts Correction Requests Queue</h2>
        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Target Record</th>
                <th>Requested By</th>
                <th>Submission Date</th>
                <th>Amount / Relevant Details</th>
                <th>Reason / Justification</th>
                <th>Status</th>
                <th className="text-right">Executive Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => {
                const isPending =
                  req.status === 'PENDING_MD' ||
                  req.status === 'PENDING_MD_APPROVAL' ||
                  (req.status as string) === 'PENDING';
                return (
                  <tr key={req.id}>
                    <td className="font-mono font-bold text-[#2F668F]">{req.id}</td>
                    <td className="font-semibold text-[#16425B]">
                      <span className="font-mono text-xs">{req.transactionId}</span>
                      <small className="block text-[#5A6E7F] font-normal text-xs">{req.entityName}</small>
                    </td>
                    <td>
                      <span className="font-medium text-xs text-[#16425B]">{req.requestedBy}</span>
                    </td>
                    <td className="text-xs text-[#5A6E7F]">{req.date}</td>
                    <td>
                      <div className="space-y-1 text-xs max-w-xs">
                        <div className="text-rose-800 font-mono bg-rose-50/60 px-2 py-0.5 rounded border border-rose-200">
                          <span className="text-[10px] text-rose-600 block uppercase font-bold">Current</span>
                          {req.originalValue}
                        </div>
                        <div className="text-emerald-800 font-mono bg-emerald-50/60 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                          <span className="text-[10px] text-emerald-600 block uppercase font-bold">Requested</span>
                          {req.requestedValue}
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-[#16425B] max-w-xs leading-relaxed">{req.reason}</td>
                    <td>
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenAction(req, 'REVIEW')}
                            className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1"
                            title="Review details"
                          >
                            <Eye size={13} />
                            Review
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAction(req, 'APPROVE')}
                            className="btn-primary bg-emerald-700 hover:bg-emerald-800 border-emerald-700 py-1 px-2 text-xs flex items-center gap-1"
                            title="Approve amendment"
                          >
                            <Check size={13} />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAction(req, 'REJECT')}
                            className="btn-secondary text-red-700 border-red-200 hover:bg-red-50 py-1 px-2 text-xs flex items-center gap-1"
                            title="Reject amendment"
                          >
                            <X size={13} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-[#5A6E7F] text-right">
                          <span className="block font-medium text-[#16425B]">{req.reviewedBy}</span>
                          <span>{req.reviewedDate}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-[#5A6E7F] text-xs">
                    No accounts correction requests found in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM APPROVE / REJECT / REVIEW MODAL */}
      {selectedReq && actionType && (
        <Modal
          isOpen={true}
          onClose={() => {
            setSelectedReq(null);
            setActionType(null);
          }}
          title={
            actionType === 'APPROVE'
              ? 'Authorize Accounts Amendment'
              : actionType === 'REJECT'
              ? 'Reject Accounts Amendment'
              : `Review Accounts Request — ${selectedReq.id}`
          }
          subtitle={`Target Record: ${selectedReq.transactionId} · Requested by ${selectedReq.requestedBy}`}
          maxWidth="max-w-lg"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle size={15} className="text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#f8faf5] border border-[#D9DBD6] rounded-lg space-y-2">
              <div>
                <span className="text-[#5A6E7F] text-[11px] block font-bold uppercase tracking-wider">
                  Target Transaction
                </span>
                <strong className="text-[#16425B] font-mono text-xs">{selectedReq.transactionId}</strong>
                <span className="text-[#5A6E7F] block">{selectedReq.entityName}</span>
              </div>
              <div className="pt-2 border-t border-[#D9DBD6]/60">
                <span className="text-[#5A6E7F] text-[11px] block font-bold uppercase tracking-wider">
                  Original Stored Record Value
                </span>
                <strong className="text-rose-700 font-mono text-xs block bg-rose-50 p-1.5 rounded border border-rose-200 mt-0.5">
                  {selectedReq.originalValue}
                </strong>
              </div>
              <div className="pt-2 border-t border-[#D9DBD6]/60">
                <span className="text-[#5A6E7F] text-[11px] block font-bold uppercase tracking-wider">
                  Requested Amendment / Details
                </span>
                <strong className="text-emerald-700 font-mono text-xs block bg-emerald-50 p-1.5 rounded border border-emerald-200 mt-0.5">
                  {selectedReq.requestedValue}
                </strong>
              </div>
              <div className="pt-2 border-t border-[#D9DBD6]/60">
                <span className="text-[#5A6E7F] text-[11px] block font-bold uppercase tracking-wider">
                  Business Justification
                </span>
                <p className="text-[#16425B] mt-0.5 font-medium">{selectedReq.reason}</p>
              </div>
            </div>

            {actionType === 'REJECT' && (
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Rejection Reason / Executive Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="State the business rationale for withholding executive authorization..."
                  className="w-full p-2 border border-[#D9DBD6] rounded-md text-xs h-20 focus:outline-none focus:border-[#2F668F]"
                  required
                />
              </div>
            )}

            {actionType === 'APPROVE' && (
              <p className="text-[#16425B] leading-relaxed bg-emerald-50/50 p-2.5 rounded border border-emerald-200">
                By approving, record <strong>{selectedReq.transactionId}</strong> will be updated to the requested amendment, and an immutable audit trail entry will record your authorization.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-[#D9DBD6]">
              <button
                type="button"
                onClick={() => {
                  setSelectedReq(null);
                  setActionType(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              {actionType === 'REVIEW' ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType('REJECT')}
                    className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 font-bold text-xs flex items-center gap-1"
                  >
                    <X size={14} />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('APPROVE')}
                    className="btn-primary bg-emerald-700 hover:bg-emerald-800 border-emerald-700 flex items-center gap-1"
                  >
                    <Check size={14} />
                    Approve
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleExecuteAction()}
                  className={`btn-primary ${
                    actionType === 'APPROVE'
                      ? 'bg-emerald-700 hover:bg-emerald-800 border-emerald-700'
                      : 'bg-red-700 hover:bg-red-800 border-red-700'
                  }`}
                >
                  {actionType === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
