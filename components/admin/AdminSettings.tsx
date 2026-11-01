'use client';

import React, { useState } from 'react';
import { PageHeader } from '../layout/PageHeader';
import { useTmsStore } from '../../lib/store';
import { Check, RefreshCw } from '../ui/Icons';

export function AdminSettings() {
  const { addAudit } = useTmsStore();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [companySettings, setCompanySettings] = useState({
    companyName: 'TransFlow Logistics Private Limited',
    gstin: '24AAACT1234F1Z8',
    pan: 'AAACT1234F',
    email: 'billing@transflow.logistics',
    phone: '+91 98765 43210',
    address: 'Plot 104, Transport Hub, GIDC Phase 3, Surat - 395006, Gujarat',
    bankName: 'HDFC Bank Ltd',
    accountNumber: '50200088992211',
    ifscCode: 'HDFC0001234',
    branch: 'Ring Road Commercial Branch',
  });

  const [invoiceSettings, setInvoiceSettings] = useState({
    prefix: 'INV-',
    nextNumber: 1045,
    defaultGstPercent: 5,
    enableRcm: true,
    paymentTermsDays: 15,
    footerNote: 'Computer generated invoice. Payments due within terms.',
  });

  const [operationalSettings, setOperationalSettings] = useState({
    workerCanCreateCustomer: false,
    requireAdvanceApprovalAbove: 5000,
    lockCorrectionAfterDays: 7,
    autoConsolidateMonthly: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    addAudit({
      user: 'Super Admin',
      userRole: 'ADMIN',
      action: 'UPDATE',
      entity: 'SYSTEM_SETTINGS',
      entityId: 'CONFIG-GLOBAL',
      description: 'Updated company configuration, invoice prefix rules, and business constraints.',
    });
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="System & Company Settings"
        description="Configure company identity, GST tax handling, invoice sequences, and operational safeguards"
      />

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-sm">
          <Check size={18} className="text-emerald-600" />
          Settings updated and audit event logged successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Identity */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D9DBD6] p-6 space-y-4">
          <h3 className="text-base font-bold text-[#16425B] border-b border-[#D9DBD6] pb-2">
            Company & Tax Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Company Registered Name</label>
              <input
                type="text"
                value={companySettings.companyName}
                onChange={e => setCompanySettings(s => ({ ...s, companyName: e.target.value }))}
                className="tms-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">GSTIN</label>
              <input
                type="text"
                value={companySettings.gstin}
                onChange={e => setCompanySettings(s => ({ ...s, gstin: e.target.value }))}
                className="tms-input font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Billing Email</label>
              <input
                type="email"
                value={companySettings.email}
                onChange={e => setCompanySettings(s => ({ ...s, email: e.target.value }))}
                className="tms-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Official Contact Phone</label>
              <input
                type="text"
                value={companySettings.phone}
                onChange={e => setCompanySettings(s => ({ ...s, phone: e.target.value }))}
                className="tms-input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Registered Address</label>
              <input
                type="text"
                value={companySettings.address}
                onChange={e => setCompanySettings(s => ({ ...s, address: e.target.value }))}
                className="tms-input"
              />
            </div>
          </div>
        </div>

        {/* Banking & Remittance */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D9DBD6] p-6 space-y-4">
          <h3 className="text-base font-bold text-[#16425B] border-b border-[#D9DBD6] pb-2">
            Default Remittance Bank Account (Printed on Invoices)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={companySettings.bankName}
                onChange={e => setCompanySettings(s => ({ ...s, bankName: e.target.value }))}
                className="tms-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Account Number</label>
              <input
                type="text"
                value={companySettings.accountNumber}
                onChange={e => setCompanySettings(s => ({ ...s, accountNumber: e.target.value }))}
                className="tms-input font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={companySettings.ifscCode}
                onChange={e => setCompanySettings(s => ({ ...s, ifscCode: e.target.value }))}
                className="tms-input font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Branch Name</label>
              <input
                type="text"
                value={companySettings.branch}
                onChange={e => setCompanySettings(s => ({ ...s, branch: e.target.value }))}
                className="tms-input"
              />
            </div>
          </div>
        </div>

        {/* Invoice & GST Parameters */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D9DBD6] p-6 space-y-4">
          <h3 className="text-base font-bold text-[#16425B] border-b border-[#D9DBD6] pb-2">
            Invoicing & Tax Sequence Rules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={invoiceSettings.prefix}
                onChange={e => setInvoiceSettings(s => ({ ...s, prefix: e.target.value }))}
                className="tms-input font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Next Sequence Number</label>
              <input
                type="number"
                value={invoiceSettings.nextNumber}
                onChange={e => setInvoiceSettings(s => ({ ...s, nextNumber: Number(e.target.value) }))}
                className="tms-input font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Default GST Rate (%)</label>
              <select
                value={invoiceSettings.defaultGstPercent}
                onChange={e => setInvoiceSettings(s => ({ ...s, defaultGstPercent: Number(e.target.value) }))}
                className="tms-input bg-white"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5% (Transport / GTA)</option>
                <option value={12}>12% (Forward Charge GTA)</option>
                <option value={18}>18% (Standard Service)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Default Credit Period (Days)</label>
              <input
                type="number"
                value={invoiceSettings.paymentTermsDays}
                onChange={e => setInvoiceSettings(s => ({ ...s, paymentTermsDays: Number(e.target.value) }))}
                className="tms-input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Invoice Standard Disclaimer</label>
              <input
                type="text"
                value={invoiceSettings.footerNote}
                onChange={e => setInvoiceSettings(s => ({ ...s, footerNote: e.target.value }))}
                className="tms-input"
              />
            </div>
          </div>
        </div>

        {/* Operational Constraint Enforcement */}
        <div className="bg-white rounded-xl shadow-sm border border-[#D9DBD6] p-6 space-y-4">
          <h3 className="text-base font-bold text-[#16425B] border-b border-[#D9DBD6] pb-2">
            Operational Constraints & Security Policies
          </h3>
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={operationalSettings.workerCanCreateCustomer}
                onChange={e => setOperationalSettings(s => ({ ...s, workerCanCreateCustomer: e.target.checked }))}
                className="mt-0.5 rounded text-[#2F668F] focus:ring-[#2F668F]"
              />
              <div className="text-xs">
                <span className="font-semibold text-gray-800 block">Allow Worker to Register New Master Customers</span>
                <span className="text-gray-500">
                  Default OFF (Recommended). Workers receive &quot;Customer not found — Contact Manager/Admin&quot; to eliminate duplicate records.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={operationalSettings.autoConsolidateMonthly}
                onChange={e => setOperationalSettings(s => ({ ...s, autoConsolidateMonthly: e.target.checked }))}
                className="mt-0.5 rounded text-[#2F668F] focus:ring-[#2F668F]"
              />
              <div className="text-xs">
                <span className="font-semibold text-gray-800 block">Auto-group Unbilled Trips by Billing Cycle in Invoicing Wizard</span>
                <span className="text-gray-500">
                  Pre-selects all pending trips for a customer when generating a multi-trip GST invoice.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="btn-primary"
          >
            Save Global System Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
