export type UserRole = 'ADMIN' | 'MD' | 'MANAGER' | 'ACCOUNTS' | 'WORKER';

export type TripStatus =
  | 'NO_LOAD'
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'LOADED'
  | 'RUNNING'
  | 'DELIVERED'
  | 'PAYMENT_PENDING'
  | 'COMPLETED'
  | 'CANCELLED';

export type InvoiceStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'CANCELLED';

export type PaymentMode = 'CASH' | 'BANK' | 'UPI' | 'ONLINE' | 'OTHER';

export type AccountType = 'CASH' | 'BANK' | 'ONLINE';

export type TransactionType =
  | 'RECEIVABLE'
  | 'CUSTOMER_PAYMENT'
  | 'CUSTOMER_CREDIT'
  | 'DRIVER_ADVANCE'
  | 'DRIVER_PAYMENT'
  | 'DIESEL'
  | 'MAINTENANCE'
  | 'SOURCE_PAYMENT'
  | 'EXPENSE'
  | 'SALARY'
  | 'TRANSFER'
  | 'OPENING_BALANCE'
  | 'ADJUSTMENT';

export type TransactionStatus = 'POSTED' | 'CORRECTION_REQUESTED' | 'CORRECTED' | 'CANCELLED';

export interface Customer {
  id: string; // Permanent ID e.g. CUS-00124
  name: string;
  phone: string; // duplicate protection key
  alternatePhone?: string;
  address: string;
  gstin?: string;
  creditTerms?: string; // e.g. 15 Days, 30 Days
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
  // Financial metrics (derived from transactions/invoices)
  openingBalance?: number;
  balance: number; // current outstanding
  totalCredit: number; // total billed
  totalPaid: number;
}

export interface Vehicle {
  registration: string; // Registration Number e.g. TN 58 AB 2345
  type: string; // Tipper, Trailer, Truck, etc.
  ownership: 'OWN' | 'RENTED';
  capacity: string; // e.g. 18 Ton, 20 Ton
  fuelCapacity: string; // e.g. 180 L
  currentKm: number;
  lastMaintenanceDate?: string;
  maintenanceFee?: number;
  insuranceExpiry?: string;
  fcExpiry?: string; // Fitness Certificate
  permitExpiry?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE' | 'INACTIVE';
}

export interface Driver {
  id: string; // DRV-0012
  name: string;
  phone: string;
  licenseNumber?: string;
  assignedVehicle?: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'INACTIVE';
  // Ledger balances
  advanceBalance: number;
  totalEarnings: number;
  totalSettled: number;
}

export interface Worker {
  id: string; // WRK-0024
  name: string;
  phone: string;
  email: string;
  role: 'Data Entry Operator' | 'Driver' | 'Supervisor' | 'Manager' | 'Accounts' | 'Admin';
  systemRole: UserRole;
  salary: number; // Monthly base or wage
  paid: number;
  advance: number;
  deduction: number;
  assignedLocation?: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin?: string;
  hasLogin?: boolean;
  username?: string;
  userId?: string;
}

export interface Source {
  id: string; // SRC-001
  name: string; // Crusher / Quarry Name
  location: string;
  contactPerson?: string;
  phone?: string;
  material: string;
  pricePerTon: number;
  effectiveFrom: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Material {
  id: string; // MAT-001
  name: string; // 20 MM, 12 MM, Black M-Sand, WMM, Boulders
  category: string;
  standardUnit: 'Ton' | 'CFT' | 'Load';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface LocationItem {
  id: string;
  name: string;
  type: 'Quarry' | 'Crusher' | 'Site' | 'Yard';
  address?: string;
  distanceKm?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ConfiguredRate {
  id: string;
  rateType: 'CUSTOMER' | 'CRUSHER' | 'TRANSPORT' | 'PER_KM';
  customerId?: string;
  sourceId?: string;
  material: string;
  loadingLocation: string;
  deliveryLocation: string;
  rate: number;
  unit: 'Ton' | 'CFT' | 'Load' | 'KM';
  effectiveFrom: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Trip {
  id: string; // TRP-01483
  date: string; // Business Date
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehicleRegistration: string;
  vehicleOwnership: 'OWN' | 'RENTED';
  driverId: string;
  driverName: string;
  driverPhone: string;
  material: string;
  quantity: number;
  unit: 'Ton' | 'CFT' | 'Load';
  source: string;
  sourceBillNo?: string;
  loadingLocation: string;
  deliveryLocation: string;
  loadingDateTime?: string;
  departureDateTime?: string;
  deliveryDateTime?: string;
  unloadQuantity?: number;
  unloadUnit?: 'Ton' | 'CFT' | 'Load';
  shortage?: number;
  openingKm?: number;
  closingKm?: number;
  tripKm?: number;
  // Configured rate frozen at time of creation (Historical Rate Preservation)
  appliedRate: number;
  billingRate?: number;
  transportRate?: number;
  purchaseRate?: number;
  perKmRate?: number;
  rateUnit: 'Ton' | 'CFT' | 'Load';
  totalAmount?: number; // quantity * appliedRate (Worker cannot view this)
  status: TripStatus;
  progress: number; // 1 to 7 for stepper
  isNoLoad?: boolean;
  noLoadReason?: string;
  enteredBy: string; // e.g. Arun Kumar
  notes?: string;
  deliveryProof?: string;
  invoiceId?: string;
  customerTransactionType?: 'Cash' | 'Credit';
}

export interface InvoiceLineItem {
  tripId: string;
  date: string;
  vehicle: string;
  material: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string; // INV-0001
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerGstin?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  gstRate: number; // e.g. 5% or 18%
  gstAmount: number;
  totalAmount: number;
  receivedAmount: number;
  outstandingAmount: number;
  status: InvoiceStatus;
  notes?: string;
}

export interface InvoiceAllocation {
  invoiceId: string;
  amount: number;
}

export interface Payment {
  id: string; // PAY-0001
  date: string;
  customerId: string;
  customerName: string;
  amount: number;
  mode: PaymentMode;
  accountId: string; // Account receiving funds
  accountName: string;
  reference?: string;
  allocations: InvoiceAllocation[];
  notes?: string;
  recordedBy: string;
}

export interface FinancialTransaction {
  id: string; // TXN-02481
  date: string;
  entity: string; // Customer Name, Worker Name, Vehicle, etc.
  entityId?: string;
  entityType: 'CUSTOMER' | 'WORKER' | 'VEHICLE' | 'BUSINESS' | 'CASH_BANK' | 'SOURCE';
  type: TransactionType;
  debit: number;
  credit: number;
  amount: number;
  paymentMode?: PaymentMode;
  account?: string; // Cash, Bank, UPI / Online
  status: TransactionStatus;
  reference?: string;
  notes?: string;
  createdBy: string;
  tripId?: string;
  invoiceId?: string;
}

export interface DieselRecord {
  id: string; // DSL-001
  vehicleRegistration: string;
  driverId: string;
  driverName: string;
  fuelStation: string;
  date: string;
  time: string;
  litres: number;
  ratePerLitre: number;
  totalAmount: number; // litres * rate
  startKm?: number;
  endKm?: number;
  distanceKm: number; // endKm - startKm
  mileage: number; // distanceKm / litres
  paymentAccount: string;
  billNumber: string; // duplicate protection key
  reference?: string;
  notes?: string;
  status: 'POSTED' | 'CANCELLED';
  createdBy: string;
}

export interface VehicleExpense {
  id: string; // VEX-001
  vehicleRegistration: string;
  expenseType: 'Maintenance' | 'Repair' | 'Service' | 'Tyre' | 'Spare Parts' | 'FC / Permit' | 'Insurance' | 'Other';
  date: string;
  time: string;
  amount: number;
  paymentMode: PaymentMode;
  account: string;
  serviceStationSupplier?: string;
  odometerKm?: number;
  billNumber?: string;
  notes?: string;
  status: 'POSTED' | 'CANCELLED';
  createdBy: string;
}

export interface OtherExpense {
  id: string; // OEX-001
  category: 'Nut & Bolt' | 'Office Expense' | 'Electricity' | 'Rent' | 'Travel' | 'Food' | 'Miscellaneous';
  description: string;
  date: string;
  time: string;
  amount: number;
  paymentMode: PaymentMode;
  account: string;
  referenceBill?: string;
  notes?: string;
  status: 'POSTED' | 'CANCELLED';
  createdBy: string;
}

export interface CashBankAccount {
  id: string;
  name: string; // Cash, Main Bank, UPI / Online
  type: AccountType;
  accountNumber?: string;
  bankName?: string;
  openingBalance: number;
  balance: number; // Derived from posted transactions & transfers
}

export interface AccountTransfer {
  id: string; // TRF-001
  date: string;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  amount: number;
  reference?: string;
  notes?: string;
  createdBy: string;
}

export interface CorrectionRequest {
  id: string; // CRQ-001
  transactionId: string;
  entityName: string;
  entityType?: string;
  date: string;
  requestedDate?: string;
  requestedBy: string;
  originalValue: string;
  requestedValue: string;
  reason: string;
  status: 'PENDING_MD' | 'PENDING_MD_APPROVAL' | 'PENDING_MANAGER_APPROVAL' | 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedDate?: string;
  reviewNotes?: string;
}

export interface AuditLog {
  id: string; // AUD-001
  timestamp: string;
  user: string;
  userRole: UserRole;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'APPROVE' | 'REJECT' | 'EXPORT' | 'IMPORT' | 'PERMISSION_CHANGE';
  entity: string;
  entityId: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
}

export interface AuthSession {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId: string;
}

export interface PermissionMatrix {
  role: UserRole;
  canViewFinancials: boolean;
  canEditRates: boolean;
  canManageMasters: boolean;
  canPostPayments: boolean;
  canGenerateInvoices: boolean;
  canApproveCorrections: boolean;
  canManageUsers: boolean;
  canExportData: boolean;
  canImportData: boolean;
}

export interface SystemControlState {
  id: number;
  systemState: 'ONLINE' | 'MAINTENANCE' | 'SHUTDOWN';
  maintenanceTitle: string;
  maintenanceMessage: string;
  expectedRecoveryTime?: string | null;
  shutdownReason?: string | null;
  shutdownBy?: string | null;
  shutdownAt?: string | null;
  allowAdminBypass: boolean;
  allowWorkerTrips: boolean;
  allowAccountsPayments: boolean;
  lockSensitiveOps: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface FeatureFlag {
  flagKey: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  updatedBy: string;
  updatedAt?: string;
}

export interface BackupRecord {
  id: string;
  backupName: string;
  backupType: string;
  filePath: string;
  fileSizeBytes: number;
  checksumSha256?: string;
  status: 'COMPLETED' | 'FAILED' | 'VERIFIED' | 'RESTORED';
  entityCountsJson?: string;
  createdBy: string;
  createdAt: string;
  verifiedAt?: string | null;
  restoredAt?: string | null;
  notes?: string;
}

export interface BackupSchedule {
  id: string;
  scheduleType: string;
  enabled: boolean;
  dayOfWeek: number;
  dayOfMonth: number;
  executionTime: string;
  retentionCount: number;
  destination: string;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  updatedAt?: string;
  updatedBy?: string;
}

export interface SystemHealth {
  backendStatus: string;
  databaseStatus: string;
  apiStatus: string;
  backupStatus: string;
  storageStatus: string;
  auditStatus: string;
  systemState: string;
  environment: string;
  appVersion: string;
  dbVersion: string;
  activeDbPool: string;
  jvmMemory: string;
  uptimeSeconds: number;
  tableCounts: Record<string, number>;
  totalBackups: number;
  lastBackup?: BackupRecord | null;
  lastRecovery?: string | null;
  activeSessionsCount: number;
}

