'use client';

import { ManagerMasterPage } from '../../../components/manager/ManagerMasterPage';

export default function ManagerLocationsPage() {
  return (
    <ManagerMasterPage
      entityKey="locations"
      title="Loading & Delivery Locations"
      description="Quarries, crusher yards, customer sites and one-way route distances"
      idField="id"
      prefix="LOC"
      fields={[
        { key: 'name', label: 'Location Name' },
        {
          key: 'type',
          label: 'Location Type',
          type: 'select',
          options: ['Quarry', 'Crusher', 'Site', 'Yard'],
        },
        { key: 'distanceKm', label: 'One-Side Distance (KM)', type: 'number' },
      ]}
    />
  );
}
