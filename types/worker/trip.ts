export type TripStatus = 'Draft' | 'Submitted' | 'Loaded' | 'Running' | 'Delivered';

export interface Trip {
  id: string;
  businessDate: string;
  entryTime: string;
  enteredBy: string;
  status: TripStatus;
  progress: number;

  // Customer
  customerId?: string;
  customerName?: string;
  customerNumber?: string;
  customerPhone?: string;
  customerAddress?: string;

  // Vehicle
  vehicleRegistration?: string;
  vehicleType?: string;
  vehicleOwnership?: 'Own' | 'Rented';
  vehicleCapacity?: string;
  vehicleCurrentKm?: number;

  // Driver
  driverId?: string;
  driverName?: string;
  driverPhone?: string;

  // Load & Source
  material?: string;
  quantity?: number;
  unit?: 'Ton' | 'CFT' | 'Load';
  source?: string;
  sourceBillNumber?: string;
  loadingLocation?: string;
  loadingDate?: string;
  loadingTime?: string;

  // Delivery
  deliveryLocation?: string;
  expectedDeliveryDate?: string;
  expectedDeliveryTime?: string;
  actualDeliveryDate?: string;
  actualDeliveryTime?: string;
  unloadQuantity?: number;
  deliveryNotes?: string;

  // Rate (Read-Only)
  appliedRate: number;
  rateUnit: 'Ton' | 'CFT' | 'Load';
  rateSource: string;

  // Extra status timestamps
  departureTime?: string;
  tripNotes?: string;
}
