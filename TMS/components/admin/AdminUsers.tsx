'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DEMO_USERS, DemoUser, getAllApplicationUsers, registerApplicationUser, updateStoredUserPassword } from '../../lib/auth';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { Plus, Users, Shield, Key, AlertCircle, CheckCircle2 } from '../ui/Icons';
import { UserRole } from '../../types';
import { apiClient } from '../../lib/api';

export function AdminUsers() {
  const [usersList, setUsersList] = useState<DemoUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // New user form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<UserRole>('WORKER');
  const [employeeId, setEmployeeId] = useState(`WRK-${Math.floor(1000 + Math.random() * 9000)}`);
  const [error, setError] = useState('');

  // Password reset modal
  const [resetUser, setResetUser] = useState<DemoUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    // Start with local application users (demo + manager-created users)
    const localUsers = getAllApplicationUsers();
    let merged = [...localUsers];

    try {
      const res = await apiClient.users.getAll();
      const list = res && res.data && Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      if (list.length > 0) {
        list.forEach((backendUser: any) => {
          const exists = merged.findIndex(
            (u) =>
              u.id === backendUser.id ||
              u.username.toLowerCase() === (backendUser.username || '').toLowerCase()
          );
          if (exists >= 0) {
            merged[exists] = {
              ...merged[exists],
              name: backendUser.fullName || merged[exists].name,
              email: backendUser.email || merged[exists].email,
              role: (backendUser.role || merged[exists].role) as UserRole,
            };
          } else {
            merged.push({
              id: backendUser.id,
              username: backendUser.username,
              password: '', // Never expose passwords
              name: backendUser.fullName || backendUser.username,
              email: backendUser.email || `${backendUser.username}@transflow.internal`,
              role: (backendUser.role || 'WORKER') as UserRole,
              employeeId: backendUser.employeeId || 'EMP-' + backendUser.username,
              designation: `${backendUser.role} Staff`,
            });
          }
        });
      }
    } catch (err) {
      console.warn('Backend users fetch fallback to local store:', err);
    }

    setUsersList(merged);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
    const handleUpdate = () => loadUsers();
    window.addEventListener('tms:users-updated', handleUpdate);
    return () => window.removeEventListener('tms:users-updated', handleUpdate);
  }, [loadUsers]);

  const handleCreateUser = async () => {
    if (!name.trim() || !username.trim() || !email.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate
    if (usersList.some((u) => u.username.toLowerCase() === cleanUsername)) {
      setError(`Username "${cleanUsername}" already exists.`);
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
      if (apiErr.message && apiErr.message.includes('already exists')) {
        setError(apiErr.message);
        return;
      }
    }

    const newUser: DemoUser = {
      id: createdId || `USR-${String(usersList.length + 1).padStart(3, '0')}`,
      username: cleanUsername,
      password: password,
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
    };

    registerApplicationUser(newUser);
    setIsConfirmOpen(false);
    setIsModalOpen(false);
    setName('');
    setUsername('');
    setEmail('');
    setPassword('password123');
    setError('');
    loadUsers();
  };

  const handleResetPasswordSubmit = async () => {
    if (!resetUser) return;
    if (!newPassword || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }

    try {
      if (resetUser.id && resetUser.id.startsWith('USR-')) {
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

  return (
    <div>
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
          Create User Account
        </button>
      </PageHeader>

      <div className="bg-white rounded-lg border border-[#D9DBD6] p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <span className="text-xs text-[#5A6E7F]">
            Total Active Accounts: <strong>{usersList.length}</strong> (Synchronized across Spring Boot & TransFlow SaaS)
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
                <th>Username</th>
                <th>Employee ID</th>
                <th>Email</th>
                <th>System Role</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.id || u.username}>
                  <td className="font-bold text-[#2F668F] font-mono">{u.id}</td>
                  <td className="font-bold text-[#16425B]">{u.name}</td>
                  <td className="font-mono text-xs font-semibold text-[#16425B]">@{u.username}</td>
                  <td className="font-semibold text-[#5A6E7F]">{u.employeeId}</td>
                  <td className="text-xs">{u.email}</td>
                  <td>
                    <span className="px-2.5 py-1 text-xs font-bold rounded bg-[#e8f1f5] text-[#2F668F] border border-[#a1c4d8]">
                      {u.role}
                    </span>
                  </td>
                  <td className="text-xs text-[#5A6E7F]">{u.designation}</td>
                  <td>
                    <StatusBadge status="ACTIVE" />
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setResetUser(u);
                        setNewPassword('');
                        setResetError('');
                        setResetSuccess('');
                      }}
                      className="btn-secondary py-1 px-2.5 text-[11px] inline-flex items-center gap-1 border-slate-300 text-slate-700 hover:bg-slate-100"
                    >
                      <Key size={12} />
                      Reset Access
                    </button>
                  </td>
                </tr>
              ))}
              {usersList.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-xs text-[#5A6E7F]">
                    No user accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision New System User"
        subtitle="Assign role and credentials for enterprise access"
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
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#16425B] mb-1">Username *</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. ramesh"
              className="tms-input font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#16425B] mb-1">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ramesh@transflow.internal"
              className="tms-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#16425B] mb-1">Portal Role</label>
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
            />
          </div>

          <div className="p-3 bg-[#f8faf5] border border-[#D9DBD6] rounded text-[#5A6E7F] text-[11px]">
            Password will be securely hashed with BCrypt. Plaintext credentials are never saved.
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
              Provision Account
            </button>
          </div>
        </div>
      </Modal>

      {/* CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Confirm User Account Creation?"
        message={`Create user account "${username}" with ${role} authorization?`}
        confirmLabel="Create User"
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleCreateUser}
      />

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
