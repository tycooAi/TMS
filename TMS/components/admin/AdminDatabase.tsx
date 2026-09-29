'use client';

import React, { useState, useMemo } from 'react';
import { useTmsStore } from '../../lib/store';
import { DEMO_USERS } from '../../lib/auth';
import { PageHeader } from '../layout/PageHeader';
import { Database, Search, Filter, Eye, ChevronRight, CheckCircle2, AlertTriangle, Layers, Server } from '../ui/Icons';
import { formatCurrency } from '../../lib/calculations';

interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  references?: string;
  description: string;
}

interface EntitySchema {
  id: string;
  displayName: string;
  javaEntity: string;
  table: string;
  primaryKeyPrefix: string;
  description: string;
  fields: SchemaField[];
}

const SCHEMAS: Record<string, EntitySchema> = {
  trips: {
    id: 'trips',
    displayName: 'Trips (Dispatches)',
    javaEntity: 'com.transport.tms.trip.entity.Trip',
    table: 'trips',
    primaryKeyPrefix: 'TRP-',
    description: 'Central operational dispatch entity recording load, haulage route, and commercial billing.',
    fields: [
      { name: 'id', type: 'String (VARCHAR 32)', required: true, isPrimaryKey: true, description: 'Unique trip identifier (e.g. TRP-1001)' },
      { name: 'date', type: 'String / LocalDate', required: true, description: 'Dispatch date (DD MMM YYYY)' },
      { name: 'vehicleRegistration', type: 'String (VARCHAR 20)', required: true, isForeignKey: true, references: 'vehicles.registration', description: 'Assigned heavy transport vehicle' },
      { name: 'driverId', type: 'String (VARCHAR 32)', required: true, isForeignKey: true, references: 'drivers.id', description: 'Assigned driver identifier' },
      { name: 'driverName', type: 'String (VARCHAR 100)', required: true, description: 'Full name of driver on duty' },
      { name: 'customerId', type: 'String (VARCHAR 32)', required: true, isForeignKey: true, references: 'customers.id', description: 'Billed client/consignee' },
      { name: 'customerName', type: 'String (VARCHAR 150)', required: true, description: 'Client company or trade name' },
      { name: 'material', type: 'String (VARCHAR 100)', required: true, isForeignKey: true, references: 'materials.name', description: 'Aggregate / mineral material name' },
      { name: 'quantity', type: 'Double / Decimal', required: true, description: 'Loaded weight or volume' },
      { name: 'unit', type: "Enum ('Ton' | 'CFT' | 'Load')", required: true, description: 'Unit of cargo measurement' },
      { name: 'source', type: 'String (VARCHAR 150)', required: true, isForeignKey: true, references: 'sources.name', description: 'Origin quarry or crushing site' },
      { name: 'loadingLocation', type: 'String (VARCHAR 150)', required: true, description: 'Origin geographic hub' },
      { name: 'deliveryLocation', type: 'String (VARCHAR 150)', required: true, description: 'Destination unloading location' },
      { name: 'appliedRate', type: 'Double / Decimal', required: true, description: 'Frozen commercial freight billing rate' },
      { name: 'transportRate', type: 'Double / Decimal', required: false, description: 'Frozen vehicle haulage compensation rate' },
      { name: 'purchaseRate', type: 'Double / Decimal', required: false, description: 'Frozen quarry material purchase cost' },
      { name: 'perKmRate', type: 'Double / Decimal', required: false, description: 'Frozen per-kilometer commercial rate' },
      { name: 'status', type: 'Enum (TripStatus)', required: true, description: 'Lifecycle state (SUBMITTED, LOADED, RUNNING, DELIVERED, COMPLETED)' },
      { name: 'customerTransactionType', type: "Enum ('Cash' | 'Credit')", required: false, description: 'Direct cash dispatch vs credit ledger billing' },
      { name: 'invoiceId', type: 'String (VARCHAR 32)', required: false, isForeignKey: true, references: 'invoices.id', description: 'Associated consolidated GST invoice' },
    ],
  },
  customers: {
    id: 'customers',
    displayName: 'Customers (Clients)',
    javaEntity: 'com.transport.tms.master.entity.Customer',
    table: 'customers',
    primaryKeyPrefix: 'CUS-',
    description: 'Commercial client ledger storing billing addresses, credit limits, and receivable balances.',
    fields: [
      { name: 'id', type: 'String (VARCHAR 32)', required: true, isPrimaryKey: true, description: 'Unique customer identifier (e.g. CUS-00124)' },
      { name: 'name', type: 'String (VARCHAR 150)', required: true, description: 'Registered business name' },
      { name: 'phone', type: 'String (VARCHAR 20)', required: true, description: 'Primary contact phone' },
      { name: 'alternatePhone', type: 'String (VARCHAR 20)', required: false, description: 'Secondary contact number' },
      { name: 'address', type: 'String (TEXT)', required: true, description: 'Registered delivery/billing address' },
      { name: 'gstin', type: 'String (VARCHAR 15)', required: false, description: '15-character GSTIN tax registration' },
      { name: 'creditTerms', type: 'String (VARCHAR 50)', required: false, description: 'Credit duration policy (e.g. 30 Days)' },
      { name: 'status', type: "Enum ('ACTIVE' | 'INACTIVE')", required: true, description: 'Account operational status' },
      { name: 'totalCredit', type: 'Double / Decimal', required: true, description: 'Cumulative gross billing value' },
      { name: 'totalPaid', type: 'Double / Decimal', required: true, description: 'Cumulative liquid collections received' },
      { name: 'balance', type: 'Double / Decimal', required: true, description: 'Net outstanding receivables (totalCredit - totalPaid)' },
    ],
  },
  vehicles: {
    id: 'vehicles',
    displayName: 'Vehicles (Fleet Assets)',
    javaEntity: 'com.transport.tms.master.entity.Vehicle',
    table: 'vehicles',
    primaryKeyPrefix: 'VEH-',
    description: 'Heavy transport tipper trucks, ownership types, capacity, and driver associations.',
    fields: [
      { name: 'registration', type: 'String (VARCHAR 20)', required: true, isPrimaryKey: true, description: 'State RTO vehicle plate (e.g. TN 58 AB 2345)' },
      { name: 'type', type: 'String (VARCHAR 50)', required: true, description: 'Truck body configuration (e.g. 10 Wheeler Tipper)' },
      { name: 'ownership', type: "Enum ('OWN' | 'MARKET')", required: true, description: 'Fleet asset vs third-party outsourced truck' },
      { name: 'capacityTons', type: 'Double / Decimal', required: true, description: 'Permissible gross freight capacity' },
      { name: 'status', type: "Enum ('AVAILABLE' | 'RUNNING' | 'MAINTENANCE')", required: true, description: 'Operational readiness state' },
      { name: 'assignedDriverId', type: 'String (VARCHAR 32)', required: false, isForeignKey: true, references: 'drivers.id', description: 'Dedicated driver assignment' },
      { name: 'assignedDriverName', type: 'String (VARCHAR 100)', required: false, description: 'Name of dedicated driver' },
      { name: 'fastagBalance', type: 'Double / Decimal', required: false, description: 'Prepaid toll wallet balance' },
    ],
  },
  drivers: {
    id: 'drivers',
    displayName: 'Drivers',
    javaEntity: 'com.transport.tms.master.entity.Driver',
    table: 'drivers',
    primaryKeyPrefix: 'DRV-',
    description: 'Licensed heavy vehicle operators authorized for dispatch trips.',
    fields: [
      { name: 'id', type: 'String (VARCHAR 32)', required: true, isPrimaryKey: true, description: 'Driver master ID (e.g. DRV-001)' },
      { name: 'name', type: 'String (VARCHAR 100)', required: true, description: 'Full legal name' },
      { name: 'phone', type: 'String (VARCHAR 20)', required: true, description: 'Mobile contact' },
      { name: 'licenseNumber', type: 'String (VARCHAR 30)', required: true, description: 'Commercial HMV driving license' },
      { name: 'licenseExpiry', type: 'String / LocalDate', required: true, description: 'RTO license validity date' },
      { name: 'status', type: "Enum ('ACTIVE' | 'ON_LEAVE' | 'SUSPENDED')", required: true, description: 'Duty availability' },
      { name: 'assignedVehicle', type: 'String (VARCHAR 20)', required: false, isForeignKey: true, references: 'vehicles.registration', description: 'Assigned truck' },
      { name: 'salary', type: 'Double / Decimal', required: true, description: 'Monthly base pay' },
      { name: 'perTripRate', type: 'Double / Decimal', required: true, description: 'Trip incentive allowance' },
    ],
  },
  invoices: {
    id: 'invoices',
    displayName: 'Invoices',
    javaEntity: 'com.transport.tms.finance.entity.Invoice',
    table: 'invoices',
    primaryKeyPrefix: 'INV-',
    description: 'Consolidated commercial tax invoices containing multiple trips with GST.',
    fields: [
      { name: 'id', type: 'String (VARCHAR 32)', required: true, isPrimaryKey: true, description: 'Invoice ID (e.g. INV-0001)' },
      { name: 'invoiceNumber', type: 'String (VARCHAR 50)', required: true, description: 'Statutory GST tax invoice number' },
      { name: 'date', type: 'String / LocalDate', required: true, description: 'Invoice issue date' },
      { name: 'customerId', type: 'String (VARCHAR 32)', required: true, isForeignKey: true, references: 'customers.id', description: 'Billed customer' },
      { name: 'customerName', type: 'String (VARCHAR 150)', required: true, description: 'Customer business name' },
      { name: 'subtotal', type: 'Double / Decimal', required: true, description: 'Sum of taxable trip freights' },
      { name: 'gstRate', type: 'Double (Percent)', required: true, description: 'Applicable GST percentage (e.g. 5% or 12%)' },
      { name: 'gstAmount', type: 'Double / Decimal', required: true, description: 'Calculated CGST+SGST/IGST liability' },
      { name: 'totalAmount', type: 'Double / Decimal', required: true, description: 'Gross invoice value payable' },
      { name: 'receivedAmount', type: 'Double / Decimal', required: true, description: 'Allocated payment receipts' },
      { name: 'outstandingAmount', type: 'Double / Decimal', required: true, description: 'Net unpaid balance' },
      { name: 'status', type: "Enum ('DRAFT' | 'POSTED' | 'PAID' | 'PARTIAL')", required: true, description: 'Accounting collection status' },
    ],
  },
  transactions: {
    id: 'transactions',
    displayName: 'Financial Transactions (Central Ledger)',
    javaEntity: 'com.transport.tms.finance.entity.FinancialTransaction',
    table: 'transactions',
    primaryKeyPrefix: 'TXN-',
    description: 'Immutable financial postings for cash, bank, receivables, and operational payouts.',
    fields: [
      { name: 'id', type: 'String (VARCHAR 32)', required: true, isPrimaryKey: true, description: 'Journal transaction reference' },
      { name: 'date', type: 'String / LocalDate', required: true, description: 'Posting date' },
      { name: 'type', type: 'Enum (TransactionType)', required: true, description: 'Entry type (CUSTOMER_PAYMENT, DIESEL_EXPENSE, WAGE_PAYMENT, MAINTENANCE)' },
      { name: 'category', type: 'String (VARCHAR 50)', required: true, description: 'Ledger account grouping' },
      { name: 'amount', type: 'Double / Decimal', required: true, description: 'Monetary figure in INR' },
      { name: 'paymentMode', type: "Enum ('CASH' | 'BANK' | 'ONLINE')", required: true, description: 'Settlement channel' },
      { name: 'reference', type: 'String (VARCHAR 100)', required: false, description: 'Bank UTR / cheque / slip number' },
      { name: 'description', type: 'String (TEXT)', required: true, description: 'Audit rationale and itemized narrative' },
    ],
  },
  diesel: {
    id: 'diesel',
    displayName: 'Diesel Records',
    javaEntity: 'com.transport.tms.finance.entity.DieselRecord',
    table: 'diesel_records',
    primaryKeyPrefix: 'DSL-',
    description: 'Fuel bunks dispenses, odometer readings, and fleet consumption rates.',
    fields: [
      { name: 'id', type: 'String (VARCHAR 32)', required: true, isPrimaryKey: true, description: 'Diesel transaction ID' },
      { name: 'date', type: 'String / LocalDate', required: true, description: 'Bunk dispensing date' },
      { name: 'vehicleRegistration', type: 'String (VARCHAR 20)', required: true, isForeignKey: true, references: 'vehicles.registration', description: 'Fueled vehicle' },
      { name: 'litres', type: 'Double / Decimal', required: true, description: 'Fuel quantity in litres' },
      { name: 'ratePerLitre', type: 'Double / Decimal', required: true, description: 'Unit cost per litre' },
      { name: 'totalAmount', type: 'Double / Decimal', required: true, description: 'Total bunk expenditure' },
      { name: 'odometerKm', type: 'Double / Integer', required: true, description: 'Meter reading at fueling' },
      { name: 'fuelStation', type: 'String (VARCHAR 150)', required: true, description: 'Vendor pump location' },
    ],
  },
  rates: {
    id: 'rates',
    displayName: 'Configured Commercial Rates',
    javaEntity: 'com.transport.tms.master.entity.ConfiguredRate',
    table: 'configured_rates',
    primaryKeyPrefix: 'RAT-',
    description: 'Historical and active route, quarry, and per-km pricing matrix governed by Manager.',
    fields: [
      { name: 'id', type: 'String (VARCHAR 32)', required: true, isPrimaryKey: true, description: 'Rate rule identifier' },
      { name: 'rateType', type: "Enum ('CUSTOMER_BILLING' | 'TRANSPORT_FREIGHT' | 'CRUSHER_PURCHASE' | 'PER_KM')", required: true, description: 'Pricing classification' },
      { name: 'material', type: 'String (VARCHAR 100)', required: true, description: 'Applicable material' },
      { name: 'loadingLocation', type: 'String (VARCHAR 150)', required: false, description: 'Source origin' },
      { name: 'deliveryLocation', type: 'String (VARCHAR 150)', required: false, description: 'Destination point' },
      { name: 'rate', type: 'Double / Decimal', required: true, description: 'Agreed unit price' },
      { name: 'unit', type: "Enum ('Ton' | 'CFT' | 'Load' | 'KM')", required: true, description: 'Applicable rate denominator' },
      { name: 'effectiveFrom', type: 'String / LocalDate', required: true, description: 'Activation date' },
      { name: 'active', type: 'Boolean', required: true, description: 'Whether rule is currently live for new trips' },
    ],
  },
  audit: {
    id: 'audit',
    displayName: 'Audit Logs',
    javaEntity: 'com.transport.tms.governance.entity.AuditLog',
    table: 'audit_logs',
    primaryKeyPrefix: 'AUD-',
    description: 'Immutable system audit journal recording actors, entities, and before/after payloads.',
    fields: [
      { name: 'id', type: 'String (VARCHAR 32)', required: true, isPrimaryKey: true, description: 'Audit record reference' },
      { name: 'timestamp', type: 'String / LocalDateTime', required: true, description: 'ISO 8601 server timestamp' },
      { name: 'user', type: 'String (VARCHAR 100)', required: true, description: 'Operator name or username' },
      { name: 'userRole', type: 'Enum (UserRole)', required: true, description: 'Portal role of actor' },
      { name: 'action', type: "Enum ('CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'PAYMENT')", required: true, description: 'Operation performed' },
      { name: 'entity', type: 'String (VARCHAR 50)', required: true, description: 'Target entity classification' },
      { name: 'entityId', type: 'String (VARCHAR 50)', required: true, description: 'Primary key of modified record' },
      { name: 'description', type: 'String (TEXT)', required: true, description: 'Human-readable action description' },
      { name: 'oldValue', type: 'String (TEXT / JSON)', required: false, description: 'Pre-modification state' },
      { name: 'newValue', type: 'String (TEXT / JSON)', required: false, description: 'Post-modification state' },
    ],
  },
  workers: {
    id: 'workers',
    displayName: 'Workers & Ground Staff',
    javaEntity: 'com.transport.tms.master.entity.Worker',
    table: 'workers',
    primaryKeyPrefix: 'WRK-',
    description: 'Data entry operators, field supervisors, loaders, and operational ground staff.',
    fields: [
      { name: 'id', type: 'String (VARCHAR 32)', required: true, isPrimaryKey: true, description: 'Worker identification code' },
      { name: 'name', type: 'String (VARCHAR 100)', required: true, description: 'Full legal name' },
      { name: 'phone', type: 'String (VARCHAR 20)', required: true, description: 'Mobile contact' },
      { name: 'role', type: 'String (VARCHAR 50)', required: true, description: 'Operational post (Operator, Loader, Supervisor)' },
      { name: 'status', type: "Enum ('ACTIVE' | 'INACTIVE')", required: true, description: 'Employment active status' },
      { name: 'dailyWage', type: 'Double / Decimal', required: false, description: 'Base shift wage' },
    ],
  },
  users: {
    id: 'users',
    displayName: 'System Users (Auth)',
    javaEntity: 'com.transport.tms.user.entity.User',
    table: 'users',
    primaryKeyPrefix: 'USR-',
    description: 'System credentials, RBAC portal roles, and session access authentication.',
    fields: [
      { name: 'id', type: 'String (VARCHAR 32)', required: true, isPrimaryKey: true, description: 'System user identifier' },
      { name: 'username', type: 'String (VARCHAR 64)', required: true, description: 'Login username' },
      { name: 'name', type: 'String (VARCHAR 100)', required: true, description: 'User full display name' },
      { name: 'email', type: 'String (VARCHAR 128)', required: true, description: 'Corporate email' },
      { name: 'role', type: "Enum ('ADMIN' | 'MD' | 'MANAGER' | 'ACCOUNTS' | 'WORKER')", required: true, description: 'RBAC authorization level' },
      { name: 'employeeId', type: 'String (VARCHAR 32)', required: false, description: 'Employee master reference' },
      { name: 'designation', type: 'String (VARCHAR 100)', required: false, description: 'Company position title' },
    ],
  },
  payments: {
    id: 'payments',
    displayName: 'Customer Payments',
    javaEntity: 'com.transport.tms.finance.entity.Payment',
    table: 'payments',
    primaryKeyPrefix: 'PAY-',
    description: 'Inward client remittances, cash collections, and bank NEFT/RTGS payment vouchers.',
    fields: [
      { name: 'id', type: 'String (VARCHAR 32)', required: true, isPrimaryKey: true, description: 'Payment voucher reference' },
      { name: 'date', type: 'String / LocalDate', required: true, description: 'Receipt date' },
      { name: 'customerId', type: 'String (VARCHAR 32)', required: true, isForeignKey: true, references: 'customers.id', description: 'Remitting customer' },
      { name: 'customerName', type: 'String (VARCHAR 150)', required: true, description: 'Customer business name' },
      { name: 'amount', type: 'Double / Decimal', required: true, description: 'Remitted sum in INR' },
      { name: 'mode', type: "Enum ('BANK' | 'CASH' | 'CHEQUE' | 'ONLINE')", required: true, description: 'Payment channel' },
      { name: 'reference', type: 'String (VARCHAR 100)', required: false, description: 'Bank UTR or cheque number' },
      { name: 'status', type: "Enum ('POSTED' | 'REVERSED')", required: true, description: 'Ledger finality state' },
    ],
  },
  materials: {
    id: 'materials',
    displayName: 'Materials Master',
    javaEntity: 'com.transport.tms.master.entity.Material',
    table: 'materials',
    primaryKeyPrefix: 'MAT-',
    description: 'Commercial aggregates, sand varieties, and mineral commodities transported.',
    fields: [
      { name: 'id', type: 'String (VARCHAR 32)', required: true, isPrimaryKey: true, description: 'Material code' },
      { name: 'name', type: 'String (VARCHAR 100)', required: true, description: 'Commodity trade name (e.g. M-Sand, Blue Metal)' },
      { name: 'category', type: 'String (VARCHAR 50)', required: true, description: 'Aggregate / Sand / Gravel classification' },
      { name: 'unit', type: "Enum ('Ton' | 'CFT' | 'Load')", required: true, description: 'Standard billing measure' },
      { name: 'hsnCode', type: 'String (VARCHAR 20)', required: false, description: 'GST HSN classification code' },
    ],
  },
  crushers: {
    id: 'crushers',
    displayName: 'Crushers & Quarries',
    javaEntity: 'com.transport.tms.master.entity.Source',
    table: 'sources',
    primaryKeyPrefix: 'SRC-',
    description: 'Quarries, crushing sites, river gravel pits supplying haulage mineral cargo.',
    fields: [
      { name: 'id', type: 'String (VARCHAR 32)', required: true, isPrimaryKey: true, description: 'Quarry source code' },
      { name: 'name', type: 'String (VARCHAR 150)', required: true, description: 'Commercial site name' },
      { name: 'location', type: 'String (VARCHAR 150)', required: true, description: 'Geographic hub / district' },
      { name: 'contactPerson', type: 'String (VARCHAR 100)', required: false, description: 'Site manager name' },
      { name: 'contactPhone', type: 'String (VARCHAR 20)', required: false, description: 'Quarry contact phone' },
      { name: 'status', type: "Enum ('ACTIVE' | 'INACTIVE')", required: true, description: 'Operating status' },
    ],
  },
  locations: {
    id: 'locations',
    displayName: 'Locations & Hubs',
    javaEntity: 'com.transport.tms.master.entity.Location',
    table: 'locations',
    primaryKeyPrefix: 'LOC-',
    description: 'Standard origin loading hubs and destination delivery project sites.',
    fields: [
      { name: 'id', type: 'String (VARCHAR 32)', required: true, isPrimaryKey: true, description: 'Location identifier' },
      { name: 'name', type: 'String (VARCHAR 150)', required: true, description: 'Hub / project site name' },
      { name: 'type', type: "Enum ('LOADING' | 'DELIVERY' | 'BOTH')", required: true, description: 'Hub classification' },
      { name: 'district', type: 'String (VARCHAR 100)', required: false, description: 'Administrative district' },
    ],
  },
  vehicle_expenses: {
    id: 'vehicle_expenses',
    displayName: 'Vehicle Expenses',
    javaEntity: 'com.transport.tms.finance.entity.VehicleExpense',
    table: 'vehicle_expenses',
    primaryKeyPrefix: 'VEX-',
    description: 'Maintenance, tyre replacements, fitness certificate, and repair expenditures.',
    fields: [
      { name: 'id', type: 'String (VARCHAR 32)', required: true, isPrimaryKey: true, description: 'Expense voucher reference' },
      { name: 'date', type: 'String / LocalDate', required: true, description: 'Maintenance service date' },
      { name: 'vehicleRegistration', type: 'String (VARCHAR 20)', required: true, isForeignKey: true, references: 'vehicles.registration', description: 'Serviced truck' },
      { name: 'category', type: "Enum ('MAINTENANCE' | 'TYRE' | 'INSURANCE' | 'FC_RTO')", required: true, description: 'Expense category' },
      { name: 'amount', type: 'Double / Decimal', required: true, description: 'Expense cost in INR' },
      { name: 'vendorName', type: 'String (VARCHAR 150)', required: false, description: 'Workshop / Tyre vendor' },
      { name: 'description', type: 'String (TEXT)', required: true, description: 'Work details / invoice reference' },
    ],
  },
  other_expenses: {
    id: 'other_expenses',
    displayName: 'Other Expenses',
    javaEntity: 'com.transport.tms.finance.entity.OtherExpense',
    table: 'other_expenses',
    primaryKeyPrefix: 'OEX-',
    description: 'Office rent, electricity, administrative disbursements, and miscellaneous overheads.',
    fields: [
      { name: 'id', type: 'String (VARCHAR 32)', required: true, isPrimaryKey: true, description: 'Expense voucher ID' },
      { name: 'date', type: 'String / LocalDate', required: true, description: 'Disbursement date' },
      { name: 'category', type: 'String (VARCHAR 50)', required: true, description: 'Operational category' },
      { name: 'amount', type: 'Double / Decimal', required: true, description: 'Amount in INR' },
      { name: 'paidTo', type: 'String (VARCHAR 150)', required: true, description: 'Beneficiary / vendor name' },
      { name: 'description', type: 'String (TEXT)', required: true, description: 'Purpose description' },
    ],
  },
  cash_bank: {
    id: 'cash_bank',
    displayName: 'Cash & Bank Accounts',
    javaEntity: 'com.transport.tms.finance.entity.CashBankAccount',
    table: 'cash_bank_accounts',
    primaryKeyPrefix: 'ACC-',
    description: 'Current accounts, cash drawers, and fuel bunker prepaid reserve ledgers.',
    fields: [
      { name: 'id', type: 'String (VARCHAR 32)', required: true, isPrimaryKey: true, description: 'Account reference' },
      { name: 'accountName', type: 'String (VARCHAR 100)', required: true, description: 'Account name (e.g. HDFC Current, Main Cash)' },
      { name: 'type', type: "Enum ('BANK' | 'CASH')", required: true, description: 'Liquidity tier' },
      { name: 'accountNumber', type: 'String (VARCHAR 50)', required: false, description: 'Bank account number' },
      { name: 'bankName', type: 'String (VARCHAR 100)', required: false, description: 'Banking institution' },
      { name: 'balance', type: 'Double / Decimal', required: true, description: 'Current available balance in INR' },
    ],
  },
};

export function AdminDatabase() {
  const store = useTmsStore();
  const [selectedEntityKey, setSelectedEntityKey] = useState<string>('trips');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'records' | 'schema'>('records');

  const currentSchema = SCHEMAS[selectedEntityKey] || SCHEMAS.trips;

  // Retrieve actual store records for selected entity
  const rawRecords: any[] = useMemo(() => {
    switch (selectedEntityKey) {
      case 'trips': return store.trips || [];
      case 'customers': return store.customers || [];
      case 'vehicles': return store.vehicles || [];
      case 'drivers': return store.drivers || [];
      case 'workers': return store.workers || [];
      case 'users': return DEMO_USERS || [];
      case 'materials': return store.materials || [];
      case 'crushers': return store.sources || [];
      case 'locations': return store.locations || [];
      case 'invoices': return store.invoices || [];
      case 'payments': return store.payments || [];
      case 'transactions': return store.transactions || [];
      case 'diesel': return store.dieselRecords || [];
      case 'vehicle_expenses': return store.vehicleExpenses || [];
      case 'other_expenses': return store.otherExpenses || [];
      case 'cash_bank': return store.accounts || [];
      case 'rates': return store.rates || [];
      case 'audit': return store.auditLogs || [];
      default: return [];
    }
  }, [selectedEntityKey, store]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return rawRecords;
    const q = searchQuery.toLowerCase();
    return rawRecords.filter((rec) => {
      return Object.values(rec).some((val) =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(q)
      );
    });
  }, [rawRecords, searchQuery]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Database & Data Model Explorer"
        description="Low-level system data inspection · Schemas, primary/foreign keys, field definitions, and raw live records"
      />

      {/* ENTITY PICKER TABS */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[#D9DBD6]">
        {Object.entries(SCHEMAS).map(([key, schema]) => {
          let count = 0;
          switch (key) {
            case 'trips': count = store.trips.length; break;
            case 'customers': count = store.customers.length; break;
            case 'vehicles': count = store.vehicles.length; break;
            case 'drivers': count = store.drivers.length; break;
            case 'workers': count = store.workers.length; break;
            case 'users': count = DEMO_USERS.length; break;
            case 'materials': count = store.materials.length; break;
            case 'crushers': count = store.sources.length; break;
            case 'locations': count = store.locations.length; break;
            case 'invoices': count = store.invoices.length; break;
            case 'payments': count = store.payments.length; break;
            case 'transactions': count = store.transactions.length; break;
            case 'diesel': count = store.dieselRecords.length; break;
            case 'vehicle_expenses': count = store.vehicleExpenses.length; break;
            case 'other_expenses': count = store.otherExpenses.length; break;
            case 'cash_bank': count = store.accounts.length; break;
            case 'rates': count = store.rates.length; break;
            case 'audit': count = store.auditLogs.length; break;
          }

          const isSelected = selectedEntityKey === key;
          return (
            <button
              key={key}
              onClick={() => {
                setSelectedEntityKey(key);
                setSelectedRecord(null);
                setSearchQuery('');
              }}
              className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap border-b-2 ${
                isSelected
                  ? 'border-[#2F668F] text-[#2F668F] bg-white shadow-sm'
                  : 'border-transparent text-[#5A6E7F] hover:text-[#16425B] hover:bg-[#f0f4f8]'
              }`}
            >
              <Database size={13} className={isSelected ? 'text-[#2F668F]' : 'text-[#8898aa]'} />
              <span>{schema.displayName.split(' ')[0]}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                isSelected ? 'bg-[#2F668F] text-white' : 'bg-[#e2e8f0] text-[#475569]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* METADATA BAR */}
      <div className="bg-white p-4 rounded-lg border border-[#D9DBD6] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#16425B]">{currentSchema.displayName}</h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#f0f4f8] text-[#2F668F] font-bold">
              table: {currentSchema.table}
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              {currentSchema.fields.length} columns
            </span>
          </div>
          <p className="text-xs text-[#5A6E7F] mt-1 font-mono">{currentSchema.javaEntity}</p>
        </div>

        {/* View Switcher: Live Records vs Schema */}
        <div className="flex items-center gap-1 bg-[#f0f4f8] p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              activeTab === 'records'
                ? 'bg-white text-[#2F668F] shadow-sm'
                : 'text-[#5A6E7F] hover:text-[#16425B]'
            }`}
          >
            Live Records ({filteredRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
              activeTab === 'schema'
                ? 'bg-white text-[#2F668F] shadow-sm'
                : 'text-[#5A6E7F] hover:text-[#16425B]'
            }`}
          >
            Schema & Dictionary
          </button>
        </div>
      </div>

      {/* SCHEMA TAB */}
      {activeTab === 'schema' && (
        <div className="bg-white rounded-lg border border-[#D9DBD6] p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#D9DBD6]">
            <div>
              <h3 className="text-sm font-bold text-[#16425B]">Column Specifications & Constraints</h3>
              <p className="text-xs text-[#5A6E7F]">{currentSchema.description}</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#2F668F]">PK Pattern: {currentSchema.primaryKeyPrefix}*</span>
          </div>

          <div className="table-container">
            <table className="tms-table text-xs">
              <thead>
                <tr>
                  <th>Field / Column</th>
                  <th>Data Type</th>
                  <th>Key / Constraint</th>
                  <th>Required</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {currentSchema.fields.map((f) => (
                  <tr key={f.name}>
                    <td className="font-mono font-bold text-[#16425B]">
                      {f.name}
                    </td>
                    <td className="font-mono text-[11px] text-[#2F668F]">{f.type}</td>
                    <td>
                      {f.isPrimaryKey && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                          PRIMARY KEY
                        </span>
                      )}
                      {f.isForeignKey && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          FK → {f.references}
                        </span>
                      )}
                      {!f.isPrimaryKey && !f.isForeignKey && (
                        <span className="text-gray-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td>
                      {f.required ? (
                        <span className="text-rose-600 font-bold text-[11px]">Yes (NOT NULL)</span>
                      ) : (
                        <span className="text-gray-500 text-[11px]">Optional (NULL)</span>
                      )}
                    </td>
                    <td className="text-[#5A6E7F]">{f.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORDS TAB */}
      {activeTab === 'records' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${selectedRecord ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-lg border border-[#D9DBD6] p-5 shadow-sm space-y-4`}>
            {/* Search filter */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-[#5A6E7F]" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search across ${rawRecords.length} ${currentSchema.displayName}...`}
                className="tms-input pl-9 text-xs"
              />
            </div>

            <div className="table-container max-h-[550px] overflow-y-auto">
              <table className="tms-table text-xs">
                <thead>
                  <tr>
                    <th>Action</th>
                    {currentSchema.fields.slice(0, 6).map((f) => (
                      <th key={f.name}>{f.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((row, idx) => {
                    const rowKey = row.id || row.registration || idx;
                    const isSelected = selectedRecord && (selectedRecord.id === row.id || selectedRecord.registration === row.registration);
                    return (
                      <tr
                        key={rowKey}
                        onClick={() => setSelectedRecord(row)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#e8f1f5] border-l-4 border-l-[#2F668F]' : 'hover:bg-[#f8faf5]'
                        }`}
                      >
                        <td className="w-16">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRecord(row);
                            }}
                            className="p-1 text-[#2F668F] hover:bg-white rounded border border-[#2F668F]/30"
                            title="Inspect Record Details"
                          >
                            <Eye size={13} />
                          </button>
                        </td>
                        {currentSchema.fields.slice(0, 6).map((f) => {
                          const val = row[f.name];
                          let display = String(val ?? '—');
                          if (typeof val === 'number' && (f.name.toLowerCase().includes('amount') || f.name.toLowerCase().includes('balance') || f.name.toLowerCase().includes('rate'))) {
                            display = `₹${val.toLocaleString('en-IN')}`;
                          }
                          return (
                            <td key={f.name} className="truncate max-w-[160px] font-mono text-[11px]">
                              {display}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center p-6 text-[#5A6E7F] text-xs">
                        No records matched your search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RECORD INSPECTOR PANEL */}
          {selectedRecord && (
            <div className="bg-white rounded-lg border border-[#2F668F] p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#D9DBD6]">
                <div>
                  <span className="text-[10px] font-bold text-[#2F668F] uppercase tracking-wider block">
                    Record Inspector
                  </span>
                  <h3 className="text-sm font-bold text-[#16425B] font-mono">
                    {selectedRecord.id || selectedRecord.registration}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="text-xs text-[#5A6E7F] hover:text-[#16425B]"
                >
                  Close
                </button>
              </div>

              {/* Formatted Key-Value pairs */}
              <div className="space-y-2 text-xs max-h-[300px] overflow-y-auto pr-1">
                {Object.entries(selectedRecord).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-start py-1 border-b border-gray-100">
                    <span className="font-mono text-[#5A6E7F] text-[11px]">{key}:</span>
                    <strong className="font-mono text-[#16425B] text-[11px] text-right truncate max-w-[180px]">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val ?? 'null')}
                    </strong>
                  </div>
                ))}
              </div>

              {/* Raw JSON View */}
              <div>
                <span className="text-[10px] font-bold text-[#5A6E7F] uppercase tracking-wider block mb-1">
                  Raw JSON Payload
                </span>
                <pre className="p-3 bg-[#1e293b] text-emerald-400 rounded-lg text-[10px] font-mono overflow-x-auto max-h-[160px] leading-relaxed">
                  {JSON.stringify(selectedRecord, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
