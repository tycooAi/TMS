'use client';

import { ManagerMasterPage } from '../../../components/manager/ManagerMasterPage';

export default function ManagerCrushersPage() {
  return (
    <ManagerMasterPage
      entityKey="sources"
      title="Crushers & Quarry Sources"
      description="Configure crusher prices per ton and contact persons · Historical trip rates remain preserved"
      idField="id"
      prefix="SRC"
      fields={[
        { key: 'name', label: 'Crusher / Quarry Name' },
        { key: 'location', label: 'Quarry Location' },
        { key: 'contactPerson', label: 'Contact Person' },
        { key: 'phone', label: 'Phone' },
        { key: 'material', label: 'Primary Material' },
        { key: 'pricePerTon', label: 'Base Price per Ton (₹)', type: 'number' },
        { key: 'effectiveFrom', label: 'Effective Date (YYYY-MM-DD)' },
      ]}
    />
  );
}
