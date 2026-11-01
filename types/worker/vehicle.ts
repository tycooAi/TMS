export interface Vehicle {
  registrationNumber: string;
  vehicleType: string;
  ownership: 'Own' | 'Rented';
  capacity: string;
  fuelCapacity?: string;
  currentKm: number;
  status: 'Available' | 'Running' | 'Maintenance';
}
