'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { Plus, Users, Shield, Key, AlertCircle, CheckCircle2, Trash2, UserX } from '../ui/Icons';
import { UserRole } from '../../types';
import { apiClient } from '../../lib/api';
import { getStoredUsers, registerApplicationUser, removeStoredUser, updateStoredUserPassword } from '../../lib/auth';

interface ManagedUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  employeeId?: string;
  designation?: string;
}

export function AdminUsers() {
  const [usersList, setUsersList] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New user form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('WORKER');
  const [employeeId, setEmployeeId] = useState(`WRK-${Math.floor(1000 + Math.random() * 9000)}`);
  const [error, setError] = useState('');

  // Password reset modal
  const [resetUser, setResetUser] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  // Remove user confirmation state
  const [userToRemove, setUserToRemove] = useState<ManagedUser | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    let loaded: ManagedUser[] = [];

    try {
      const res = await apiClient.users.getAll();
      const list = res && res.data && Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      if (list.length > 0) {
        loaded = list.map((u: any) => ({
          id: u.id,
          username: u.username,
          name: u.fullName || u.username,
          email: u.email || u.username,
          role: (u.role || 'WORKER') as UserRole,
          status: (u.status || 'ACTIVE').toUpperCase() as 'ACTIVE' | 'INACTIVE',
          employeeId: u.employeeId || 'EMP-' + u.username,
          designation: `${u.role} Operations`,
        }));
      }
    } catch (err) {
      console.warn('Backend users fetch fallback to local store:', err);
      const local = getStoredUsers();
      loaded = local.map((u) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        email: u.email,
        role: u.role,
        status: 'ACTIVE',
        employeeId: u.employeeId,
        designation: u.designation,
      }));
    }

    setUsersList(loaded);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
    const handleUpdate = () => loadUsers();
    window.addEventListener('tms:users-updated', handleUpdate);
    return () => window.removeEventListener('tms:users-updated', handleUpdate);
  }, [loadUsers]);

  const handleCreateUser = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in Name, Email, and Password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim() ? username.trim().toLowerCase() : cleanEmail;

    // Check duplicate locally
    if (usersList.some((u) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail)) {
      setError(`A user with username or email "${cleanEmail}" already exists.`);
      return;
    }

    let createdId: string | undefined;

    // Send to backend API
    try {
      const res = await apiClient.users.create({
        username: cleanUsername,
        fullName: name.trim(),
        email: cleanEmail,
        role: role,
        password: password,
      });
      if (res && res.data) {
        createdId = res.data.id;
      }
    } catch (apiErr: any) {
      console.warn('Backend user create note:', apiErr.message);
      if (apiErr.message && (apiErr.message.includes('already exists') || apiErr.message.includes('already registered'))) {
        setError(apiErr.message);
        return;
      }
    }

    registerApplicationUser({
      id: createdId || `USR-${String(usersList.length + 1).padStart(3, '0')}`,
      username: cleanUsername,
      password: '',
      name: name.trim(),
      email: cleanEmail,
      role,
      employeeId,
      designation:
        role === 'WORKER'
          ? 'Data Entry Operator'
          : role === 'ACCOUNTS'
          ? 'Accounts Officer'
          : role === 'MANAGER'
          ? 'Operations Manager'
          : role === 'MD'
          ? 'Managing Director'
          : 'System Administrator',
    });

    setIsConfirmOpen(false);
    setIsModalOpen(false);
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setError('');
    setFeedbackMessage({
      type: 'success',
      text: `User account "${cleanEmail}" created successfully.`,
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
    loadUsers();
  };

  const handleResetPasswordSubmit = async () => {
    if (!resetUser) return;
    if (!newPassword || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }

    try {
      if (resetUser.id) {
        try {
          await apiClient.users.update(resetUser.id, { password: newPassword });
        } catch (e: any) {
          console.warn('Backend password reset notice:', e.message);
        }
      }
      updateStoredUserPassword(resetUser.username, newPassword);
      setResetSuccess(`Password updated for user ${resetUser.username}.`);
      setTimeout(() => {
        setResetUser(null);
        setNewPassword('');
        setResetSuccess('');
        setResetError('');
      }, 1500);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password.');
    }
  };

  const handleConfirmRemoveUser = async () => {
    if (!userToRemove) return;
    setIsRemoving(true);

    try {
      // Primary admin safeguard
      if (
        userToRemove.username.toLowerCase() === 'admin@transports' ||
        userToRemove.email.toLowerCase() === 'admin@transports'
      ) {
        throw new Error('The primary system administrator account (admin@transports) cannot be removed.');
      }

      // Backend API soft-deletion
      await apiClient.users.delete(userToRemove.id);
      removeStoredUser(userToRemove.id);

      setFeedbackMessage({
        type: 'success',
        text: `User ${userToRemove.name} (${userToRemove.email}) has been deactivated. Historical records remain intact.`,
      });
      setTimeout(() => setFeedbackMessage(null), 5000);
      setUserToRemove(null);
      await loadUsers();
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Failed to remove user account.',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const isPrimaryAdmin = (u: ManagedUser) =>
    u.username.toLowerCase() === 'admin@transports' || u.email.toLowerCase() === 'admin@transports';

  return (
    <div className="space-y-6">
      <PageHeader
        title="User & Account Access Management"
        description="Provision enterprise users, assign portal roles, and configure system credentials"
      >
        <button
          onClick={() => {
            setError('');
            setIsModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={16} />
          Create New User
        </button>
      </PageHeader>

      {feedbackMessage && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between gap-3 text-xs font-semibold ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border border-[#D9DBD6] p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <span className="text-xs text-[#5A6E7F]">
            Total Provisioned Accounts: <strong>{usersList.length}</strong> (Synchronized across Spring Boot Backend & Security RBAC)
          </span>
          <button
            onClick={loadUsers}
            className="text-xs text-[#2F668F] font-semibold hover:underline self-start sm:self-auto"
          >
            ↻ Refresh Directory
          </button>
        </div>

        <div className="table-container">
          <table className="tms-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Employee Name</th>
                <th>Email</th>
                <th>System Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => {
                const isAdmin = isPrimaryAdmin(u);
                const isInactive = u.status === 'INACTIVE';
                return (
                  <tr key={u.id || u.username} className={isInactive ? 'opacity-60 bg-slate-50' : ''}>
                    <td className="font-bold text-[#2F668F] font-mono text-xs">{u.id}</td>
                    <td className="font-bold text-[#16425B]">
                      {u.name}
                      {isAdmin && (
                        <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-800 rounded font-semibold">
                          Primary Admin
                        </span>
                      )}
                    </td>
                    <td className="font-mono text-xs font-semibold text-[#16425B]">{u.email}</td>
                    <td>
                      <span className="px-2.5 py-1 text-xs font-bold rounded bg-[#e8f1f5] text-[#2F668F] border border-[#a1c4d8]">
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={u.status} />
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setResetUser(u);
                            setNewPassword('');
                            setResetError('');
                            setResetSuccess('');
                          }}
                          className="btn-secondary py-1 px-2.5 text-[11px] inline-flex items-center gap-1 border-slate-300 text-slate-700 hover:bg-slate-100"
                          title="Reset credentials"
                        >
                          <Key size={12} />
                          <span>Reset Access</span>
                        </button>

                        {!isAdmin ? (
                          <button
                            onClick={() => setUserToRemove(u)}
                            className="btn-secondary py-1 px-2.5 text-[11px] inline-flex items-center gap-1 border-rose-200 text-rose-700 hover:bg-rose-50"
                            title="Remove/Deactivate user"
                          >
                            <Trash2 size={12} />
                            <span>Remove User</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="btn-secondary py-1 px-2.5 text-[11px] inline-flex items-center gap-1 border-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                            title="Primary Admin account cannot be removed"
                          >
                            <Shield size={12} />
                            <span>Protected</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {usersList.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-xs text-[#5A6E7F]">
                    No user accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW USER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New User"
        subtitle="Provision an enterprise login account with role-based access"
        maxWidth="max-w-md"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-1.5">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-[#16425B] mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Chandran"
              className="tms-input"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#16425B] mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (!username) setUsername(e.target.value);
              }}
              placeholder="e.g. ramesh@transports"
              className="tms-input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Role *</label>
              <select
                value={role}
                onChange={(e) => {
                  const r = e.target.value as UserRole;
                  setRole(r);
                  setEmployeeId(`${r.slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`);
                }}
                className="tms-input font-bold"
              >
                <option value="WORKER">WORKER</option>
                <option value="ACCOUNTS">ACCOUNTS</option>
                <option value="MANAGER">MANAGER</option>
                <option value="MD">MD</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Employee ID</label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="tms-input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#16425B] mb-1">Initial Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="tms-input font-mono"
              required
            />
          </div>

          <div className="p-3 bg-[#f8faf5] border border-[#D9DBD6] rounded text-[#5A6E7F] text-[11px]">
            Password will be securely hashed with BCrypt. Plaintext credentials are never saved or exposed.
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-[#D9DBD6]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto btn-secondary text-center justify-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="w-full sm:w-auto btn-primary text-center justify-center"
            >
              Create User
            </button>
          </div>
        </div>
      </Modal>

      {/* CONFIRM CREATION DIALOG */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Confirm User Account Creation?"
        message={`Create user account "${email}" with ${role} authorization?`}
        confirmLabel="Create User"
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleCreateUser}
      />

      {/* REMOVE USER SAFETY CONFIRMATION MODAL */}
      <Modal
        isOpen={!!userToRemove}
        onClose={() => setUserToRemove(null)}
        title="Remove User?"
        subtitle="Confirm account deactivation"
        maxWidth="max-w-md"
      >
        {userToRemove && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 border border-[#D9DBD6] rounded-lg space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="font-semibold text-[#5A6E7F]">User:</span>
                <span className="font-bold text-[#16425B] text-sm">{userToRemove.name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="font-semibold text-[#5A6E7F]">Email:</span>
                <span className="font-mono text-xs text-[#16425B]">{userToRemove.email}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-[#5A6E7F]">Role:</span>
                <span className="font-bold text-[#2F668F] px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-xs">
                  {userToRemove.role}
                </span>
              </div>
            </div>

            <p className="text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-md">
              This will disable this user&apos;s access to the application.
            </p>

            <p className="text-[11px] text-[#5A6E7F] leading-relaxed">
              Business data created by this user (trips, invoices, ledgers, vouchers, customer records, and audit history) will remain intact.
            </p>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-[#D9DBD6]">
              <button
                type="button"
                onClick={() => setUserToRemove(null)}
                disabled={isRemoving}
                className="w-full sm:w-auto btn-secondary text-center justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveUser}
                disabled={isRemoving}
                className="w-full sm:w-auto py-2 px-4 rounded-md text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors inline-flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isRemoving ? 'Deactivating…' : 'Remove User'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal
        isOpen={!!resetUser}
        onClose={() => setResetUser(null)}
        title="Reset User Credentials"
        subtitle={`Update password for ${resetUser?.username}`}
        maxWidth="max-w-sm"
      >
        {resetUser && (
          <div className="space-y-4 text-xs">
            {resetError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0" />
                <span>{resetError}</span>
              </div>
            )}
            {resetSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter minimum 6 characters"
                className="tms-input font-mono"
                required
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-[#D9DBD6]">
              <button
                type="button"
                onClick={() => setResetUser(null)}
                className="w-full sm:w-auto btn-secondary text-center justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPasswordSubmit}
                className="w-full sm:w-auto btn-primary text-center justify-center"
              >
                Save New Password
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
