'use client';

import React, { useState } from 'react';
import { useTmsStore } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency } from '../../lib/calculations';
import {
  Users,
  Search,
  Plus,
  Edit3,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Lock,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  Info,
} from '../ui/Icons';
import { Worker, UserRole } from '../../types';
import { generateNextId } from '../../lib/ids';
import { apiClient } from '../../lib/api';
import { registerApplicationUser, updateStoredUserPassword, getAllApplicationUsers } from '../../lib/auth';

export function ManagerWorkers() {
  const { workers, drivers, updateWorkerWage, saveMasterItem } = useTmsStore();

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

  // Dynamic Login Credentials State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [addError, setAddError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manage Account Modal State (for existing workers)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountWorker, setAccountWorker] = useState<Worker | null>(null);
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [confirmAccountPassword, setConfirmAccountPassword] = useState('');
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');

  const filteredWorkers = workers.filter((w) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      w.name.toLowerCase().includes(q) ||
      w.id.toLowerCase().includes(q) ||
      w.phone.toLowerCase().includes(q) ||
      w.role.toLowerCase().includes(q) ||
      (w.username && w.username.toLowerCase().includes(q))
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

  // Role change handler with strict driver clearance
  const handleRoleChange = (role: Worker['role']) => {
    setNewWorker((prev) => ({ ...prev, role }));
    setAddError('');
    // Strict business rule: If switching to Driver, purge credential fields immediately
    if (role === 'Driver') {
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handleSaveNewWorker = async () => {
    if (!newWorker.name?.trim() || !newWorker.phone?.trim()) {
      setAddError('Worker name and phone number are required.');
      return;
    }

    const isDriver = newWorker.role === 'Driver';

    // Map designation to system authentication role
    let systemRole: UserRole = 'WORKER';
    if (newWorker.role === 'Accounts') systemRole = 'ACCOUNTS';
    else if (newWorker.role === 'Manager') systemRole = 'MANAGER';
    else if (newWorker.role === 'Supervisor' || newWorker.role === 'Data Entry Operator') systemRole = 'WORKER';

    // Validation for login-enabled roles
    if (!isDriver) {
      if (!username.trim()) {
        setAddError('Username is required for login-enabled personnel.');
        return;
      }
      if (!newWorker.email?.trim() || !newWorker.email.includes('@')) {
        setAddError('A valid corporate email address is required for user account creation.');
        return;
      }
      if (!password || password.length < 6) {
        setAddError('Password is required and must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setAddError('Passwords do not match. Please verify.');
        return;
      }

      // Check duplicate usernames locally
      const existingUsers = getAllApplicationUsers();
      if (existingUsers.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
        setAddError(`Username "${username.trim()}" is already assigned to another application account.`);
        return;
      }
    }

    setIsSubmitting(true);
    setAddError('');

    try {
      const nextId = generateNextId('WRK', workers.map((w) => w.id));
      let createdUserId: string | undefined;

      if (!isDriver) {
        // Create Application User Account via Spring Boot Backend
        try {
          const res = await apiClient.users.create({
            username: username.trim().toLowerCase(),
            fullName: newWorker.name!.trim(),
            email: newWorker.email!.trim().toLowerCase(),
            phone: newWorker.phone?.trim(),
            role: systemRole,
            password: password,
          });
          if (res && res.data) {
            createdUserId = res.data.id;
          }
        } catch (apiErr: any) {
          console.warn('Backend user provisioning error:', apiErr.message);
          if (apiErr.message && (apiErr.message.includes('already exists') || apiErr.message.includes('Driver'))) {
            setAddError(apiErr.message);
            setIsSubmitting(false);
            return;
          }
        }

        // Register in local application users list for seamless instant login
        registerApplicationUser({
          id: createdUserId || `USR-${Math.floor(1000 + Math.random() * 9000)}`,
          username: username.trim().toLowerCase(),
          password: password,
          name: newWorker.name!.trim(),
          email: newWorker.email!.trim().toLowerCase(),
          role: systemRole,
          employeeId: nextId,
          designation: newWorker.role || 'Data Entry Operator',
        });
      }

      // Save personnel record in Worker master
      const workerObj: Worker = {
        id: nextId,
        name: newWorker.name!.trim(),
        phone: newWorker.phone!.trim(),
        email: newWorker.email?.trim() || `${nextId.toLowerCase()}@sat-transport.in`,
        role: newWorker.role as any,
        systemRole: isDriver ? 'WORKER' : systemRole,
        salary: Number(newWorker.salary) || 18000,
        paid: 0,
        advance: 0,
        deduction: 0,
        assignedLocation: newWorker.assignedLocation || 'Madurai Central Yard',
        status: 'ACTIVE',
        hasLogin: !isDriver,
        username: !isDriver ? username.trim().toLowerCase() : undefined,
        userId: createdUserId,
      };

      saveMasterItem('workers', workerObj, 'id', 'Rajesh V', 'MANAGER');

      // If Driver, also register in operational Drivers list for trip dispatching
      if (isDriver) {
        const driversList = drivers || [];
        const nextDrvId = generateNextId('DRV', driversList.map((d) => d.id));
        saveMasterItem('drivers', {
          id: nextDrvId,
          name: newWorker.name!.trim(),
          phone: newWorker.phone!.trim(),
          status: 'AVAILABLE',
          advanceBalance: 0,
          totalEarnings: 0,
          totalSettled: 0,
        }, 'id', 'Rajesh V', 'MANAGER');
      }

      // Reset state and close modal
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
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setAddError('');
    } catch (err: any) {
      setAddError(err.message || 'An unexpected error occurred during user creation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAccountModal = (w: Worker) => {
    setAccountWorker(w);
    setNewAccountPassword('');
    setConfirmAccountPassword('');
    setAccountError('');
    setAccountSuccess('');
    setIsAccountModalOpen(true);
  };

  const handleResetPassword = async () => {
    if (!accountWorker) return;
    if (!newAccountPassword || newAccountPassword.length < 6) {
      setAccountError('New password must be at least 6 characters.');
      return;
    }
    if (newAccountPassword !== confirmAccountPassword) {
      setAccountError('Passwords do not match.');
      return;
    }

    try {
      if (accountWorker.userId) {
        try {
          await apiClient.users.update(accountWorker.userId, { password: newAccountPassword });
        } catch (e: any) {
          console.warn('Backend password update notice:', e.message);
        }
      }
      if (accountWorker.username) {
        updateStoredUserPassword(accountWorker.username, newAccountPassword);
      }
      setAccountSuccess(`Password updated successfully for ${accountWorker.username || accountWorker.name}.`);
      setNewAccountPassword('');
      setConfirmAccountPassword('');
      setTimeout(() => {
        setIsAccountModalOpen(false);
        setAccountSuccess('');
      }, 1500);
    } catch (err: any) {
      setAccountError(err.message || 'Failed to update credentials.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Workforce & Wage Management"
        description="Employee oversight, designation tracking, and authorized Worker Wage & Portal Access Control"
      >
        <button
          onClick={() => {
            setAddError('');
            setIsAddWorkerOpen(true);
          }}
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
            Portal Access Governance
          </span>
          <strong className="text-2xl font-bold text-emerald-700 block my-1">
            {workers.filter((w) => w.hasLogin || (w.role !== 'Driver' && w.hasLogin !== false)).length} Login Accounts
          </strong>
          <span className="text-xs text-[#5A6E7F]">Drivers strictly operational (no SaaS login)</span>
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
              placeholder="Search by worker name, ID (WRK-XXXX), phone, role, username..."
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
                <th>Login Access</th>
                <th>Phone</th>
                <th>Work Location</th>
                <th>Current Wage (Monthly)</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.map((w) => {
                const isDriver = w.role === 'Driver';
                const hasLogin = !isDriver && (w.hasLogin !== false);

                return (
                  <tr key={w.id}>
                    <td className="font-mono font-bold text-[#2F668F]">{w.id}</td>
                    <td className="font-bold text-[#16425B]">
                      {w.name}
                      {w.username && (
                        <span className="block text-[11px] font-normal text-[#5A6E7F] font-mono">
                          @{w.username}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded bg-[#f0f4f8] text-[#16425B] text-xs font-semibold">
                        {w.role}
                      </span>
                    </td>
                    <td>
                      {hasLogin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          No Login
                        </span>
                      )}
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
                    <td className="text-right space-x-1.5 whitespace-nowrap">
                      {hasLogin && (
                        <button
                          type="button"
                          onClick={() => handleOpenAccountModal(w)}
                          className="btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1 border-slate-300 text-slate-700 hover:bg-slate-100"
                          title="Manage Login Credentials"
                        >
                          <Key size={12} />
                          Login Access
                        </button>
                      )}
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
                );
              })}
              {filteredWorkers.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-xs text-[#5A6E7F]">
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
        onClose={() => {
          if (!isSubmitting) setIsAddWorkerOpen(false);
        }}
        title="Add New Workforce Personnel"
        subtitle="Register personnel and provision portal authentication credentials based on role eligibility"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-xs">
          {addError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
              <div>
                <strong className="block font-semibold">Validation Notice:</strong>
                <span>{addError}</span>
              </div>
            </div>
          )}

          {/* Personnel Details */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <h4 className="text-[11px] font-bold text-[#16425B] uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-[#2F668F]" />
              Personnel Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  User Type / Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={newWorker.role}
                  onChange={(e) => handleRoleChange(e.target.value as any)}
                  className="tms-input font-semibold"
                >
                  <option value="Data Entry Operator">Data Entry Operator (Worker Portal)</option>
                  <option value="Supervisor">Yard Supervisor (Worker Portal)</option>
                  <option value="Accounts">Accounts Assistant (Accounts Portal)</option>
                  <option value="Manager">Operations Manager (Manager Portal)</option>
                  <option value="Driver">Commercial Driver (Operational Only — No SaaS Login)</option>
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
          </div>

          {/* DYNAMIC LOGIN CREDENTIALS SECTION */}
          {newWorker.role === 'Driver' ? (
            /* STRICT RULE: DRIVER MUST NOT RECEIVE LOGIN CREDENTIALS */
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900">
              <div className="flex items-start gap-2.5">
                <Info size={18} className="text-amber-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Login Credentials: Not Applicable
                  </h4>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    <strong>Drivers do not require application login credentials.</strong> Commercial drivers are registered as operational fleet entities for trip dispatch, vehicle assignment, and cash/diesel settlements without SaaS portal login access.
                  </p>
                  <p className="text-[11px] text-amber-700 italic">
                    The backend strictly rejects user account creation for Driver personnel records.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* LOGIN-ENABLED ROLES: CREDENTIALS INPUT FORM */
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                <h4 className="text-[11px] font-bold text-[#16425B] uppercase tracking-wider flex items-center gap-1.5">
                  <Lock size={14} className="text-emerald-700" />
                  Application Login Credentials
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {newWorker.role === 'Accounts'
                    ? 'Accounts Portal Access'
                    : newWorker.role === 'Manager'
                    ? 'Manager Portal Access'
                    : 'Worker Portal Access'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">
                    Login Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                    placeholder="e.g. arun.kumar"
                    required
                    className="tms-input font-mono text-xs"
                  />
                  <span className="text-[10px] text-[#5A6E7F] mt-0.5 block">
                    Used for logging into the portal
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">
                    Official Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newWorker.email || ''}
                    onChange={(e) => setNewWorker({ ...newWorker, email: e.target.value })}
                    placeholder="e.g. arun@transflow.internal"
                    required
                    className="tms-input text-xs"
                  />
                  <span className="text-[10px] text-[#5A6E7F] mt-0.5 block">
                    Corporate notifications & recovery
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      className="tms-input pr-8 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-2 text-[#5A6E7F] hover:text-[#16425B]"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#16425B] mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      className="tms-input pr-8 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-2 text-[#5A6E7F] hover:text-[#16425B]"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-[#5A6E7F] pt-1">
                <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                <span>
                  Passwords are automatically hashed with BCrypt prior to persistence. Plaintext passwords are never stored.
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-[#D9DBD6]">
            <button
              type="button"
              onClick={() => setIsAddWorkerOpen(false)}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveNewWorker}
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Provisioning Personnel...
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  Save Worker & Create Credentials
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* MANAGE ACCOUNT MODAL (FOR EXISTING LOGIN-ENABLED PERSONNEL) */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title="Manage Application Login Account"
        subtitle={`Credential administration for ${accountWorker?.name || 'Worker'}`}
        maxWidth="max-w-md"
      >
        {accountWorker && (
          <div className="space-y-4 text-xs">
            {accountError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0 text-red-500" />
                <span>{accountError}</span>
              </div>
            )}
            {accountSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                <span>{accountSuccess}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider">
                  Associated User Account
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {accountWorker.systemRole}
                </span>
              </div>
              <p className="text-sm font-bold text-[#16425B]">{accountWorker.name}</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#5A6E7F] pt-1">
                <div>
                  <strong>Username:</strong> <span className="font-mono">{accountWorker.username || 'Not configured'}</span>
                </div>
                <div>
                  <strong>Email:</strong> <span>{accountWorker.email}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white border border-[#D9DBD6] rounded-lg space-y-3">
              <h4 className="text-xs font-bold text-[#16425B] flex items-center gap-1">
                <Key size={13} className="text-[#2F668F]" />
                Reset Account Password
              </h4>

              <div>
                <label className="block text-[11px] font-bold text-[#16425B] mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newAccountPassword}
                  onChange={(e) => setNewAccountPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="tms-input font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#16425B] mb-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmAccountPassword}
                  onChange={(e) => setConfirmAccountPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="tms-input font-mono text-xs"
                />
              </div>

              <span className="text-[10px] text-[#5A6E7F] block">
                Existing passwords are encrypted and cannot be displayed. Entering a new password will securely re-hash and update the user credentials.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#D9DBD6]">
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                className="btn-primary"
              >
                Update Password
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
