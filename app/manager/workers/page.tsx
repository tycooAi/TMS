'use client';

import { ManagerMasterPage } from '../../../components/manager/ManagerMasterPage';

export default function ManagerWorkersPage() {
  return (
    <ManagerMasterPage
      entityKey="workers"
      title="Workforce & Employees"
      description="Manage operators, drivers and yard personnel · Permissions and roles are strictly controlled"
      idField="id"
      prefix="WRK"
      fields={[
        { key: 'name', label: 'Employee Name' },
        { key: 'phone', label: 'Mobile Phone' },
        { key: 'email', label: 'Email' },
        {
          key: 'role',
          label: 'Designation Role',
          type: 'select',
          options: ['Data Entry Operator', 'Driver', 'Supervisor', 'Yard Staff'],
        },
        { key: 'assignedLocation', label: 'Work Location' },
      ]}
    />
  );
}
