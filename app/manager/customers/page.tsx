'use client';

import { ManagerMasterPage } from '../../../components/manager/ManagerMasterPage';

export default function ManagerCustomersPage() {
  return (
    <ManagerMasterPage
      entityKey="customers"
      title="Shared Customer Master"
      description="Manage verified customer accounts · Phone duplicate protection is enforced"
      idField="id"
      prefix="CUS"
      fields={[
        { key: 'name', label: 'Customer Name' },
        { key: 'phone', label: 'Primary Phone' },
        { key: 'alternatePhone', label: 'Alternate Contact' },
        { key: 'address', label: 'Address' },
        { key: 'gstin', label: 'GSTIN' },
        {
          key: 'creditTerms',
          label: 'Credit Terms',
          type: 'select',
          options: ['Immediate', '7 Days', '15 Days', '30 Days', '45 Days'],
        },
      ]}
    />
  );
}
