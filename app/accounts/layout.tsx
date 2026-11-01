'use client';

import React from 'react';
import { AppShell } from '../../components/layout/AppShell';

export default function AccountsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell portal="accounts" portalName="Accounts Portal">
      {children}
    </AppShell>
  );
}
