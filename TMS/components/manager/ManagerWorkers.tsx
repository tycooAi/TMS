'use client';

import React, { useState } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency } from '../../lib/calculations';
import { Users, Search, Plus, Edit3, DollarSign, CheckCircle2, AlertCircle } from '../ui/Icons';
import { Worker } from '../../types';
import { generateNextId } from '../../lib/ids';

export function ManagerWorkers() {
  const { workers, updateWorkerWage, saveMasterItem } = useTmsStore();

  const [query, setQuery] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [revisedWage, setRevisedWage] = useState<number>(0);
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reason, setReason] = useState<string>('');
  const [isWageModalOpen, setIsWageModalOpen] = useState(false);
  const [isConfirmWageOpen, setIsConfirmWageOpen] = useState(false);
  const [wageError, setWageError] = useState<string>('');

  // Add Worker Modal
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [newWorker, setNewWorker] = useState<Partial<Worker>>({
    name: '',
    phone: '',
    email: '',
    role: 'Data Entry Operator',
    assignedLocation: 'Madurai Central Yard',
    salary: 18000,
    status: 'ACTIVE',
  });
  const [addError, setAddError] = useState<string>('');

  const filteredWorkers = workers.filter((w) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      w.name.toLowerCase().includes(q) ||
      w.id.toLowerCase().includes(q) ||
      w.phone.toLowerCase().includes(q) ||
      w.role.toLowerCase().includes(q)
    );
  });

  const totalWageCommitment = workers.reduce((sum, w) => sum + (w.salary || 0), 0);

  const handleOpenWageModal = (w: Worker) => {
    setSelectedWorker(w);
    setRevisedWage(w.salary || 0);
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setReason('');
    setWageError('');
    setIsWageModalOpen(true);
  };

  const handleConfirmWageClick = () => {
    if (!revisedWage || revisedWage <= 0) {
      setWageError('Revised wage must be greater than zero.');
      return;
    }
    if (!effectiveDate) {
      setWageError('Effective date is required.');
      return;
    }
    // Revision reason is optional per Manager Portal Worker Edit requirements
    setWageError('');
    setIsConfirmWageOpen(true);
  };

  const handleSaveWage = () => {
    if (!selectedWorker) return;
    updateWorkerWage(
      selectedWorker.id,
      revisedWage,
      effectiveDate,
      reason.trim(),
      'Rajesh V'
    );
    setIsConfirmWageOpen(false);
    setIsWageModalOpen(false);
    setSelectedWorker(null);
  };

  const handleSaveNewWorker = () => {
    if (!newWorker.name?.trim() || !newWorker.phone?.trim()) {
      setAddError('Worker name and phone number are required.');
      return;
    }

    const nextId = generateNextId('WRK', workers.map((w) => w.id));
    const workerObj: Worker = {
      id: nextId,
      name: newWorker.name.trim(),
      phone: newWorker.phone.trim(),
      email: newWorker.email?.trim() || `${nextId.toLowerCase()}@sat-transport.in`,
      role: newWorker.role as any,
      systemRole: 'WORKER',
      salary: Number(newWorker.salary) || 18000,
      paid: 0,
      advance: 0,
      deduction: 0,
      assignedLocation: newWorker.assignedLocation || 'Madurai Central Yard',
      status: 'ACTIVE',
    };

    saveMasterItem('workers', workerObj, 'id', 'Rajesh V', 'MANAGER');
    setIsAddWorkerOpen(false);
    setNewWorker({
      name: '',
      phone: '',
      email: '',
      role: 'Data Entry Operator',
      assignedLocation: 'Madurai Central Yard',
      salary: 18000,
      status: 'ACTIVE',
    });
    setAddError('');
  };

  return (
    <div>
      <PageHeader
        title="Workforce & Wage Management"
        description="Employee oversight, designation tracking, and authorized Worker Wage Control"
      >
        <button
          onClick={() => setIsAddWorkerOpen(true)}
          className="btn-primary flex items-center gap-1.5"
        >
          <Plus size={15} />
          + Add New Worker
        </button>
      </PageHeader>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Total Active Workforce
          </span>
          <strong className="text-2xl font-bold text-[#16425B] block my-1">
            {workers.filter((w) => w.status === 'ACTIVE').length} Workers
          </strong>
          <span className="text-xs text-[#5A6E7F]">Operational operators & drivers</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Total Monthly Wage Commitment
          </span>
          <strong className="text-2xl font-bold text-[#2F668F] block my-1">
            {formatCurrency(totalWageCommitment)}
          </strong>
          <span className="text-xs text-[#5A6E7F]">Shared base wage across Accounts</span>
        </div>

        <div className="p-4 bg-white rounded-lg border border-[#D9DBD6]">
          <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider block">
            Authorized Wage Control
          </span>
          <strong className="text-2xl font-bold text-emerald-700 block my-1">
            Manager Governed
          </strong>
          <span className="text-xs text-[#5A6E7F]">Preserves historical posted payroll records</span>
        </div>
      </div>

      {/* WORKERS TABLE PANEL */}
      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-[#5A6E7F]" size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by worker name, ID (WRK-XXXX), phone, role..."
              className="tms-input pl-9 text-xs"
            />
          </div>
          <span className="text-xs text-[#5A6E7F]">
            Showing <strong>{filteredWorkers.length}</strong> of <strong>{workers.length}</strong> workers
          </span>
        </div>

        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>Worker ID</th>
                <th>Employee Name</th>
                <th>Designation Role</th>
                <th>Phone</th>
                <th>Work Location</th>
                <th>Current Wage (Monthly)</th>
                <th>Status</th>
                <th className="text-right">Wage Control Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.map((w) => (
                <tr key={w.id}>
                  <td className="font-mono font-bold text-[#2F668F]">{w.id}</td>
                  <td className="font-bold text-[#16425B]">{w.name}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded bg-[#f0f4f8] text-[#16425B] text-xs font-semibold">
                      {w.role}
                    </span>
                  </td>
                  <td>{w.phone}</td>
                  <td>{w.assignedLocation || 'Madurai'}</td>
                  <td>
                    <strong className="text-[#16425B] font-mono text-sm">
                      {formatCurrency(w.salary)}
                    </strong>
                  </td>
                  <td>
                    <StatusBadge status={w.status} />
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenWageModal(w)}
                      className="btn-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1 border-[#2F668F] text-[#2F668F] hover:bg-[#e8f1f5]"
                    >
                      <DollarSign size={13} />
                      Revise Wage
                    </button>
                  </td>
                </tr>
              ))}
              {filteredWorkers.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-xs text-[#5A6E7F]">
                    No workers found matching "{query}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WORKER WAGE CONTROL MODAL */}
      <Modal
        isOpen={isWageModalOpen}
        onClose={() => setIsWageModalOpen(false)}
        title="Worker Wage Control — Authorized Revision"
      >
        {selectedWorker && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#e8f1f5] border border-[#2F668F] rounded-lg">
              <span className="text-[10px] font-bold text-[#2F668F] uppercase tracking-wider block">
                Selected Worker Master
              </span>
              <div className="flex justify-between items-center mt-1">
                <div>
                  <h3 className="text-sm font-bold text-[#16425B]">{selectedWorker.name}</h3>
                  <p className="text-[#5A6E7F]">
                    ID: <strong className="font-mono">{selectedWorker.id}</strong> · Role: {selectedWorker.role}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#5A6E7F] block">Current Base Wage:</span>
                  <strong className="text-sm font-mono font-bold text-[#16425B]">
                    {formatCurrency(selectedWorker.salary)}
                  </strong>
                </div>
              </div>
            </div>

            {wageError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0 text-red-500" />
                <span>{wageError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Revised Monthly Wage (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={revisedWage || ''}
                  onChange={(e) => setRevisedWage(Number(e.target.value))}
                  placeholder="e.g. 24000"
                  required
                  className="tms-input font-bold text-[#16425B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Effective Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  required
                  className="tms-input"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  Revision Reason / Authorization Note <span className="text-[#5A6E7F] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Annual performance appraisal / duty seniority increment (Optional)"
                  className="tms-input"
                />
                <span className="text-[10px] text-[#5A6E7F] mt-1 block">
                  This note will be logged in the immutable system audit trail and reflected in Accounts.
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#f8faf5] border border-[#D9DBD6] rounded-lg text-[11px] text-[#5A6E7F]">
              <p>
                <strong>Cross-Portal Data Integrity:</strong> This action updates the shared workforce wage record.
                Accounts payroll summaries will automatically use the revised wage from the effective date.
                Historical posted salary vouchers remain unchanged.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#D9DBD6]">
              <button
                type="button"
                onClick={() => setIsWageModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWageClick}
                className="btn-primary bg-[#2F668F]"
              >
                Review & Confirm Wage Update
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* CONFIRM WAGE DIALOG */}
      <ConfirmDialog
        isOpen={isConfirmWageOpen}
        title="Confirm Wage Revision?"
        message={`Are you sure you want to revise the monthly wage for ${selectedWorker?.name} (${selectedWorker?.id}) from ₹${selectedWorker?.salary.toLocaleString('en-IN')} to ₹${revisedWage.toLocaleString('en-IN')} effective from ${effectiveDate}?`}
        confirmLabel="Confirm Wage Revision"
        onCancel={() => setIsConfirmWageOpen(false)}
        onConfirm={handleSaveWage}
      />

      {/* ADD NEW WORKER MODAL */}
      <Modal
        isOpen={isAddWorkerOpen}
        onClose={() => setIsAddWorkerOpen(false)}
        title="Add New Workforce Employee"
      >
        <div className="space-y-4 text-xs">
          {addError && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-1.5">
              <AlertCircle size={14} className="shrink-0 text-red-500" />
              <span>{addError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Employee Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newWorker.name || ''}
                onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                placeholder="e.g. Manikandan P"
                required
                className="tms-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Mobile Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={newWorker.phone || ''}
                onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                placeholder="10-digit mobile number"
                required
                className="tms-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Designation Role</label>
              <select
                value={newWorker.role}
                onChange={(e) => setNewWorker({ ...newWorker, role: e.target.value as any })}
                className="tms-input"
              >
                <option value="Data Entry Operator">Data Entry Operator</option>
                <option value="Driver">Commercial Driver</option>
                <option value="Supervisor">Yard Supervisor</option>
                <option value="Accounts">Accounts Assistant</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Work Location</label>
              <input
                type="text"
                value={newWorker.assignedLocation || ''}
                onChange={(e) => setNewWorker({ ...newWorker, assignedLocation: e.target.value })}
                placeholder="e.g. Madurai Central Yard"
                className="tms-input"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                Base Monthly Wage (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="5000"
                step="500"
                value={newWorker.salary || ''}
                onChange={(e) => setNewWorker({ ...newWorker, salary: Number(e.target.value) })}
                placeholder="e.g. 18000"
                className="tms-input font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#D9DBD6]">
            <button
              type="button"
              onClick={() => setIsAddWorkerOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveNewWorker}
              className="btn-primary"
            >
              Save Worker
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
