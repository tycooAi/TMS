'use client';

import React from 'react';
import { AppShell } from '../../components/layout/AppShell';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell portal="manager" portalName="Manager Portal">
      {children}
    </AppShell>
  );
}
