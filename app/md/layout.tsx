'use client';

import React from 'react';
import { AppShell } from '../../components/layout/AppShell';

export default function MdLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell portal="md" portalName="Managing Director Portal">
      {children}
    </AppShell>
  );
}
