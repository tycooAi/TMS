'use client';

import React, { useState } from 'react';
import { PageHeader } from '../layout/PageHeader';
import { useTmsStore } from '../../lib/store';
import { Upload, Check, AlertTriangle, ArrowRight, RefreshCw } from '../ui/Icons';
import { StatusBadge } from '../ui/StatusBadge';

interface ImportRecord {
  id: string;
  timestamp: string;
  type: 'CUSTOMERS' | 'TRIPS' | 'VEHICLES' | 'DRIVERS';
  fileName: string;
  rowCount: number;
  successCount: number;
  errorCount: number;
  status: 'COMPLETED' | 'FAILED' | 'PARTIAL';
  user: string;
}

const INITIAL_HISTORY: ImportRecord[] = [
  {
    id: 'IMP-001',
    timestamp: '2026-03-10 14:32',
    type: 'CUSTOMERS',
    fileName: 'Legacy_Customer_Master_2025.xlsx',
    rowCount: 45,
    successCount: 45,
    errorCount: 0,
    status: 'COMPLETED',
    user: 'Super Admin',
  },
  {
    id: 'IMP-002',
    timestamp: '2026-03-12 09:15',
    type: 'TRIPS',
    fileName: 'Feb_Trip_Logs_Final.xlsx',
    rowCount: 182,
    successCount: 178,
    errorCount: 4,
    status: 'PARTIAL',
    user: 'Super Admin',
  },
  {
    id: 'IMP-003',
    timestamp: '2026-03-14 16:40',
    type: 'VEHICLES',
    fileName: 'Fleet_Registration_List.xlsx',
    rowCount: 20,
    successCount: 20,
    errorCount: 0,
    status: 'COMPLETED',
    user: 'Operations Manager',
  },
];

export function AdminImports() {
  const { customers, vehicles, drivers, createCustomer, addAudit } = useTmsStore();
  
  const [activeTab, setActiveTab] = useState<'NEW_IMPORT' | 'HISTORY'>('NEW_IMPORT');
  const [importType, setImportType] = useState<'CUSTOMERS' | 'TRIPS' | 'VEHICLES' | 'DRIVERS'>('CUSTOMERS');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [history, setHistory] = useState<ImportRecord[]>(INITIAL_HISTORY);

  // Field mappings simulation
  const [mappings, setMappings] = useState<Record<string, string>>({
    name: 'Customer_Name',
    phone: 'Phone_Number',
    billingType: 'Billing_Model',
    creditLimit: 'Credit_Limit',
    address: 'Site_Address',
    city: 'City_Locality',
  });

  // Sample parsed preview rows (Customer example)
  const sampleParsedRows = [
    { name: 'Apex Infrastructure Ltd', phone: '9876543210', billingType: 'PER_TON', creditLimit: 250000, address: 'Plot 42, GIDC Phase 2', city: 'Surat', valid: true, error: null },
    { name: 'BlueStar Builders Pvt Ltd', phone: '9822012345', billingType: 'FIXED_PER_TRIP', creditLimit: 150000, address: 'Ring Road, Sector 8', city: 'Ahmedabad', valid: true, error: null },
    { name: 'Maruti Logistics & Sands', phone: '9876543210', billingType: 'PER_TON', creditLimit: 100000, address: 'Express Highway Junction', city: 'Vadodara', valid: false, error: 'Duplicate phone already exists in DB' },
    { name: 'Golden Quarry Projects', phone: '9712345678', billingType: 'PER_TON', creditLimit: 500000, address: 'Hill Road Station', city: 'Navsari', valid: true, error: null },
    { name: 'Shree Ram Materials', phone: '', billingType: 'PER_TON', creditLimit: 50000, address: 'Market Yard', city: 'Bharuch', valid: false, error: 'Phone number is mandatory' },
  ];

  const handleSimulateUpload = () => {
    setFileName(`${importType.toLowerCase()}_master_import_2026.xlsx`);
    setCurrentStep(2);
  };

  const handleExecuteImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep(4); // Success screen

      // Add to store if customers
      if (importType === 'CUSTOMERS') {
        const validRows = sampleParsedRows.filter(r => r.valid);
        validRows.forEach((r, idx) => {
          try {
            createCustomer({
              id: `CUS-${String(customers.length + 100 + idx)}`,
              name: r.name,
              phone: r.phone,
              address: r.address,
              creditTerms: '30 Days',
              status: 'ACTIVE',
              openingBalance: 0,
              balance: 0,
              totalCredit: 0,
              totalPaid: 0,
            });
          } catch {
            // Ignore duplicates in simulation
          }
        });
      }

      const newRecord: ImportRecord = {
        id: `IMP-${String(history.length + 1).padStart(3, '0')}`,
        timestamp: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        type: importType,
        fileName: fileName || 'batch_import.xlsx',
        rowCount: sampleParsedRows.length,
        successCount: sampleParsedRows.filter(r => r.valid).length,
        errorCount: sampleParsedRows.filter(r => !r.valid).length,
        status: 'PARTIAL',
        user: 'Super Admin',
      };

      setHistory(prev => [newRecord, ...prev]);
      addAudit({
        user: 'Super Admin',
        userRole: 'ADMIN',
        action: 'IMPORT',
        entity: 'IMPORT',
        entityId: newRecord.id,
        description: `Imported ${newRecord.successCount} records into ${importType} master. ${newRecord.errorCount} rejected.`,
      });
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Excel Data Import & Migration"
        description="Bulk import legacy spreadsheets with automated duplicate detection and schema validation"
      />

      {/* Tabs */}
      <div className="flex border-b border-[#D9DBD6]">
        <button
          onClick={() => setActiveTab('NEW_IMPORT')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'NEW_IMPORT'
              ? 'border-[#2F668F] text-[#2F668F]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          New Spreadsheet Import
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'HISTORY'
              ? 'border-[#2F668F] text-[#2F668F]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Import Audit History ({history.length})
        </button>
      </div>

      {activeTab === 'NEW_IMPORT' ? (
        <div className="bg-white rounded-xl shadow-sm border border-[#D9DBD6] p-6">
          {/* Progress Indicator */}
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 w-full z-0" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#2F668F] transition-all duration-300 z-0"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />

              {[
                { step: 1, label: 'Select & Upload' },
                { step: 2, label: 'Map Columns' },
                { step: 3, label: 'Validate Preview' },
                { step: 4, label: 'Finished' },
              ].map(s => (
                <div key={s.step} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors shadow-sm ${
                      currentStep > s.step
                        ? 'bg-emerald-600 text-white'
                        : currentStep === s.step
                        ? 'bg-[#2F668F] text-white ring-4 ring-[#81C4D7]/30'
                        : 'bg-gray-100 text-gray-500 border border-gray-300'
                    }`}
                  >
                    {currentStep > s.step ? '✓' : s.step}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      currentStep >= s.step ? 'text-[#16425B] font-semibold' : 'text-gray-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 1: UPLOAD */}
          {currentStep === 1 && (
            <div className="max-w-xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#16425B] mb-2">
                  Target Entity Master
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'CUSTOMERS', label: 'Customers' },
                    { id: 'TRIPS', label: 'Trips' },
                    { id: 'VEHICLES', label: 'Vehicles' },
                    { id: 'DRIVERS', label: 'Drivers' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setImportType(item.id as any)}
                      className={`p-3 rounded-lg border text-sm font-semibold text-center transition-all ${
                        importType === item.id
                          ? 'border-[#2F668F] bg-[#2F668F]/5 text-[#2F668F] shadow-sm'
                          : 'border-[#D9DBD6] text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-2 border-dashed border-[#D9DBD6] hover:border-[#2F668F] rounded-xl p-8 text-center transition-colors bg-gray-50/50">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#2F668F]/10 flex items-center justify-center text-[#2F668F]">
                  <Upload size={28} />
                </div>
                <h4 className="text-base font-semibold text-[#16425B]">
                  Upload .XLSX or .CSV File
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Drag and drop your spreadsheet here or click to simulate file selection. Supports standard TMS template structures.
                </p>
                <button
                  type="button"
                  onClick={handleSimulateUpload}
                  className="btn-primary mt-5"
                >
                  <Upload size={16} />
                  Select File ({importType.toLowerCase()}_sample.xlsx)
                </button>
              </div>

              <div className="p-4 bg-[#81C4D7]/15 rounded-lg border border-[#81C4D7]/30 text-xs text-[#16425B] space-y-1">
                <span className="font-bold block">Enterprise Migration Safeguard:</span>
                <p>
                  • Phone numbers and vehicle registration numbers undergo duplicate cross-checks.
                </p>
                <p>• Rows with validation errors are flagged and quarantined before commit.</p>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {currentStep === 2 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#D9DBD6]">
                <div>
                  <h4 className="font-semibold text-[#16425B]">Map Spreadsheet Headers</h4>
                  <p className="text-xs text-gray-500">File: {fileName} (5 detected columns)</p>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium border border-emerald-200">
                  Auto-mapped 85%
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { field: 'name', label: 'Entity Name / Title *', defaultCol: 'Customer_Name' },
                  { field: 'phone', label: 'Primary Contact Phone *', defaultCol: 'Phone_Number' },
                  { field: 'billingType', label: 'Billing Rate Basis', defaultCol: 'Billing_Model' },
                  { field: 'creditLimit', label: 'Credit Limit (₹)', defaultCol: 'Credit_Limit' },
                  { field: 'address', label: 'Site / Registered Address', defaultCol: 'Site_Address' },
                ].map(item => (
                  <div key={item.field} className="grid grid-cols-12 gap-3 items-center text-sm">
                    <span className="col-span-5 font-medium text-gray-700">{item.label}</span>
                    <span className="col-span-1 text-center text-gray-400">→</span>
                    <div className="col-span-6">
                      <select
                        value={mappings[item.field] || item.defaultCol}
                        onChange={e =>
                          setMappings(prev => ({ ...prev, [item.field]: e.target.value }))
                        }
                        className="tms-input bg-white"
                      >
                        <option value={item.defaultCol}>{item.defaultCol} (Exact Match)</option>
                        <option value="Col_A">Column A</option>
                        <option value="Col_B">Column B</option>
                        <option value="Col_C">Column C</option>
                        <option value="IGNORE">-- Ignore / Do Not Map --</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#D9DBD6]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="btn-secondary"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="btn-primary"
                >
                  Preview Data & Validate
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: VALIDATION PREVIEW */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9DBD6]">
                <div>
                  <h4 className="font-semibold text-[#16425B]">Parsed Data & Validation Status</h4>
                  <p className="text-xs text-gray-500">
                    Review valid entries before executing database commit.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    {sampleParsedRows.filter(r => r.valid).length} Valid
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                    {sampleParsedRows.filter(r => !r.valid).length} Rejections
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto border border-[#D9DBD6] rounded-lg">
                <table className="tms-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Billing Type</th>
                      <th className="text-right">Credit Limit</th>
                      <th>Address</th>
                      <th>Validation Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleParsedRows.map((row, idx) => (
                      <tr key={idx} className={row.valid ? 'bg-white' : 'bg-rose-50/50'}>
                        <td>
                          {row.valid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs">
                              <Check size={14} /> Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-medium text-xs">
                              <AlertTriangle size={14} /> Error
                            </span>
                          )}
                        </td>
                        <td className="font-medium text-gray-800">{row.name}</td>
                        <td className="font-mono">{row.phone || '-'}</td>
                        <td>{row.billingType}</td>
                        <td className="text-right font-medium">
                          ₹{row.creditLimit.toLocaleString('en-IN')}
                        </td>
                        <td className="text-gray-500 truncate max-w-[150px]">
                          {row.address}
                        </td>
                        <td className="text-xs">
                          {row.valid ? (
                            <span className="text-gray-400">Passed checks</span>
                          ) : (
                            <span className="text-rose-600 font-semibold">{row.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#D9DBD6]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn-secondary"
                  disabled={isProcessing}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isProcessing}
                  className="btn-primary"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Importing Records...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Commit Valid Records ({sampleParsedRows.filter(r => r.valid).length})
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {currentStep === 4 && (
            <div className="max-w-md mx-auto text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Check size={36} />
              </div>
              <h3 className="text-lg font-bold text-[#16425B]">Spreadsheet Import Completed</h3>
              <p className="text-sm text-gray-600">
                Successfully processed <strong>{sampleParsedRows.filter(r => r.valid).length}</strong> records into the system database. <strong>{sampleParsedRows.filter(r => !r.valid).length}</strong> duplicate/invalid rows were skipped and logged.
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setFileName('');
                  }}
                  className="btn-secondary"
                >
                  Import Another File
                </button>
                <button
                  onClick={() => setActiveTab('HISTORY')}
                  className="btn-primary"
                >
                  View Import Audit Log
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TAB: HISTORY */
        <div className="bg-white rounded-xl shadow-sm border border-[#D9DBD6] overflow-hidden">
          <div className="p-4 border-b border-[#D9DBD6] bg-gray-50/50 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[#16425B]">Historical Imports & Migrations</h4>
            <span className="text-xs text-gray-500">Immutable ledger of all bulk uploads</span>
          </div>

          <div className="table-container">
            <table className="tms-table">
              <thead>
                <tr>
                  <th>Import ID</th>
                  <th>Timestamp</th>
                  <th>Entity</th>
                  <th>File Name</th>
                  <th className="text-center">Total Rows</th>
                  <th className="text-center">Success</th>
                  <th className="text-center">Errors</th>
                  <th>Status</th>
                  <th>Uploaded By</th>
                </tr>
              </thead>
              <tbody>
                {history.map(rec => (
                  <tr key={rec.id}>
                    <td className="font-mono font-semibold text-[#2F668F]">{rec.id}</td>
                    <td className="text-gray-600">{rec.timestamp}</td>
                    <td className="font-semibold text-gray-800">{rec.type}</td>
                    <td className="font-mono text-gray-600 truncate max-w-[200px]">
                      {rec.fileName}
                    </td>
                    <td className="text-center font-medium">{rec.rowCount}</td>
                    <td className="text-center font-medium text-emerald-600">
                      {rec.successCount}
                    </td>
                    <td className="text-center font-medium text-rose-600">
                      {rec.errorCount}
                    </td>
                    <td>
                      <StatusBadge status={rec.status as any} />
                    </td>
                    <td className="text-gray-700">{rec.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
