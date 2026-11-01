'use client';

import React from 'react';
import { AppShell } from '../../components/layout/AppShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell portal="admin" portalName="System Admin Portal">
      {children}
    </AppShell>
  );
}
