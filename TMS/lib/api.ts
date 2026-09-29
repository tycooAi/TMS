/**
 * TransFlow TMS - Unified Backend API Client
 * Connects Next.js Frontend to Spring Boot REST API (http://localhost:8080/api/v1)
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
export const TOKEN_KEY = 'tms_jwt_token';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401) {
    removeAuthToken();
  }

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const parsed = JSON.parse(errorBody);
      errorMessage = parsed.message || parsed.error || errorMessage;
    } catch {
      if (errorBody) errorMessage = errorBody;
    }
    throw new Error(errorMessage);
  }

  // If 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  // Authentication
  auth: {
    login: async (usernameOrEmail: string, password: string) => {
      const data = await fetchWithAuth<{
        token: string;
        tokenType: string;
        username: string;
        fullName: string;
        email: string;
        role: string;
        employeeId: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail, password }),
      });
      if (data && data.token) {
        setAuthToken(data.token);
      }
      return data;
    },
    getCurrentUser: () => fetchWithAuth<any>('/auth/me'),
    getRoles: () => fetchWithAuth<any[]>('/auth/roles'),
  },

  // Master Data
  master: {
    getCustomers: () => fetchWithAuth<any[]>('/customers'),
    createCustomer: (data: any) => fetchWithAuth<any>('/customers', { method: 'POST', body: JSON.stringify(data) }),
    getVehicles: () => fetchWithAuth<any[]>('/vehicles'),
    createVehicle: (data: any) => fetchWithAuth<any>('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
    getDrivers: () => fetchWithAuth<any[]>('/drivers'),
    createDriver: (data: any) => fetchWithAuth<any>('/drivers', { method: 'POST', body: JSON.stringify(data) }),
    getSources: () => fetchWithAuth<any[]>('/sources'),
    getMaterials: () => fetchWithAuth<any[]>('/materials'),
    getLocations: () => fetchWithAuth<any[]>('/locations'),
    getRates: () => fetchWithAuth<any[]>('/rates'),
    createRate: (data: any) => fetchWithAuth<any>('/rates', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Trips
  trips: {
    getAll: () => fetchWithAuth<any[]>('/trips'),
    getById: (id: string) => fetchWithAuth<any>(`/trips/${id}`),
    create: (tripData: any) => fetchWithAuth<any>('/trips', { method: 'POST', body: JSON.stringify(tripData) }),
    update: (id: string, tripData: any) => fetchWithAuth<any>(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(tripData) }),
    updateStatus: (id: string, status: string, comment?: string) =>
      fetchWithAuth<any>(`/trips/${id}/status?status=${encodeURIComponent(status)}${comment ? `&comment=${encodeURIComponent(comment)}` : ''}`, { method: 'PATCH' }),
  },

  // Governance & Approvals
  governance: {
    requestCorrection: (correctionData: any) =>
      fetchWithAuth<any>('/approvals/correction-requests', { method: 'POST', body: JSON.stringify(correctionData) }),
    getPendingCorrections: () => fetchWithAuth<any[]>('/approvals/pending'),
    approveCorrection: (id: string, comments: string = 'Approved') =>
      fetchWithAuth<any>(`/approvals/${id}/approve`, { method: 'POST', body: JSON.stringify({ comments }) }),
    rejectCorrection: (id: string, comments: string) =>
      fetchWithAuth<any>(`/approvals/${id}/reject`, { method: 'POST', body: JSON.stringify({ comments }) }),
  },

  // Finance & Ledger
  finance: {
    getInvoices: () => fetchWithAuth<any[]>('/invoices'),
    generateInvoice: (invoiceData: any) =>
      fetchWithAuth<any>('/invoices', { method: 'POST', body: JSON.stringify(invoiceData) }),
    getPayments: () => fetchWithAuth<any[]>('/payments'),
    recordPayment: (paymentData: any) =>
      fetchWithAuth<any>('/payments', { method: 'POST', body: JSON.stringify(paymentData) }),
    reversePayment: (id: string, reason: string) =>
      fetchWithAuth<any>(`/payments/${id}/reverse`, { method: 'POST', body: JSON.stringify({ reason }) }),
    getLedger: () => fetchWithAuth<any[]>('/ledger/transactions'),
    getAccounts: () => fetchWithAuth<any[]>('/accounts'),
    createContraTransfer: (transferData: any) =>
      fetchWithAuth<any>('/accounts/contra-transfer', { method: 'POST', body: JSON.stringify(transferData) }),
    getDieselRecords: () => fetchWithAuth<any[]>('/fleet-expenses/diesel'),
    recordDiesel: (dieselData: any) =>
      fetchWithAuth<any>('/fleet-expenses/diesel', { method: 'POST', body: JSON.stringify(dieselData) }),
  },

  // Dashboards & Analytics
  dashboard: {
    getMdCockpit: () => fetchWithAuth<any>('/dashboards/md-cockpit'),
    getTruckProfitability: () => fetchWithAuth<any[]>('/dashboards/truck-profitability'),
    getAccountsPosition: () => fetchWithAuth<any>('/dashboards/accounts-position'),
  },

  // Audit Logs
  audit: {
    getLogs: () => fetchWithAuth<any[]>('/audit-logs'),
  },

  // Convenience Endpoints for Portal Operations
  vehicles: {
    getAll: () => fetchWithAuth<any[]>('/vehicles'),
    create: (data: any) => fetchWithAuth<any>('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  },
  drivers: {
    getAll: () => fetchWithAuth<any[]>('/drivers'),
    create: (data: any) => fetchWithAuth<any>('/drivers', { method: 'POST', body: JSON.stringify(data) }),
  },
  customers: {
    getAll: () => fetchWithAuth<any[]>('/customers'),
    create: (data: any) => fetchWithAuth<any>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  },
  approvals: {
    getPending: () => fetchWithAuth<any[]>('/approvals/pending'),
    approve: (id: string, comments: string = 'Approved') =>
      fetchWithAuth<any>(`/approvals/${id}/approve`, { method: 'POST', body: JSON.stringify({ comments }) }),
    reject: (id: string, comments: string) =>
      fetchWithAuth<any>(`/approvals/${id}/reject`, { method: 'POST', body: JSON.stringify({ comments }) }),
    submitCorrectionRequest: (data: any) =>
      fetchWithAuth<any>('/approvals/correction-requests', { method: 'POST', body: JSON.stringify(data) }),
  },

  // System Control Center & Governance
  system: {
    getStatus: () => fetchWithAuth<{ success: boolean; data: any }>('/system/status'),
    changeState: (payload: {
      systemState: 'ONLINE' | 'MAINTENANCE' | 'SHUTDOWN';
      confirmationText?: string;
      reason?: string;
      maintenanceTitle?: string;
      maintenanceMessage?: string;
      expectedRecoveryTime?: string | null;
      allowAdminBypass?: boolean;
    }) =>
      fetchWithAuth<any>('/system/state', { method: 'POST', body: JSON.stringify(payload) }),
    emergencyToggle: (payload: {
      allowWorkerTrips?: boolean;
      allowAccountsPayments?: boolean;
      lockSensitiveOps?: boolean;
      reason?: string;
    }) =>
      fetchWithAuth<any>('/system/emergency-toggle', { method: 'POST', body: JSON.stringify(payload) }),
    getHealth: () => fetchWithAuth<{ success: boolean; data: any }>('/system/health'),
    getActiveSessions: () => fetchWithAuth<{ success: boolean; data: any[] }>('/system/sessions'),
    getFeatureFlags: () => fetchWithAuth<{ success: boolean; data: any[] }>('/system/features'),
    toggleFeatureFlag: (flagKey: string, enabled: boolean) =>
      fetchWithAuth<any>(`/system/features/${flagKey}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      }),
    getBackups: () => fetchWithAuth<{ success: boolean; data: any[] }>('/system/backups'),
    createBackup: (payload?: { backupType?: string; notes?: string }) =>
      fetchWithAuth<any>('/system/backups/create', { method: 'POST', body: JSON.stringify(payload || {}) }),
    verifyBackup: (id: string) =>
      fetchWithAuth<any>(`/system/backups/${id}/verify`, { method: 'POST', body: JSON.stringify({}) }),
    restoreBackup: (id: string, payload: { confirmationText: string; reason?: string }) =>
      fetchWithAuth<any>(`/system/backups/${id}/restore`, { method: 'POST', body: JSON.stringify(payload) }),
    deleteBackup: (id: string) =>
      fetchWithAuth<any>(`/system/backups/${id}`, { method: 'DELETE' }),
    getBackupSchedules: () => fetchWithAuth<{ success: boolean; data: any[] }>('/system/backups/schedules'),
    updateBackupSchedule: (id: string, payload: any) =>
      fetchWithAuth<any>(`/system/backups/schedules/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    getDownloadUrl: (id: string) => `${API_BASE_URL}/system/backups/${id}/download`,
  },
};

