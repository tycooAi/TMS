'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from '../layout/PageHeader';
import { useTmsStore } from '../../lib/store';
import { Customer } from '../../types';
import { Check, Search, AlertTriangle } from '../ui/Icons';

type EntityTab = 'customers' | 'trips' | 'invoices' | 'payments' | 'vehicles' | 'drivers' | 'rates';

export function AdminDataExplorer() {
  const store = useTmsStore();
  const [activeTab, setActiveTab] = useState<EntityTab>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Edit form state for customer
  const [editCustomerData, setEditCustomerData] = useState<Partial<Customer>>({});

  const entityTabs: { key: EntityTab; label: string; count: number }[] = [
    { key: 'customers', label: 'Customers', count: store.customers.length },
    { key: 'trips', label: 'Trips (Immutable)', count: store.trips.length },
    { key: 'invoices', label: 'Invoices', count: store.invoices.length },
    { key: 'payments', label: 'Payments', count: store.payments.length },
    { key: 'vehicles', label: 'Vehicles', count: store.vehicles.length },
    { key: 'drivers', label: 'Drivers', count: store.drivers.length },
    { key: 'rates', label: 'Rate Cards', count: store.rates.length },
  ];

  // Filtered dataset
  const currentList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    switch (activeTab) {
      case 'customers':
        return store.customers.filter(
          (c) => !q || c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.phone.includes(q)
        );
      case 'trips':
        return store.trips.filter(
          (t) => !q || t.id.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q) || (t.vehicleRegistration || '').toLowerCase().includes(q)
        );
      case 'invoices':
        return store.invoices.filter(
          (i) => !q || i.id.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q)
        );
      case 'payments':
        return store.payments.filter(
          (p) => !q || p.id.toLowerCase().includes(q) || p.customerName.toLowerCase().includes(q)
        );
      case 'vehicles':
        return store.vehicles.filter(
          (v) => !q || v.registration.toLowerCase().includes(q) || v.type.toLowerCase().includes(q)
        );
      case 'drivers':
        return store.drivers.filter(
          (d) => !q || d.id.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) || d.phone.includes(q)
        );
      case 'rates':
        return store.rates.filter(
          (r) => !q || (r.customerId || '').toLowerCase().includes(q) || (r.material || '').toLowerCase().includes(q)
        );
      default:
        return [];
    }
  }, [activeTab, searchQuery, store]);

  // Relationships calculation for selected customer
  const relatedTrips = useMemo(() => {
    if (!selectedRecord || activeTab !== 'customers') return [];
    return store.trips.filter((t) => t.customerId === selectedRecord.id || t.customerName === selectedRecord.name);
  }, [selectedRecord, activeTab, store.trips]);

  const relatedInvoices = useMemo(() => {
    if (!selectedRecord || activeTab !== 'customers') return [];
    return store.invoices.filter((i) => i.customerId === selectedRecord.id || i.customerName === selectedRecord.name);
  }, [selectedRecord, activeTab, store.invoices]);

  const relatedPayments = useMemo(() => {
    if (!selectedRecord || activeTab !== 'customers') return [];
    return store.payments.filter((p) => p.customerId === selectedRecord.id || p.customerName === selectedRecord.name);
  }, [selectedRecord, activeTab, store.payments]);

  const handleOpenEdit = (item: any) => {
    setSelectedRecord(item);
    if (activeTab === 'customers') {
      setEditCustomerData({ ...item });
    }
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'customers' && selectedRecord) {
      const updated = { ...selectedRecord, ...editCustomerData } as Customer;
      store.updateCustomer(updated, 'Admin');
      setSelectedRecord(updated);
      setIsEditModalOpen(false);
      setActionSuccess(`Customer ${updated.id} successfully updated with audit record.`);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const handleExecuteArchive = () => {
    if (!selectedRecord || !archiveReason.trim()) return;
    if (activeTab === 'customers') {
      store.archiveCustomer(selectedRecord.id, archiveReason, 'Admin');
      setSelectedRecord({ ...selectedRecord, status: 'INACTIVE' });
      setIsArchiveModalOpen(false);
      setArchiveReason('');
      setActionSuccess(`Customer ${selectedRecord.id} archived with governance reason.`);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Data Explorer"
        subtitle="Search, inspect, and safely manage entity records with strict audit governance"
      />

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* ENTITY TYPE TABS - MINIMAL TEXT STYLE */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-2">
        {entityTabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              setSelectedRecord(null);
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === key
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{label}</span>
            <span className={`ml-1.5 text-[11px] ${activeTab === key ? 'text-slate-300' : 'text-slate-400'}`}>
              ({count})
            </span>
          </button>
        ))}
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-slate-200">
        <Search size={15} className="text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeTab} by ID, name, or phone...`}
          className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 hover:text-slate-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* DATA TABLE & DETAIL DRAWER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* RECORDS LIST */}
        <div className={`bg-white rounded-lg border border-slate-200 overflow-hidden ${selectedRecord ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {activeTab} ({currentList.length})
            </h3>
            <span className="text-[11px] text-slate-400">Audit Controlled</span>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Identifier</th>
                  <th className="py-2.5 px-4 font-medium">Primary Info</th>
                  <th className="py-2.5 px-4 font-medium">Details / Metrics</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentList.map((item: any) => {
                  const itemId = item.id || item.registration;
                  const isSelected = selectedRecord?.id === itemId || selectedRecord?.registration === itemId;
                  return (
                    <tr
                      key={itemId}
                      onClick={() => setSelectedRecord(item)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50/75'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono text-slate-800">{itemId}</td>
                      <td className="py-2.5 px-4">
                        <p className="text-slate-900 font-medium">{item.name || item.customerName || item.type}</p>
                        <p className="text-[11px] text-slate-500">{item.phone || item.material || item.destination}</p>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {item.balance !== undefined && (
                          <span className="font-mono">₹{item.balance.toLocaleString()} Bal</span>
                        )}
                        {item.totalFreight !== undefined && (
                          <span className="font-mono">₹{item.totalFreight.toLocaleString()} Freight</span>
                        )}
                        {item.amount !== undefined && (
                          <span className="font-mono">₹{item.amount.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.status === 'INACTIVE' ? 'bg-slate-400' : 'bg-emerald-500'
                            }`}
                          />
                          {item.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(item);
                          }}
                          className="px-2.5 py-1 text-xs text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAIL INSPECTION & RELATIONSHIP PANEL */}
        {selectedRecord && (
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400">{activeTab} Details</span>
                <h3 className="text-sm font-semibold text-slate-900">
                  {selectedRecord.id || selectedRecord.registration}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-xs text-slate-400 hover:text-slate-700 px-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded border border-slate-100 bg-slate-50/50 space-y-1.5">
                <p className="font-semibold text-slate-900">{selectedRecord.name || selectedRecord.customerName}</p>
                {selectedRecord.phone && <p className="text-slate-600">Phone: {selectedRecord.phone}</p>}
                {selectedRecord.address && <p className="text-slate-600">Address: {selectedRecord.address}</p>}
                {selectedRecord.gstin && <p className="text-slate-600 font-mono">GSTIN: {selectedRecord.gstin}</p>}
                <div className="pt-1 flex items-center justify-between text-slate-600">
                  <span>Status:</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        selectedRecord.status === 'INACTIVE' ? 'bg-slate-400' : 'bg-emerald-500'
                      }`}
                    />
                    {selectedRecord.status || 'ACTIVE'}
                  </span>
                </div>
              </div>

              {/* Controlled Action Buttons */}
              <div className="pt-1 flex gap-2">
                {activeTab === 'customers' && (
                  <>
                    <button
                      onClick={() => handleOpenEdit(selectedRecord)}
                      className="flex-1 py-1.5 px-3 rounded text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors"
                    >
                      Edit
                    </button>
                    {selectedRecord.status !== 'INACTIVE' && (
                      <button
                        onClick={() => setIsArchiveModalOpen(true)}
                        className="py-1.5 px-3 rounded text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                      >
                        Archive
                      </button>
                    )}
                  </>
                )}
                {activeTab !== 'customers' && (
                  <p className="text-[11px] text-slate-500 italic">
                    Historical business records use 2-person correction requests rather than direct edits.
                  </p>
                )}
              </div>
            </div>

            {/* RELATIONSHIPS SECTION FOR CUSTOMER */}
            {activeTab === 'customers' && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Linked Relationships
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded border border-slate-200 bg-white flex justify-between items-center">
                    <span className="text-slate-600">Related Trips:</span>
                    <span className="font-mono font-medium text-slate-900">{relatedTrips.length}</span>
                  </div>

                  <div className="p-2.5 rounded border border-slate-200 bg-white flex justify-between items-center">
                    <span className="text-slate-600">Generated Invoices:</span>
                    <span className="font-mono font-medium text-slate-900">{relatedInvoices.length}</span>
                  </div>

                  <div className="p-2.5 rounded border border-slate-200 bg-white flex justify-between items-center">
                    <span className="text-slate-600">Recorded Payments:</span>
                    <span className="font-mono font-medium text-slate-900">{relatedPayments.length}</span>
                  </div>

                  <div className="p-2.5 rounded border border-slate-200 bg-slate-50 flex justify-between items-center">
                    <span className="text-slate-700 font-medium">Outstanding Balance:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ₹{(selectedRecord.balance || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONTROLLED EDIT MODAL */}
      {isEditModalOpen && selectedRecord && activeTab === 'customers' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-none">
          <form
            onSubmit={handleSaveEdit}
            className="max-w-md w-full max-w-[calc(100vw-1rem)] bg-white rounded-lg border border-slate-300 shadow-xl p-4 sm:p-5 space-y-4"
          >
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                Edit Entity: {selectedRecord.id}
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Customer Name</label>
                <input
                  type="text"
                  value={editCustomerData.name || ''}
                  onChange={(e) => setEditCustomerData({ ...editCustomerData, name: e.target.value })}
                  className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editCustomerData.phone || ''}
                  onChange={(e) => setEditCustomerData({ ...editCustomerData, phone: e.target.value })}
                  className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Billing Address</label>
                <textarea
                  rows={2}
                  value={editCustomerData.address || ''}
                  onChange={(e) => setEditCustomerData({ ...editCustomerData, address: e.target.value })}
                  className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Credit Terms</label>
                <input
                  type="text"
                  value={editCustomerData.creditTerms || ''}
                  onChange={(e) => setEditCustomerData({ ...editCustomerData, creditTerms: e.target.value })}
                  className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Note: This change will be logged under your administrator audit trail.
              </p>
            </div>

            <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-full sm:w-auto px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors text-center"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ARCHIVE CONFIRMATION MODAL */}
      {isArchiveModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-none">
          <div className="max-w-md w-full max-w-[calc(100vw-1rem)] bg-white rounded-lg border border-slate-300 shadow-xl p-4 sm:p-5 space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                Archive Entity: {selectedRecord.name}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Archiving marks this entity as inactive to prevent future dispatches while preserving past ledger and invoice history.
            </p>

            <div className="text-xs">
              <label className="block text-slate-700 font-medium mb-1">
                Reason for Archiving (Mandatory)
              </label>
              <input
                type="text"
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder="e.g. Contract terminated / Account closed"
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-500"
              />
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
                className="w-full sm:w-auto px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteArchive}
                disabled={!archiveReason.trim()}
                className="w-full sm:w-auto px-4 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 rounded-md transition-colors text-center"
              >
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
