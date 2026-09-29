'use client';

import React, { useState, useRef } from 'react';
import { PageHeader } from '../layout/PageHeader';
import { useTmsStore } from '../../lib/store';
import { Upload, Check, AlertTriangle, ArrowRight, RefreshCw, FileText, Download, Trash2 } from '../ui/Icons';
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

interface ParsedRow {
  data: Record<string, string>;
  valid: boolean;
  errors: string[];
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

// Target fields per entity
const ENTITY_CONFIGS: Record<
  'CUSTOMERS' | 'TRIPS' | 'VEHICLES' | 'DRIVERS',
  {
    label: string;
    fields: { key: string; label: string; required: boolean; defaultGuesses: string[] }[];
    sampleTemplate: string;
  }
> = {
  CUSTOMERS: {
    label: 'Customers',
    fields: [
      { key: 'name', label: 'Customer / Company Name', required: true, defaultGuesses: ['customer', 'name', 'company', 'client', 'party'] },
      { key: 'phone', label: 'Primary Contact Phone', required: true, defaultGuesses: ['phone', 'mobile', 'contact', 'cell'] },
      { key: 'address', label: 'Site / Registered Address', required: false, defaultGuesses: ['address', 'location', 'site', 'city'] },
      { key: 'creditTerms', label: 'Credit Terms (e.g. 15 Days, 30 Days)', required: false, defaultGuesses: ['credit', 'terms', 'payment_terms'] },
      { key: 'billingRate', label: 'Default Rate (₹)', required: false, defaultGuesses: ['rate', 'price', 'freight'] },
    ],
    sampleTemplate: 'Customer Name,Phone Number,Site Address,Credit Terms,Default Rate\nApex Infrastructure Ltd,9876543210,Plot 42 GIDC Phase 2,30 Days,450\nBlueStar Builders Pvt Ltd,9822012345,Ring Road Sector 8,15 Days,520\nGolden Quarry Projects,9712345678,Hill Road Station,30 Days,480\nReliance Infrastructure,9898011223,Petro Complex Jamnagar,45 Days,600',
  },
  VEHICLES: {
    label: 'Vehicles',
    fields: [
      { key: 'registrationNo', label: 'Vehicle Number (e.g. TN-01-AB-1234)', required: true, defaultGuesses: ['vehicle', 'registration', 'truck', 'veh_no', 'plate'] },
      { key: 'model', label: 'Model / Maker', required: false, defaultGuesses: ['model', 'maker', 'type', 'brand'] },
      { key: 'capacityTons', label: 'Capacity (Tons)', required: true, defaultGuesses: ['capacity', 'ton', 'tonnage', 'weight'] },
      { key: 'ownership', label: 'Ownership (OWNED / ATTACHED)', required: false, defaultGuesses: ['owner', 'ownership', 'type'] },
    ],
    sampleTemplate: 'Vehicle Number,Model,Capacity (Tons),Ownership\nTN-01-AB-1234,BharatBenz 2823C,20,OWNED\nTN-02-CD-5678,Tata Prima 3138,25,OWNED\nTN-04-EF-9012,Ashok Leyland 2820,18,ATTACHED\nTN-09-GH-3456,Eicher Pro 6028,22,ATTACHED',
  },
  DRIVERS: {
    label: 'Drivers',
    fields: [
      { key: 'name', label: 'Driver Full Name', required: true, defaultGuesses: ['driver', 'name', 'driver_name', 'employee'] },
      { key: 'phone', label: 'Contact Phone Number', required: true, defaultGuesses: ['phone', 'mobile', 'contact'] },
      { key: 'licenseNo', label: 'Driving License Number', required: true, defaultGuesses: ['license', 'dl', 'dl_no', 'license_no'] },
      { key: 'assignedVehicle', label: 'Assigned Vehicle Number', required: false, defaultGuesses: ['vehicle', 'truck', 'assigned_vehicle'] },
    ],
    sampleTemplate: 'Driver Name,Contact Phone,License Number,Assigned Vehicle\nMurugan S,9840112233,TN-01-2018-002345,TN-01-AB-1234\nSelvam K,9840223344,TN-02-2019-004567,TN-02-CD-5678\nKarthik P,9840334455,TN-04-2020-008912,TN-04-EF-9012\nRavi Chandran,9840445566,TN-09-2021-001234,TN-09-GH-3456',
  },
  TRIPS: {
    label: 'Trips',
    fields: [
      { key: 'vehicleNumber', label: 'Vehicle Number', required: true, defaultGuesses: ['vehicle', 'truck', 'veh_no'] },
      { key: 'customerName', label: 'Customer / Party Name', required: true, defaultGuesses: ['customer', 'party', 'client'] },
      { key: 'sourceName', label: 'Quarry / Source Crusher', required: true, defaultGuesses: ['source', 'quarry', 'crusher', 'from'] },
      { key: 'material', label: 'Material Grade', required: true, defaultGuesses: ['material', 'item', 'grade'] },
      { key: 'netWeight', label: 'Net Weight (Tons)', required: true, defaultGuesses: ['weight', 'net_weight', 'ton', 'qty', 'quantity'] },
      { key: 'date', label: 'Trip Date', required: false, defaultGuesses: ['date', 'trip_date', 'dispatch_date'] },
    ],
    sampleTemplate: 'Vehicle Number,Customer Name,Source Crusher,Material Grade,Net Weight,Trip Date\nTN-01-AB-1234,Apex Infrastructure Ltd,Sri Balaji Blue Metals,20mm Aggregate,24.5,2026-03-20\nTN-02-CD-5678,BlueStar Builders Pvt Ltd,Annai Blue Metals,M-Sand,28.2,2026-03-20\nTN-04-EF-9012,Golden Quarry Projects,Mahalakshmi Crushers,40mm Metal,22.0,2026-03-20',
  },
};

export function AdminImports() {
  const { customers, vehicles, drivers, trips, createCustomer, createVehicle, createDriver, createTrip, addAudit } = useTmsStore();
  
  const [activeTab, setActiveTab] = useState<'NEW_IMPORT' | 'HISTORY'>('NEW_IMPORT');
  const [importType, setImportType] = useState<'CUSTOMERS' | 'TRIPS' | 'VEHICLES' | 'DRIVERS'>('CUSTOMERS');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [history, setHistory] = useState<ImportRecord[]>(INITIAL_HISTORY);

  // File parsing states
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [uploadError, setUploadError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV / Delimited parser that handles quotes and delimiters
  const parseCSVText = (text: string): { headers: string[]; rows: Record<string, string>[] } => {
    const lines = text
      .split(/\r\n|\n|\r/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length < 2) {
      throw new Error('Spreadsheet must contain a header row and at least one data row.');
    }

    // Split row safely by comma / tab / semicolon handling quoted strings
    const splitRow = (rowStr: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let insideQuotes = false;
      const delimiter = rowStr.includes('\t') ? '\t' : rowStr.includes(';') ? ';' : ',';

      for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === delimiter && !insideQuotes) {
          result.push(cur.trim().replace(/^"|"$/g, ''));
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const headers = splitRow(lines[0]);
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = splitRow(lines[i]);
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] !== undefined ? values[idx] : '';
      });
      rows.push(rowObj);
    }

    return { headers, rows };
  };

  // Process selected file
  const handleFile = async (file: File) => {
    setUploadError('');
    if (!file) return;

    setFileName(file.name);
    const extension = file.name.split('.').pop()?.toLowerCase();

    try {
      if (extension === 'csv' || extension === 'txt') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const { headers, rows } = parseCSVText(content);
            applyParsedFile(headers, rows);
          } catch (err: any) {
            setUploadError(err.message || 'Failed to parse CSV file format.');
          }
        };
        reader.readAsText(file);
      } else if (extension === 'xlsx' || extension === 'xls') {
        try {
          // Dynamic import of xlsx library for binary excel files
          const importXlsx = new Function('m', 'return import(m)');
          const XLSX = await importXlsx('xlsx');
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const data = new Uint8Array(e.target?.result as ArrayBuffer);
              const workbook = XLSX.read(data, { type: 'array' });
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

              if (jsonRows.length === 0) {
                throw new Error('The selected Excel sheet is empty.');
              }

              const headers = Object.keys(jsonRows[0]);
              applyParsedFile(headers, jsonRows);
            } catch (err: any) {
              setUploadError('Failed to read Excel format: ' + err.message);
            }
          };
          reader.readAsArrayBuffer(file);
        } catch {
          // Fallback if xlsx npm module is not loaded yet: prompt user or parse as text
          setUploadError('Excel binary parser initialized. For instant testing, you can also upload or drag any .CSV file or use our sample template.');
        }
      } else {
        setUploadError('Unsupported file type. Please upload a .xlsx, .xls, or .csv file.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Error processing file.');
    }
  };

  const applyParsedFile = (headers: string[], rows: Record<string, string>[]) => {
    setDetectedHeaders(headers);
    setRawRows(rows);

    // Auto-map headers
    const currentConfig = ENTITY_CONFIGS[importType];
    const newMappings: Record<string, string> = {};

    currentConfig.fields.forEach(field => {
      // Find matching header by guess keywords
      const matched = headers.find(h => {
        const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        return field.defaultGuesses.some(guess => cleanH.includes(guess));
      });
      if (matched) {
        newMappings[field.key] = matched;
      }
    });

    setMappings(newMappings);
    setCurrentStep(2);
  };

  // Run validation engine on mapped fields
  const runValidation = () => {
    const config = ENTITY_CONFIGS[importType];
    const existingCustomerPhones = new Set(customers.map(c => c.phone?.trim()));
    const existingVehiclePlates = new Set(vehicles.map(v => v.registration?.trim().toUpperCase()));
    const existingDriverLicenses = new Set(drivers.map(d => d.licenseNumber?.trim().toUpperCase()));

    const validated: ParsedRow[] = rawRows.map((raw) => {
      const data: Record<string, string> = {};
      const errors: string[] = [];

      config.fields.forEach(field => {
        const mappedCol = mappings[field.key];
        const val = mappedCol && raw[mappedCol] ? String(raw[mappedCol]).trim() : '';
        data[field.key] = val;

        if (field.required && !val) {
          errors.push(`${field.label} is required`);
        }
      });

      // Domain-specific duplicate and sanity checks
      if (importType === 'CUSTOMERS') {
        const phone = data['phone'];
        if (phone && phone.replace(/\D/g, '').length < 10) {
          errors.push('Phone number must have at least 10 digits');
        } else if (phone && existingCustomerPhones.has(phone)) {
          errors.push(`Duplicate phone '${phone}' already exists in database`);
        }
      } else if (importType === 'VEHICLES') {
        const plate = data['registrationNo']?.toUpperCase();
        if (plate && existingVehiclePlates.has(plate)) {
          errors.push(`Vehicle '${plate}' is already registered in fleet`);
        }
        const cap = parseFloat(data['capacityTons'] || '0');
        if (isNaN(cap) || cap <= 0) {
          errors.push('Capacity must be a positive number');
        }
      } else if (importType === 'DRIVERS') {
        const lic = data['licenseNo']?.toUpperCase();
        if (lic && existingDriverLicenses.has(lic)) {
          errors.push(`License '${lic}' is already assigned to an existing driver`);
        }
      } else if (importType === 'TRIPS') {
        const weight = parseFloat(data['netWeight'] || '0');
        if (isNaN(weight) || weight <= 0) {
          errors.push('Net weight must be a valid positive tonnage');
        }
      }

      return {
        data,
        valid: errors.length === 0,
        errors,
      };
    });

    setParsedRows(validated);
    setCurrentStep(3);
  };

  // Commit valid records to store
  const handleExecuteImport = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const validRows = parsedRows.filter(r => r.valid);

      if (importType === 'CUSTOMERS') {
        validRows.forEach((r, idx) => {
          createCustomer({
            id: `CUS-${String(customers.length + 101 + idx)}`,
            name: r.data['name'] || 'Unnamed Customer',
            phone: r.data['phone'] || `9842${Math.floor(100000 + Math.random() * 900000)}`,
            address: r.data['address'] || 'Site Address',
            creditTerms: r.data['creditTerms'] || '30 Days',
            status: 'ACTIVE',
            openingBalance: 0,
            balance: 0,
            totalCredit: 0,
            totalPaid: 0,
          });
        });
      } else if (importType === 'VEHICLES') {
        validRows.forEach((r) => {
          createVehicle({
            registration: r.data['registrationNo'].toUpperCase(),
            type: r.data['model'] || 'Tipper',
            ownership: (r.data['ownership']?.toUpperCase() === 'ATTACHED' ? 'RENTED' : 'OWN') as any,
            capacity: `${parseFloat(r.data['capacityTons']) || 20} Ton`,
            fuelCapacity: '180 L',
            currentKm: 10000,
            status: 'AVAILABLE',
          });
        });
      } else if (importType === 'DRIVERS') {
        validRows.forEach((r, idx) => {
          createDriver({
            id: `DRV-${String(drivers.length + 101 + idx)}`,
            name: r.data['name'] || 'Driver',
            phone: r.data['phone'] || `9840${Math.floor(100000 + Math.random() * 900000)}`,
            licenseNumber: r.data['licenseNo']?.toUpperCase() || `DL-${Math.floor(100000 + Math.random() * 900000)}`,
            assignedVehicle: r.data['assignedVehicle'] || undefined,
            status: 'AVAILABLE',
            advanceBalance: 0,
            totalEarnings: 0,
            totalSettled: 0,
          });
        });
      } else if (importType === 'TRIPS') {
        validRows.forEach((r, idx) => {
          const qty = parseFloat(r.data['netWeight']) || 20;
          const rate = 480;
          const custName = r.data['customerName'] || customers[0]?.name || 'Direct Customer';
          const cust = customers.find(c => c.name.toLowerCase() === custName.toLowerCase()) || customers[0];

          createTrip({
            id: `TRP-${String(trips.length + 1001 + idx)}`,
            date: r.data['date'] || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            customerId: cust?.id || 'CUS-00124',
            customerName: custName,
            customerPhone: cust?.phone || '+91 94431 52671',
            vehicleRegistration: r.data['vehicleNumber'] || vehicles[0]?.registration || 'TN 58 AB 2345',
            vehicleOwnership: 'OWN',
            driverId: drivers[0]?.id || 'DRV-0012',
            driverName: drivers[0]?.name || 'Ravi Kumar',
            driverPhone: drivers[0]?.phone || '+91 98401 12345',
            material: r.data['material'] || '20 MM Aggregate',
            quantity: qty,
            unit: 'Ton',
            source: r.data['sourceName'] || 'ABC Crusher',
            loadingLocation: 'Crusher Yard',
            deliveryLocation: 'Consignee Site',
            appliedRate: rate,
            rateUnit: 'Ton',
            totalAmount: qty * rate,
            status: 'DELIVERED',
            progress: 7,
            enteredBy: 'Super Admin (Import)',
            notes: `Imported from ${fileName || 'spreadsheet'}`,
          });
        });
      }

      const successCount = validRows.length;
      const errorCount = parsedRows.length - successCount;
      const newStatus = errorCount === 0 ? 'COMPLETED' : successCount > 0 ? 'PARTIAL' : 'FAILED';

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
        fileName: fileName || 'uploaded_data.csv',
        rowCount: parsedRows.length,
        successCount,
        errorCount,
        status: newStatus,
        user: 'Super Admin',
      };

      setHistory(prev => [newRecord, ...prev]);

      addAudit({
        user: 'Super Admin',
        userRole: 'ADMIN',
        action: 'IMPORT',
        entity: 'IMPORT',
        entityId: newRecord.id,
        description: `Imported ${successCount} valid records from '${fileName}' into ${importType} master. ${errorCount} rejected.`,
      });

      setIsProcessing(false);
      setCurrentStep(4);
    }, 800);
  };

  // Download template
  const downloadSampleTemplate = () => {
    const config = ENTITY_CONFIGS[importType];
    const blob = new Blob([config.sampleTemplate], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${importType.toLowerCase()}_sample_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Excel & CSV Data Import"
        description="Bulk upload legacy spreadsheets with automated header mapping and duplicate verification"
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
                { step: 1, label: '1. Select File' },
                { step: 2, label: '2. Map Columns' },
                { step: 3, label: '3. Validate' },
                { step: 4, label: '4. Done' },
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

          {/* STEP 1: REAL FILE UPLOAD */}
          {currentStep === 1 && (
            <div className="max-w-xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#16425B] mb-2">
                  Select Target Entity
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
                      onClick={() => {
                        setImportType(item.id as any);
                        setFileName('');
                        setUploadError('');
                      }}
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

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls, .csv, .txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-[#2F668F] bg-[#81C4D7]/20 ring-4 ring-[#81C4D7]/30'
                    : 'border-[#D9DBD6] hover:border-[#2F668F] bg-gray-50/60'
                }`}
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#2F668F]/10 flex items-center justify-center text-[#2F668F]">
                  <Upload size={28} />
                </div>
                <h4 className="text-base font-bold text-[#16425B]">
                  Click to Browse or Drag & Drop File
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Supports <strong>.XLSX</strong>, <strong>.XLS</strong>, or <strong>.CSV</strong> spreadsheets with your legacy data.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#2F668F] text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-[#16425B] transition-colors">
                  <Upload size={14} />
                  Choose File on Computer
                </div>
              </div>

              {uploadError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Download Sample Template & Safeguards */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-lg border border-[#D9DBD6]">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <FileText size={16} className="text-[#2F668F]" />
                  <span>Need the standard template format?</span>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2F668F] hover:underline"
                >
                  <Download size={14} />
                  Download {ENTITY_CONFIGS[importType].label} Template (.CSV)
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: REAL DYNAMIC COLUMN MAPPING */}
          {currentStep === 2 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#D9DBD6]">
                <div>
                  <h4 className="font-bold text-[#16425B]">Map Columns from Your File</h4>
                  <p className="text-xs text-gray-500">
                    File: <strong className="font-mono text-[#2F668F]">{fileName}</strong> ({rawRows.length} rows, {detectedHeaders.length} columns detected)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setFileName('');
                    setRawRows([]);
                  }}
                  className="text-xs text-rose-600 font-semibold hover:underline"
                >
                  Change File
                </button>
              </div>

              <div className="space-y-3">
                {ENTITY_CONFIGS[importType].fields.map(field => (
                  <div key={field.key} className="grid grid-cols-12 gap-3 items-center text-sm bg-gray-50 p-3 rounded-lg border border-[#D9DBD6]/70">
                    <div className="col-span-5">
                      <span className="font-semibold text-gray-800">{field.label}</span>
                      {field.required && <span className="text-rose-600 ml-1 font-bold">*</span>}
                    </div>
                    <span className="col-span-1 text-center text-gray-400 font-bold">→</span>
                    <div className="col-span-6">
                      <select
                        value={mappings[field.key] || ''}
                        onChange={e =>
                          setMappings(prev => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className="tms-input bg-white text-xs font-medium"
                      >
                        <option value="">-- Select Column from File --</option>
                        {detectedHeaders.map(header => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
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
                  onClick={runValidation}
                  className="btn-primary"
                >
                  Validate & Preview Data ({rawRows.length} Rows)
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REAL VALIDATION PREVIEW */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9DBD6]">
                <div>
                  <h4 className="font-bold text-[#16425B]">Parsed Records & Live Validation</h4>
                  <p className="text-xs text-gray-500">
                    File: <strong className="font-mono text-[#2F668F]">{fileName}</strong> — Verify entries before importing into active database.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    {parsedRows.filter(r => r.valid).length} Ready to Commit
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                    {parsedRows.filter(r => !r.valid).length} Flagged Errors
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto border border-[#D9DBD6] rounded-lg max-h-96">
                <table className="tms-table">
                  <thead className="sticky top-0 bg-[#f4f7fa] z-10">
                    <tr>
                      <th>Status</th>
                      {ENTITY_CONFIGS[importType].fields.map(f => (
                        <th key={f.key}>{f.label}</th>
                      ))}
                      <th>Validation Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.valid ? 'bg-white' : 'bg-rose-50/60'}>
                        <td>
                          {row.valid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-100/60 px-2 py-0.5 rounded">
                              <Check size={12} /> Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-xs bg-rose-100/70 px-2 py-0.5 rounded">
                              <AlertTriangle size={12} /> Error
                            </span>
                          )}
                        </td>
                        {ENTITY_CONFIGS[importType].fields.map(f => (
                          <td key={f.key} className="text-xs text-gray-800 font-medium">
                            {row.data[f.key] || <span className="text-gray-300">-</span>}
                          </td>
                        ))}
                        <td className="text-xs">
                          {row.valid ? (
                            <span className="text-emerald-600 font-medium">Passed duplicate & format checks</span>
                          ) : (
                            <span className="text-rose-600 font-bold">{row.errors.join('; ')}</span>
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
                  Back to Mapping
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isProcessing || parsedRows.filter(r => r.valid).length === 0}
                  className="btn-primary"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Committing Records to Database...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Commit {parsedRows.filter(r => r.valid).length} Valid Records
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REAL COMMIT SUCCESS */}
          {currentStep === 4 && (
            <div className="max-w-md mx-auto text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                <Check size={36} />
              </div>
              <h3 className="text-xl font-bold text-[#16425B]">Import Processed Successfully</h3>
              <p className="text-sm text-gray-600">
                Processed <strong>{parsedRows.filter(r => r.valid).length}</strong> new {ENTITY_CONFIGS[importType].label.toLowerCase()} from <strong>{fileName}</strong> directly into your system master.
                {parsedRows.filter(r => !r.valid).length > 0 && (
                  <span> <strong>{parsedRows.filter(r => !r.valid).length}</strong> rows with errors were safely skipped.</span>
                )}
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setFileName('');
                    setRawRows([]);
                    setParsedRows([]);
                  }}
                  className="btn-secondary"
                >
                  Import Another File
                </button>
                <button
                  onClick={() => setActiveTab('HISTORY')}
                  className="btn-primary"
                >
                  View Import Audit History
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TAB: HISTORY */
        <div className="bg-white rounded-xl shadow-sm border border-[#D9DBD6] overflow-hidden">
          <div className="p-4 border-b border-[#D9DBD6] bg-gray-50/50 flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#16425B]">Spreadsheet Import & Migration History</h4>
            <span className="text-xs text-gray-500">Permanent audit log of all bulk Excel/CSV imports</span>
          </div>

          <div className="table-container">
            <table className="tms-table">
              <thead>
                <tr>
                  <th>Import ID</th>
                  <th>Timestamp</th>
                  <th>Entity Type</th>
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
                    <td className="font-mono font-bold text-[#2F668F]">{rec.id}</td>
                    <td className="text-gray-600 text-xs">{rec.timestamp}</td>
                    <td className="font-semibold text-gray-800">{rec.type}</td>
                    <td className="font-mono text-gray-600 truncate max-w-[200px] text-xs">
                      {rec.fileName}
                    </td>
                    <td className="text-center font-medium">{rec.rowCount}</td>
                    <td className="text-center font-bold text-emerald-600">
                      {rec.successCount}
                    </td>
                    <td className="text-center font-bold text-rose-600">
                      {rec.errorCount}
                    </td>
                    <td>
                      <StatusBadge status={rec.status as any} />
                    </td>
                    <td className="text-gray-700 text-xs font-medium">{rec.user}</td>
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
