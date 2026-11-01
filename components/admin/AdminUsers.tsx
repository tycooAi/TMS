'use client';

import React, { useState } from 'react';
import { DEMO_USERS, DemoUser } from '../../lib/auth';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { Plus, Users, Shield } from '../ui/Icons';
import { UserRole } from '../../types';

export function AdminUsers() {
  const [usersList, setUsersList] = useState<DemoUser[]>(DEMO_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // New user form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('WORKER');
  const [employeeId, setEmployeeId] = useState(`WRK-${Math.floor(1000 + Math.random() * 9000)}`);
  const [error, setError] = useState('');

  const handleCreateUser = () => {
    if (!name.trim() || !username.trim() || !email.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    const newUser: DemoUser = {
      id: `USR-${String(usersList.length + 1).padStart(3, '0')}`,
      username: username.trim().toLowerCase(),
      password: 'password123',
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      employeeId,
      designation: role === 'WORKER' ? 'Data Entry Operator' : role === 'ACCOUNTS' ? 'Accounts Officer' : role === 'MANAGER' ? 'Operations Manager' : role,
    };

    setUsersList([...usersList, newUser]);
    setIsConfirmOpen(false);
    setIsModalOpen(false);
    setName('');
    setUsername('');
    setEmail('');
  };

  return (
    <div>
      <PageHeader
        title="User & Account Access Management"
        description="Provision enterprise users, assign portal roles, and configure system credentials"
      >
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={16} />
          Create User Account
        </button>
      </PageHeader>

      <div className="bg-white rounded-lg border border-[#D9DBD6] p-5 shadow-sm">
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
                <tr key={u.id}>
                  <td className="font-bold text-[#2F668F]">{u.id}</td>
                  <td className="font-bold text-[#16425B]">{u.name}</td>
                  <td className="font-mono text-xs">{u.username}</td>
                  <td className="font-semibold text-[#16425B]">{u.employeeId}</td>
                  <td>{u.email}</td>
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
                      onClick={() => alert(`Reset temporary password for ${u.username} to password123`)}
                      className="btn-secondary py-1 px-2.5 text-[11px]"
                    >
                      Reset Access
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision New System User"
        subtitle="Assign role and credentials for prototype workspace"
        maxWidth="max-w-md"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
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
              className="tms-input"
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
                className="tms-input"
              />
            </div>
          </div>

          <div className="p-3 bg-[#f8faf5] border border-[#D9DBD6] rounded text-[#5A6E7F]">
            Default password will be initialized to <code>password123</code>.
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#D9DBD6]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="btn-primary"
            >
              Provision Account
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Confirm User Account Creation?"
        message={`Create user account "${username}" with ${role} authorization?`}
        confirmLabel="Create User"
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleCreateUser}
      />
    </div>
  );
}
