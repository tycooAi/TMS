export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num || 0);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function calculateTripKM(startKm?: number, endKm?: number): number {
  if (startKm === undefined || endKm === undefined) return 0;
  return Math.max(0, endKm - startKm);
}

export function calculateDieselMileage(distanceKm: number, litres: number): number {
  if (!litres || litres <= 0) return 0;
  return Number((distanceKm / litres).toFixed(2));
}

export function calculateNetWage(
  salary: number,
  advance: number,
  deduction: number,
  paid: number
): { netPayable: number; balanceDue: number } {
  const netPayable = Math.max(0, salary - advance - deduction);
  const balanceDue = Math.max(0, netPayable - paid);
  return { netPayable, balanceDue };
}

export function calculateInvoiceTotals(
  subtotal: number,
  gstRatePercent: number = 5
): { gstAmount: number; totalAmount: number } {
  const gstAmount = Math.round((subtotal * gstRatePercent) / 100);
  const totalAmount = subtotal + gstAmount;
  return { gstAmount, totalAmount };
}
