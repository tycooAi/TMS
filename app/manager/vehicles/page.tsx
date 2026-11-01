'use client';

import { ManagerMasterPage } from '../../../components/manager/ManagerMasterPage';

export default function ManagerVehiclesPage() {
  return (
    <ManagerMasterPage
      entityKey="vehicles"
      title="Fleet Vehicles"
      description="Manage owned and rented tippers, payload capacities, and compliance expiry dates"
      idField="registration"
      prefix="VEH"
      fields={[
        { key: 'type', label: 'Vehicle Type', type: 'select', options: ['Tipper', 'Trailer', 'Heavy Truck', 'Tanker'] },
        { key: 'ownership', label: 'Ownership', type: 'select', options: ['OWN', 'RENTED'] },
        { key: 'capacity', label: 'Capacity (e.g. 18 Ton)' },
        { key: 'fuelCapacity', label: 'Fuel Tank (e.g. 180 L)' },
        { key: 'currentKm', label: 'Current Odometer KM', type: 'number' },
        { key: 'assignedDriverName', label: 'Assigned Driver' },
        { key: 'fcExpiry', label: 'FC Expiry Date' },
        { key: 'insuranceExpiry', label: 'Insurance Expiry Date' },
        { key: 'permitExpiry', label: 'Permit Expiry Date' },
      ]}
    />
  );
}
