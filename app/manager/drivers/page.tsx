'use client';

import { ManagerMasterPage } from '../../../components/manager/ManagerMasterPage';

export default function ManagerDriversPage() {
  return (
    <ManagerMasterPage
      entityKey="drivers"
      title="Driver Roster"
      description="Manage licensed commercial drivers, contact numbers, and vehicle assignments"
      idField="id"
      prefix="DRV"
      fields={[
        { key: 'name', label: 'Driver Name' },
        { key: 'phone', label: 'Mobile Phone' },
        { key: 'licenseNumber', label: 'Commercial License No' },
        { key: 'assignedVehicle', label: 'Assigned Vehicle Reg' },
      ]}
    />
  );
}
