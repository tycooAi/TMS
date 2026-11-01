'use client';

import React from 'react';
import { AppShell } from '../../components/layout/AppShell';

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell portal="worker" portalName="Worker Portal">
      {children}
    </AppShell>
  );
}
