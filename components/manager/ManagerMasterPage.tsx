'use client';

import React, { useState } from 'react';
import { useTmsStore, StoreState } from '../../lib/store';
import { PageHeader } from '../layout/PageHeader';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { Plus, Search, Edit3, Trash2 } from '../ui/Icons';
import { generateNextId } from '../../lib/ids';

export type MasterEntityKey =
  | 'workers'
  | 'customers'
  | 'vehicles'
  | 'drivers'
  | 'materials'
  | 'sources'
  | 'locations'
  | 'rates';

interface FieldConfig {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  options?: string[];
  readOnly?: boolean;
}

interface ManagerMasterPageProps {
  entityKey: MasterEntityKey;
  title: string;
  description: string;
  idField?: string;
  prefix?: string;
  fields: FieldConfig[];
}

export function ManagerMasterPage({
  entityKey,
  title,
  description,
  idField = 'id',
  prefix = 'REC',
  fields,
}: ManagerMasterPageProps) {
  const store = useTmsStore();
  const items = (store[entityKey] as any[]) || [];

  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [modalItem, setModalItem] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const filteredItems = items.filter((item) => {
    const q = query.trim().toLowerCase();
    const matchQ =
      !q ||
      Object.values(item).some(
        (val) => val && String(val).toLowerCase().includes(q)
      );
    const matchStatus =
      filterStatus === 'ALL' || item.status === filterStatus;
    return matchQ && matchStatus;
  });

  const handleOpenAdd = () => {
    const newId =
      idField === 'registration'
        ? 'TN 58 AB ' + String(Math.floor(1000 + Math.random() * 9000))
        : generateNextId(
            prefix,
            items.map((x) => x[idField])
          );

    const initialObj: any = {
      [idField]: newId,
      status: 'ACTIVE',
    };

    fields.forEach((f) => {
      if (!initialObj[f.key]) {
        initialObj[f.key] = f.type === 'number' ? 0 : f.options ? f.options[0] : '';
      }
    });

    setModalItem(initialObj);
    setIsEditing(false);
  };

  const handleOpenEdit = (item: any) => {
    setModalItem({ ...item });
    setIsEditing(true);
  };

  const handleSaveItem = () => {
    if (!modalItem) return;
    store.saveMasterItem(entityKey, modalItem, idField, 'Rajesh V', 'MANAGER');
    setModalItem(null);
  };

  const handleToggleStatus = (item: any) => {
    const updated = {
      ...item,
      status: item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
    };
    store.saveMasterItem(entityKey, updated, idField, 'Rajesh V', 'MANAGER');
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return;
    store.deleteMasterItem(entityKey, deleteTargetId, idField, 'Rajesh V', 'MANAGER');
    setDeleteTargetId(null);
  };

  return (
    <div>
      <PageHeader title={title} description={description}>
        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus size={16} />
          Add New Record
        </button>
      </PageHeader>

      {/* SEARCH AND FILTER TOOLS */}
      <div className="bg-white p-4 rounded-lg border border-[#D9DBD6] mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-[#5A6E7F]" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search in ${title.toLowerCase()}...`}
            className="tms-input pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="tms-input w-36"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* MASTER DATA TABLE */}
      <div className="table-container">
        <table className="tms-table">
          <thead>
            <tr>
              <th>{idField.toUpperCase()}</th>
              {fields
                .filter((f) => f.key !== idField && f.key !== 'status')
                .map((f) => (
                  <th key={f.key}>{f.label}</th>
                ))}
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((row) => (
              <tr key={row[idField]}>
                <td className="font-bold text-[#2F668F]">{row[idField]}</td>
                {fields
                  .filter((f) => f.key !== idField && f.key !== 'status')
                  .map((f) => (
                    <td key={f.key}>
                      {f.type === 'number' && typeof row[f.key] === 'number'
                        ? row[f.key].toLocaleString('en-IN')
                        : String(row[f.key] ?? '—')}
                    </td>
                  ))}
                <td>
                  <StatusBadge status={row.status || 'ACTIVE'} />
                </td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(row)}
                      className="p-1.5 text-[#2F668F] hover:bg-[#e8f1f5] rounded"
                      title="Edit Record"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(row)}
                      className="px-2 py-0.5 text-[11px] font-semibold rounded border border-[#D9DBD6] bg-white text-[#16425B] hover:bg-[#f8faf5]"
                    >
                      {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(row[idField])}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      title="Delete Record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td
                  colSpan={fields.length + 2}
                  className="text-center py-10 text-[#5A6E7F]"
                >
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD/EDIT MODAL */}
      {modalItem && (
        <Modal
          isOpen={true}
          onClose={() => setModalItem(null)}
          title={`${isEditing ? 'Edit' : 'Add New'} ${title.replace(/s$/, '')}`}
          subtitle="Changes are synced immediately to the shared company master store."
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">
                  {idField.toUpperCase()}
                </label>
                <input
                  type="text"
                  value={modalItem[idField]}
                  readOnly
                  className="tms-input bg-[#f8faf5] text-[#5A6E7F] font-bold"
                />
              </div>

              {fields
                .filter((f) => f.key !== idField && f.key !== 'status')
                .map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-bold text-[#16425B] mb-1">
                      {f.label}
                    </label>
                    {f.options ? (
                      <select
                        value={modalItem[f.key] || ''}
                        onChange={(e) =>
                          setModalItem({ ...modalItem, [f.key]: e.target.value })
                        }
                        className="tms-input"
                      >
                        {f.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={f.type === 'number' ? 'number' : 'text'}
                        value={modalItem[f.key] ?? ''}
                        onChange={(e) =>
                          setModalItem({
                            ...modalItem,
                            [f.key]:
                              f.type === 'number'
                                ? Number(e.target.value)
                                : e.target.value,
                          })
                        }
                        className="tms-input"
                      />
                    )}
                  </div>
                ))}

              <div>
                <label className="block text-xs font-bold text-[#16425B] mb-1">Status</label>
                <select
                  value={modalItem.status || 'ACTIVE'}
                  onChange={(e) =>
                    setModalItem({ ...modalItem, status: e.target.value })
                  }
                  className="tms-input"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#D9DBD6]">
              <button
                type="button"
                onClick={() => setModalItem(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                className="btn-primary"
              >
                Save Record
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Delete Master Record?"
        message={`Are you sure you want to delete ${deleteTargetId}? This action will create an audit entry.`}
        confirmLabel="Delete Record"
        isDestructive
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
