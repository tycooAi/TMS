'use client';

import React, { useState } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { Shield, Check, X, AlertTriangle } from '../ui/Icons';
import { CorrectionRequest } from '../../types';

export function MdApprovals() {
  const { corrections, approveCorrection, rejectCorrection } = useTmsStore();

  const [selectedReq, setSelectedReq] = useState<CorrectionRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  const pendingCount = corrections.filter((c) => c.status === 'PENDING_MD').length;

  const handleOpenAction = (req: CorrectionRequest, action: 'APPROVE' | 'REJECT') => {
    setSelectedReq(req);
    setActionType(action);
    setRejectionReason('');
    setError('');
  };

  const handleExecuteAction = () => {
    if (!selectedReq || !actionType) return;

    if (actionType === 'APPROVE') {
      approveCorrection(selectedReq.id, 'Vikramaditya Rao (MD)');
    } else {
      if (!rejectionReason.trim()) {
        setError('Please enter a rejection justification.');
        return;
      }
      rejectCorrection(selectedReq.id, rejectionReason.trim(), 'Vikramaditya Rao (MD)');
    }

    setSelectedReq(null);
    setActionType(null);
  };

  return (
    <div>
      <PageHeader
        title="Management Approvals & Governance Center"
        description="Executive authorization for financial transaction corrections, value amendments and rate overrides"
      />

      {/* SUMMARY BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Pending Authorization
          </span>
          <strong className="text-2xl font-bold text-amber-700 block my-1">
            {pendingCount} Requests
          </strong>
          <span className="text-xs text-[#5A6E7F]">Awaiting Managing Director review</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Approved Amendments
          </span>
          <strong className="text-2xl font-bold text-emerald-700 block my-1">
            {corrections.filter((c) => c.status === 'APPROVED').length} Approved
          </strong>
          <span className="text-xs text-[#5A6E7F]">Audited and applied to central ledger</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Rejected Requests
          </span>
          <strong className="text-2xl font-bold text-[#5A6E7F] block my-1">
            {corrections.filter((c) => c.status === 'REJECTED').length} Rejected
          </strong>
          <span className="text-xs text-[#5A6E7F]">Original values preserved intact</span>
        </div>
      </div>

      {/* APPROVALS QUEUE TABLE */}
      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5 shadow-sm">
        <h2 className="text-sm font-bold text-[#16425B] mb-3">Correction Requests Queue</h2>
        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Target Transaction</th>
                <th>Requester</th>
                <th>Submission Date</th>
                <th>Original Stored Value</th>
                <th>Requested New Value</th>
                <th>Justification / Reason</th>
                <th>Status</th>
                <th>Executive Action</th>
              </tr>
            </thead>
            <tbody>
              {corrections.map((req) => (
                <tr key={req.id}>
                  <td className="font-bold text-[#2F668F]">{req.id}</td>
                  <td className="font-semibold text-[#16425B]">
                    {req.transactionId}
                    <small className="block text-[#5A6E7F] font-normal">{req.entityName}</small>
                  </td>
                  <td>{req.requestedBy}</td>
                  <td>{req.date}</td>
                  <td className="text-xs text-rose-800 font-mono bg-rose-50/50 p-2 rounded">
                    {req.originalValue}
                  </td>
                  <td className="text-xs text-emerald-800 font-mono bg-emerald-50/50 p-2 rounded font-bold">
                    {req.requestedValue}
                  </td>
                  <td className="text-xs text-[#16425B] max-w-xs">{req.reason}</td>
                  <td>
                    <StatusBadge status={req.status} />
                  </td>
                  <td>
                    {req.status === 'PENDING_MD' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenAction(req, 'APPROVE')}
                          className="btn-primary bg-emerald-700 hover:bg-emerald-800 border-emerald-700 py-1 px-2.5 text-xs flex items-center gap-1"
                        >
                          <Check size={13} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleOpenAction(req, 'REJECT')}
                          className="btn-secondary text-red-700 border-red-200 hover:bg-red-50 py-1 px-2.5 text-xs flex items-center gap-1"
                        >
                          <X size={13} />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-[#5A6E7F]">
                        {req.reviewedBy} on {req.reviewedDate}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {corrections.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-[#5A6E7F]">
                    No correction requests submitted.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM APPROVE / REJECT MODAL */}
      {selectedReq && actionType && (
        <Modal
          isOpen={true}
          onClose={() => {
            setSelectedReq(null);
            setActionType(null);
          }}
          title={actionType === 'APPROVE' ? 'Authorize Financial Amendment' : 'Reject Correction Request'}
          subtitle={`Request ID: ${selectedReq.id} · Target Record: ${selectedReq.transactionId}`}
          maxWidth="max-w-md"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#f8faf5] border border-[#D9DBD6] rounded-lg space-y-2">
              <div>
                <span className="text-[#5A6E7F] block">Original Record Value:</span>
                <strong className="text-rose-700 font-mono">{selectedReq.originalValue}</strong>
              </div>
              <div>
                <span className="text-[#5A6E7F] block">Requested Amendment:</span>
                <strong className="text-emerald-700 font-mono">{selectedReq.requestedValue}</strong>
              </div>
              <div>
                <span className="text-[#5A6E7F] block">Justification:</span>
                <p className="text-[#16425B] mt-0.5">{selectedReq.reason}</p>
              </div>
            </div>

            {actionType === 'APPROVE' ? (
              <p className="text-[#16425B] leading-relaxed">
                By approving, the transaction <strong>{selectedReq.transactionId}</strong> will be updated to the requested value, and an immutable audit event will record your authorization.
              </p>
            ) : (
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Rejection Reason / Executive Remarks *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="State the rationale for withholding approval..."
                  className="w-full p-2 border border-[#D9DBD6] rounded-md text-xs h-20 focus:outline-none focus:border-[#2F668F]"
                />
              </div>
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
              <button
                type="button"
                onClick={handleExecuteAction}
                className={`btn-primary ${
                  actionType === 'APPROVE'
                    ? 'bg-emerald-700 hover:bg-emerald-800 border-emerald-700'
                    : 'bg-red-700 hover:bg-red-800 border-red-700'
                }`}
              >
                {actionType === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
