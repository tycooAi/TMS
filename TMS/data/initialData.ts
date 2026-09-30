import {
  AuditLog,
  CashBankAccount,
  ConfiguredRate,
  CorrectionRequest,
  Customer,
  DieselRecord,
  Driver,
  Invoice,
  LocationItem,
  Material,
  OtherExpense,
  Payment,
  Source,
  FinancialTransaction,
  Trip,
  Vehicle,
  VehicleExpense,
  Worker,
} from '../types';

/**
 * Production Initial Data - SRI AMMAN ARUL TRANSPORTS
 * Zero business/demo records. All business data is fetched from the PostgreSQL database via REST APIs.
 */

export const initialCustomers: Customer[] = [];
export const initialVehicles: Vehicle[] = [];
export const initialDrivers: Driver[] = [];
export const initialWorkers: Worker[] = [];
export const initialSources: Source[] = [];
export const initialMaterials: Material[] = [];
export const initialLocations: LocationItem[] = [];
export const initialRates: ConfiguredRate[] = [];
export const initialTrips: Trip[] = [];
export const initialInvoices: Invoice[] = [];
export const initialPayments: Payment[] = [];
export const initialAccounts: CashBankAccount[] = [];
export const initialTransactions: FinancialTransaction[] = [];
export const initialDieselRecords: DieselRecord[] = [];
export const initialVehicleExpenses: VehicleExpense[] = [];
export const initialOtherExpenses: OtherExpense[] = [];
export const initialCorrections: CorrectionRequest[] = [];
export const initialAuditLogs: AuditLog[] = [];
