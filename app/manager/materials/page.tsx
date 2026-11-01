'use client';

import { ManagerMasterPage } from '../../../components/manager/ManagerMasterPage';

export default function ManagerMaterialsPage() {
  return (
    <ManagerMasterPage
      entityKey="materials"
      title="Freight Materials Catalog"
      description="Aggregates, sands, base mixes, and standard commercial freight units"
      idField="id"
      prefix="MAT"
      fields={[
        { key: 'name', label: 'Material Name' },
        { key: 'category', label: 'Category' },
        {
          key: 'standardUnit',
          label: 'Measurement Unit',
          type: 'select',
          options: ['Ton', 'CFT', 'Load'],
        },
      ]}
    />
  );
}
