'use client';

import { useEffect, useState, useCallback } from 'react';
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
  TripStatus,
  Vehicle,
  VehicleExpense,
  Worker,
} from '../types';
import {
  initialAccounts,
  initialAuditLogs,
  initialCorrections,
  initialCustomers,
  initialDieselRecords,
  initialDrivers,
  initialInvoices,
  initialLocations,
  initialMaterials,
  initialOtherExpenses,
  initialPayments,
  initialRates,
  initialSources,
  initialTransactions,
  initialTrips,
  initialVehicleExpenses,
  initialVehicles,
  initialWorkers,
} from '../data/initialData';
import { generateNextId } from './ids';

export const STORE_STORAGE_KEY = 'tms_unified_store_v2';

export interface StoreState {
  customers: Customer[];
  vehicles: Vehicle[];
  drivers: Driver[];
  workers: Worker[];
  sources: Source[];
  materials: Material[];
  locations: LocationItem[];
  rates: ConfiguredRate[];
  trips: Trip[];
  invoices: Invoice[];
  payments: Payment[];
  transactions: FinancialTransaction[];
  dieselRecords: DieselRecord[];
  vehicleExpenses: VehicleExpense[];
  otherExpenses: OtherExpense[];
  accounts: CashBankAccount[];
  corrections: CorrectionRequest[];
  auditLogs: AuditLog[];
}

export const defaultState: StoreState = {
  customers: initialCustomers,
  vehicles: initialVehicles,
  drivers: initialDrivers,
  workers: initialWorkers,
  sources: initialSources,
  materials: initialMaterials,
  locations: initialLocations,
  rates: initialRates,
  trips: initialTrips,
  invoices: initialInvoices,
  payments: initialPayments,
  transactions: initialTransactions,
  dieselRecords: initialDieselRecords,
  vehicleExpenses: initialVehicleExpenses,
  otherExpenses: initialOtherExpenses,
  accounts: initialAccounts,
  corrections: initialCorrections,
  auditLogs: initialAuditLogs,
};

export function readStore(): StoreState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const raw = localStorage.getItem(STORE_STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

export function writeStore(state: StoreState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event('tms:store-update'));
}

export function useTmsStore() {
  const [state, setState] = useState<StoreState>(defaultState);

  useEffect(() => {
    setState(readStore());
    const handleSync = () => setState(readStore());
    window.addEventListener('tms:store-update', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('tms:store-update', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const addAudit = useCallback((audit: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const current = readStore();
    const id = generateNextId('AUD', current.auditLogs.map((a) => a.id));
    const now = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const nextLog: AuditLog = {
      ...audit,
      id,
      timestamp: now,
    };
    writeStore({
      ...current,
      auditLogs: [nextLog, ...current.auditLogs],
    });
  }, []);

  // Worker Trip creation
  const createTrip = useCallback(
    (trip: Trip) => {
      const current = readStore();
      const nextTrips = [trip, ...current.trips];
      writeStore({
        ...current,
        trips: nextTrips,
      });
      addAudit({
        user: trip.enteredBy || 'Worker',
        userRole: 'WORKER',
        action: 'CREATE',
        entity: 'TRIP',
        entityId: trip.id,
        description: `Created trip for ${trip.customerName} (${trip.material}, ${trip.quantity} ${trip.unit})`,
        newValue: trip.status,
      });
    },
    [addAudit]
  );

  // Worker Trip status progression
  const updateTripStatus = useCallback(
    (
      tripId: string,
      status: TripStatus,
      extra: Partial<Trip>,
      actorName = 'Arun Kumar'
    ) => {
      const current = readStore();
      const existing = current.trips.find((t) => t.id === tripId);
      if (!existing) return;

      const updatedTrips = current.trips.map((t) =>
        t.id === tripId ? { ...t, ...extra, status } : t
      );

      // If status becomes DELIVERED, mark vehicle available or update vehicle KM
      let nextVehicles = current.vehicles;
      if (status === 'DELIVERED' && extra.closingKm) {
        nextVehicles = current.vehicles.map((v) =>
          v.registration === existing.vehicleRegistration
            ? { ...v, currentKm: extra.closingKm || v.currentKm, status: 'AVAILABLE' }
            : v
        );
      }

      writeStore({
        ...current,
        trips: updatedTrips,
        vehicles: nextVehicles,
      });

      addAudit({
        user: actorName,
        userRole: 'WORKER',
        action: 'STATUS_CHANGE',
        entity: 'TRIP',
        entityId: tripId,
        description: `Operational status updated to ${status}`,
        oldValue: existing.status,
        newValue: status,
      });
    },
    [addAudit]
  );

  // Accounts & Master: Customer Creation
  const createCustomer = useCallback(
    (
      customer: Customer,
      initialFinancial?: {
        kind: 'INSTANT' | 'CREDIT';
        amount: number;
        mode?: 'CASH' | 'BANK' | 'UPI' | 'ONLINE' | 'OTHER';
        accountName?: string;
        reference?: string;
      },
      actorName = 'Anitha S'
    ) => {
      const current = readStore();
      // Check phone duplicate
      const normPhone = customer.phone.replace(/\D/g, '');
      const duplicate = current.customers.find(
        (c) => c.phone.replace(/\D/g, '') === normPhone
      );
      if (duplicate) {
        throw new Error(`Customer with phone ${customer.phone} already exists (${duplicate.name}, ${duplicate.id}).`);
      }

      let balance = customer.balance || 0;
      let totalCredit = customer.totalCredit || 0;
      let totalPaid = customer.totalPaid || 0;
      let nextTx = current.transactions;
      let nextAccounts = current.accounts;

      if (initialFinancial && initialFinancial.amount > 0) {
        const txId = generateNextId('TXN', current.transactions.map((t) => t.id));
        const dateStr = new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        if (initialFinancial.kind === 'INSTANT') {
          totalPaid += initialFinancial.amount;
          const targetAccount = initialFinancial.accountName || 'Cash in Hand';
          const newTx: FinancialTransaction = {
            id: txId,
            date: dateStr,
            entity: customer.name,
            entityId: customer.id,
            entityType: 'CUSTOMER',
            type: 'CUSTOMER_PAYMENT',
            debit: 0,
            credit: initialFinancial.amount,
            amount: initialFinancial.amount,
            paymentMode: initialFinancial.mode || 'UPI',
            account: targetAccount,
            status: 'POSTED',
            createdBy: actorName,
            reference: initialFinancial.reference,
            notes: 'Opening instant payment receipt',
          };
          nextTx = [newTx, ...nextTx];
          nextAccounts = nextAccounts.map((a) =>
            a.name === targetAccount
              ? { ...a, balance: a.balance + initialFinancial.amount }
              : a
          );
        } else {
          balance += initialFinancial.amount;
          totalCredit += initialFinancial.amount;
          const newTx: FinancialTransaction = {
            id: txId,
            date: dateStr,
            entity: customer.name,
            entityId: customer.id,
            entityType: 'CUSTOMER',
            type: 'CUSTOMER_CREDIT',
            debit: initialFinancial.amount,
            credit: 0,
            amount: initialFinancial.amount,
            status: 'POSTED',
            createdBy: actorName,
            notes: 'Opening balance receivable credit',
          };
          nextTx = [newTx, ...nextTx];
        }
      }

      const savedCustomer: Customer = {
        ...customer,
        balance,
        totalCredit,
        totalPaid,
      };

      writeStore({
        ...current,
        customers: [savedCustomer, ...current.customers],
        transactions: nextTx,
        accounts: nextAccounts,
      });

      addAudit({
        user: actorName,
        userRole: 'ACCOUNTS',
        action: 'CREATE',
        entity: 'CUSTOMER',
        entityId: customer.id,
        description: `Created customer master ${customer.name} (Phone: ${customer.phone})`,
        newValue: `Balance: ₹${balance}, Terms: ${customer.creditTerms || 'Standard'}`,
      });

      return savedCustomer;
    },
    [addAudit]
  );

  // Accounts: Generate Invoice from Delivered Trips
  const createInvoice = useCallback(
    (invoice: Invoice, actorName = 'Anitha S') => {
      const current = readStore();
      const nextInvoices = [invoice, ...current.invoices];

      // Mark trips as invoiced
      const invoicedTripIds = invoice.lineItems.map((li) => li.tripId);
      const nextTrips = current.trips.map((t) =>
        invoicedTripIds.includes(t.id)
          ? { ...t, invoiceId: invoice.id, status: 'PAYMENT_PENDING' as TripStatus }
          : t
      );

      // Create Customer Credit transaction
      const txId = generateNextId('TXN', current.transactions.map((t) => t.id));
      const newTx: FinancialTransaction = {
        id: txId,
        date: invoice.date,
        entity: invoice.customerName,
        entityId: invoice.customerId,
        entityType: 'CUSTOMER',
        type: 'CUSTOMER_CREDIT',
        debit: invoice.totalAmount,
        credit: 0,
        amount: invoice.totalAmount,
        status: 'POSTED',
        createdBy: actorName,
        reference: invoice.invoiceNumber,
        invoiceId: invoice.id,
        notes: `Invoice generated for ${invoice.lineItems.length} trips`,
      };

      // Update customer balance & credit
      const nextCustomers = current.customers.map((c) =>
        c.id === invoice.customerId
          ? {
              ...c,
              balance: c.balance + invoice.totalAmount,
              totalCredit: c.totalCredit + invoice.totalAmount,
            }
          : c
      );

      writeStore({
        ...current,
        invoices: nextInvoices,
        trips: nextTrips,
        transactions: [newTx, ...current.transactions],
        customers: nextCustomers,
      });

      addAudit({
        user: actorName,
        userRole: 'ACCOUNTS',
        action: 'CREATE',
        entity: 'INVOICE',
        entityId: invoice.id,
        description: `Generated Invoice ${invoice.invoiceNumber} for ${invoice.customerName} - Total: ₹${invoice.totalAmount}`,
      });
    },
    [addAudit]
  );

  // Accounts: Record Customer Payment (allocating across open invoices)
  const recordCustomerPayment = useCallback(
    (
      payment: Payment,
      actorName = 'Anitha S'
    ) => {
      const current = readStore();
      const nextPayments = [payment, ...current.payments];

      // Update customer balance and totalPaid
      const nextCustomers = current.customers.map((c) =>
        c.id === payment.customerId
          ? {
              ...c,
              balance: Math.max(0, c.balance - payment.amount),
              totalPaid: c.totalPaid + payment.amount,
            }
          : c
      );

      // Update invoices allocated
      const nextInvoices = current.invoices.map((inv) => {
        const alloc = payment.allocations.find((a) => a.invoiceId === inv.id);
        if (!alloc) return inv;
        const newReceived = inv.receivedAmount + alloc.amount;
        const newOutstanding = Math.max(0, inv.totalAmount - newReceived);
        const newStatus =
          newOutstanding === 0 ? 'PAID' : newReceived > 0 ? 'PARTIALLY_PAID' : inv.status;
        return {
          ...inv,
          receivedAmount: newReceived,
          outstandingAmount: newOutstanding,
          status: newStatus as any,
        };
      });

      // Update Cash/Bank account
      const nextAccounts = current.accounts.map((a) =>
        a.name === payment.accountName
          ? { ...a, balance: a.balance + payment.amount }
          : a
      );

      // Create transaction record
      const txId = generateNextId('TXN', current.transactions.map((t) => t.id));
      const newTx: FinancialTransaction = {
        id: txId,
        date: payment.date,
        entity: payment.customerName,
        entityId: payment.customerId,
        entityType: 'CUSTOMER',
        type: 'CUSTOMER_PAYMENT',
        debit: 0,
        credit: payment.amount,
        amount: payment.amount,
        paymentMode: payment.mode,
        account: payment.accountName,
        status: 'POSTED',
        createdBy: actorName,
        reference: payment.reference || payment.id,
        notes: payment.notes || 'Customer payment posted against statement',
      };

      writeStore({
        ...current,
        payments: nextPayments,
        customers: nextCustomers,
        invoices: nextInvoices,
        accounts: nextAccounts,
        transactions: [newTx, ...current.transactions],
      });

      addAudit({
        user: actorName,
        userRole: 'ACCOUNTS',
        action: 'CREATE',
        entity: 'PAYMENT',
        entityId: payment.id,
        description: `Posted Customer Payment ₹${payment.amount} from ${payment.customerName} to ${payment.accountName}`,
        newValue: `Allocations: ${payment.allocations.map((a) => `${a.invoiceId}: ₹${a.amount}`).join(', ') || 'General Balance'}`,
      });
    },
    [addAudit]
  );

  // Accounts: Worker Wage & Advance Entry
  const recordWorkerWage = useCallback(
    (
      workerId: string,
      amount: number,
      paymentMode: 'CASH' | 'BANK' | 'UPI' | 'ONLINE' | 'OTHER',
      kind: 'Wage Payment' | 'Advance Payment',
      accountName: string,
      actorName = 'Anitha S'
    ) => {
      const current = readStore();
      const worker = current.workers.find((w) => w.id === workerId);
      if (!worker) return;

      const isAdvance = kind === 'Advance Payment';
      const nextWorkers = current.workers.map((w) =>
        w.id === workerId
          ? {
              ...w,
              paid: isAdvance ? w.paid : w.paid + amount,
              advance: isAdvance ? w.advance + amount : w.advance,
            }
          : w
      );

      // Debit Cash/Bank account
      const nextAccounts = current.accounts.map((a) =>
        a.name === accountName
          ? { ...a, balance: a.balance - amount }
          : a
      );

      const txId = generateNextId('TXN', current.transactions.map((t) => t.id));
      const dateStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const newTx: FinancialTransaction = {
        id: txId,
        date: dateStr,
        entity: worker.name,
        entityId: worker.id,
        entityType: 'WORKER',
        type: isAdvance ? 'DRIVER_ADVANCE' : 'SALARY',
        debit: amount,
        credit: 0,
        amount,
        paymentMode,
        account: accountName,
        status: 'POSTED',
        createdBy: actorName,
        notes: `${kind} disbursed from ${accountName}`,
      };

      writeStore({
        ...current,
        workers: nextWorkers,
        accounts: nextAccounts,
        transactions: [newTx, ...current.transactions],
      });

      addAudit({
        user: actorName,
        userRole: 'ACCOUNTS',
        action: 'CREATE',
        entity: 'WORKER_WAGE',
        entityId: workerId,
        description: `Posted ${kind} of ₹${amount} to ${worker.name} from ${accountName}`,
      });
    },
    [addAudit]
  );

  // Accounts: Diesel Logging
  const recordDiesel = useCallback(
    (record: DieselRecord, actorName = 'Anitha S') => {
      const current = readStore();
      // Duplicate bill check
      const duplicate = current.dieselRecords.find(
        (d) => d.billNumber.trim().toLowerCase() === record.billNumber.trim().toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Fuel bill number ${record.billNumber} has already been logged.`);
      }

      // Deduct from account
      const nextAccounts = current.accounts.map((a) =>
        a.name === record.paymentAccount
          ? { ...a, balance: a.balance - record.totalAmount }
          : a
      );

      // Update vehicle current KM
      const nextVehicles = current.vehicles.map((v) =>
        v.registration === record.vehicleRegistration
          ? { ...v, currentKm: Math.max(v.currentKm, record.endKm) }
          : v
      );

      const txId = generateNextId('TXN', current.transactions.map((t) => t.id));
      const newTx: FinancialTransaction = {
        id: txId,
        date: record.date,
        entity: record.vehicleRegistration,
        entityId: record.vehicleRegistration,
        entityType: 'VEHICLE',
        type: 'DIESEL',
        debit: record.totalAmount,
        credit: 0,
        amount: record.totalAmount,
        paymentMode: 'BANK',
        account: record.paymentAccount,
        status: 'POSTED',
        createdBy: actorName,
        reference: record.billNumber,
        notes: `${record.litres}L @ ₹${record.ratePerLitre}/L at ${record.fuelStation} (Mileage: ${record.mileage} KM/L)`,
      };

      writeStore({
        ...current,
        dieselRecords: [record, ...current.dieselRecords],
        accounts: nextAccounts,
        vehicles: nextVehicles,
        transactions: [newTx, ...current.transactions],
      });

      addAudit({
        user: actorName,
        userRole: 'ACCOUNTS',
        action: 'CREATE',
        entity: 'DIESEL',
        entityId: record.id,
        description: `Logged diesel for ${record.vehicleRegistration}: ${record.litres}L (₹${record.totalAmount}), Mileage: ${record.mileage} KM/L`,
      });
    },
    [addAudit]
  );

  // Accounts: Vehicle Expense (Maintenance, repair, etc.)
  const recordVehicleExpense = useCallback(
    (expense: VehicleExpense, actorName = 'Anitha S') => {
      const current = readStore();
      const nextAccounts = current.accounts.map((a) =>
        a.name === expense.account
          ? { ...a, balance: a.balance - expense.amount }
          : a
      );

      const txId = generateNextId('TXN', current.transactions.map((t) => t.id));
      const newTx: FinancialTransaction = {
        id: txId,
        date: expense.date,
        entity: expense.vehicleRegistration,
        entityId: expense.vehicleRegistration,
        entityType: 'VEHICLE',
        type: 'MAINTENANCE',
        debit: expense.amount,
        credit: 0,
        amount: expense.amount,
        paymentMode: expense.paymentMode,
        account: expense.account,
        status: 'POSTED',
        createdBy: actorName,
        reference: expense.billNumber,
        notes: `${expense.expenseType} - ${expense.notes || 'Service garage'}`,
      };

      writeStore({
        ...current,
        vehicleExpenses: [expense, ...current.vehicleExpenses],
        accounts: nextAccounts,
        transactions: [newTx, ...current.transactions],
      });

      addAudit({
        user: actorName,
        userRole: 'ACCOUNTS',
        action: 'CREATE',
        entity: 'VEHICLE_EXPENSE',
        entityId: expense.id,
        description: `Posted ${expense.expenseType} expense ₹${expense.amount} for ${expense.vehicleRegistration}`,
      });
    },
    [addAudit]
  );

  // Accounts: Other Expenses
  const recordOtherExpense = useCallback(
    (expense: OtherExpense, actorName = 'Anitha S') => {
      const current = readStore();
      const nextAccounts = current.accounts.map((a) =>
        a.name === expense.account
          ? { ...a, balance: a.balance - expense.amount }
          : a
      );

      const txId = generateNextId('TXN', current.transactions.map((t) => t.id));
      const newTx: FinancialTransaction = {
        id: txId,
        date: expense.date,
        entity: 'Business Operations',
        entityType: 'BUSINESS',
        type: 'EXPENSE',
        debit: expense.amount,
        credit: 0,
        amount: expense.amount,
        paymentMode: expense.paymentMode,
        account: expense.account,
        status: 'POSTED',
        createdBy: actorName,
        reference: expense.referenceBill,
        notes: `${expense.category}: ${expense.description}`,
      };

      writeStore({
        ...current,
        otherExpenses: [expense, ...current.otherExpenses],
        accounts: nextAccounts,
        transactions: [newTx, ...current.transactions],
      });

      addAudit({
        user: actorName,
        userRole: 'ACCOUNTS',
        action: 'CREATE',
        entity: 'OTHER_EXPENSE',
        entityId: expense.id,
        description: `Posted ${expense.category} expense ₹${expense.amount} (${expense.description})`,
      });
    },
    [addAudit]
  );

  // Accounts: Internal Account Transfer (No revenue / expense)
  const recordAccountTransfer = useCallback(
    (
      fromAccount: string,
      toAccount: string,
      amount: number,
      reference?: string,
      actorName = 'Anitha S'
    ) => {
      const current = readStore();
      const nextAccounts = current.accounts.map((a) => {
        if (a.name === fromAccount) return { ...a, balance: a.balance - amount };
        if (a.name === toAccount) return { ...a, balance: a.balance + amount };
        return a;
      });

      const dateStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const txIdFrom = generateNextId('TXN', current.transactions.map((t) => t.id));

      const newTx: FinancialTransaction = {
        id: txIdFrom,
        date: dateStr,
        entity: 'Internal Account Transfer',
        entityType: 'CASH_BANK',
        type: 'TRANSFER',
        debit: amount,
        credit: amount,
        amount,
        account: `${fromAccount} → ${toAccount}`,
        status: 'POSTED',
        createdBy: actorName,
        reference,
        notes: `Transferred ₹${amount} from ${fromAccount} to ${toAccount} (Balance neutral)`,
      };

      writeStore({
        ...current,
        accounts: nextAccounts,
        transactions: [newTx, ...current.transactions],
      });

      addAudit({
        user: actorName,
        userRole: 'ACCOUNTS',
        action: 'CREATE',
        entity: 'ACCOUNT_TRANSFER',
        entityId: txIdFrom,
        description: `Transferred ₹${amount} from ${fromAccount} to ${toAccount}`,
      });
    },
    [addAudit]
  );

  // Accounts: Request Correction
  const requestCorrection = useCallback(
    (
      req: Omit<CorrectionRequest, 'id' | 'status'>,
      actorName = 'Anitha S'
    ) => {
      const current = readStore();
      const id = generateNextId('CRQ', current.corrections.map((c) => c.id));
      const newRequest: CorrectionRequest = {
        ...req,
        id,
        status: 'PENDING_MD',
      };

      // Mark transaction status
      const nextTx = current.transactions.map((t) =>
        t.id === req.transactionId ? { ...t, status: 'CORRECTION_REQUESTED' as any } : t
      );

      writeStore({
        ...current,
        corrections: [newRequest, ...current.corrections],
        transactions: nextTx,
      });

      addAudit({
        user: actorName,
        userRole: 'ACCOUNTS',
        action: 'UPDATE',
        entity: 'CORRECTION_REQUEST',
        entityId: id,
        description: `Submitted correction request for ${req.transactionId}: ${req.reason}`,
        oldValue: req.originalValue,
        newValue: req.requestedValue,
      });
    },
    [addAudit]
  );

  // MD: Approve Correction Request
  const approveCorrection = useCallback(
    (
      requestId: string,
      approverName = 'Vikramaditya Rao'
    ) => {
      const current = readStore();
      const req = current.corrections.find((c) => c.id === requestId);
      if (!req) return;

      const now = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const nextCorrections = current.corrections.map((c) =>
        c.id === requestId
          ? {
              ...c,
              status: 'APPROVED' as const,
              reviewedBy: approverName,
              reviewedDate: now,
            }
          : c
      );

      // Parse requested value if it contains a new amount
      let newAmount: number | undefined;
      const match = req.requestedValue.match(/₹?([\d,]+)/);
      if (match) {
        newAmount = parseInt(match[1].replace(/,/g, ''), 10);
      }

      const nextTx = current.transactions.map((t) => {
        if (t.id === req.transactionId) {
          return {
            ...t,
            status: 'CORRECTED' as const,
            amount: newAmount !== undefined && !isNaN(newAmount) ? newAmount : t.amount,
            notes: `${t.notes} [Approved correction: ${req.requestedValue}]`,
          };
        }
        return t;
      });

      writeStore({
        ...current,
        corrections: nextCorrections,
        transactions: nextTx,
      });

      addAudit({
        user: approverName,
        userRole: 'MD',
        action: 'APPROVE',
        entity: 'CORRECTION_REQUEST',
        entityId: requestId,
        description: `Approved correction for transaction ${req.transactionId}. Applied new value: ${req.requestedValue}`,
        oldValue: req.originalValue,
        newValue: req.requestedValue,
        reason: req.reason,
      });
    },
    [addAudit]
  );

  // MD: Reject Correction Request
  const rejectCorrection = useCallback(
    (
      requestId: string,
      reason: string,
      approverName = 'Vikramaditya Rao'
    ) => {
      const current = readStore();
      const req = current.corrections.find((c) => c.id === requestId);
      if (!req) return;

      const now = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const nextCorrections = current.corrections.map((c) =>
        c.id === requestId
          ? {
              ...c,
              status: 'REJECTED' as const,
              reviewedBy: approverName,
              reviewedDate: now,
              reviewNotes: reason,
            }
          : c
      );

      // Revert transaction status
      const nextTx = current.transactions.map((t) =>
        t.id === req.transactionId ? { ...t, status: 'POSTED' as const } : t
      );

      writeStore({
        ...current,
        corrections: nextCorrections,
        transactions: nextTx,
      });

      addAudit({
        user: approverName,
        userRole: 'MD',
        action: 'REJECT',
        entity: 'CORRECTION_REQUEST',
        entityId: requestId,
        description: `Rejected correction for transaction ${req.transactionId}. Reason: ${reason}`,
      });
    },
    [addAudit]
  );

  // Generic Master Data CRUD (for Manager & Admin)
  const saveMasterItem = useCallback(
    <K extends keyof StoreState>(
      entityKey: K,
      item: any,
      idField = 'id',
      actorName = 'Manager',
      actorRole: 'MANAGER' | 'ADMIN' = 'MANAGER'
    ) => {
      const current = readStore();
      const list = current[entityKey] as any[];
      const exists = list.some((x) => x[idField] === item[idField]);
      const nextList = exists
        ? list.map((x) => (x[idField] === item[idField] ? item : x))
        : [item, ...list];

      writeStore({
        ...current,
        [entityKey]: nextList,
      });

      addAudit({
        user: actorName,
        userRole: actorRole,
        action: exists ? 'UPDATE' : 'CREATE',
        entity: String(entityKey).toUpperCase(),
        entityId: item[idField],
        description: `${exists ? 'Updated' : 'Created'} ${String(entityKey).slice(0, -1)}: ${item.name || item.registration || item[idField]}`,
      });
    },
    [addAudit]
  );

  const deleteMasterItem = useCallback(
    <K extends keyof StoreState>(
      entityKey: K,
      id: string,
      idField = 'id',
      actorName = 'Manager',
      actorRole: 'MANAGER' | 'ADMIN' = 'MANAGER'
    ) => {
      const current = readStore();
      const list = current[entityKey] as any[];
      const target = list.find((x) => x[idField] === id);
      const nextList = list.filter((x) => x[idField] !== id);

      writeStore({
        ...current,
        [entityKey]: nextList,
      });

      addAudit({
        user: actorName,
        userRole: actorRole,
        action: 'DELETE',
        entity: String(entityKey).toUpperCase(),
        entityId: id,
        description: `Deleted ${String(entityKey).slice(0, -1)}: ${target?.name || target?.registration || id}`,
      });
    },
    [addAudit]
  );

  const resetToDefaults = useCallback(() => {
    writeStore(defaultState);
  }, []);

  return {
    ...state,
    createTrip,
    updateTripStatus,
    createCustomer,
    createInvoice,
    recordCustomerPayment,
    recordWorkerWage,
    recordDiesel,
    recordVehicleExpense,
    recordOtherExpense,
    recordAccountTransfer,
    requestCorrection,
    approveCorrection,
    rejectCorrection,
    saveMasterItem,
    deleteMasterItem,
    addAudit,
    resetToDefaults,
  };
}
