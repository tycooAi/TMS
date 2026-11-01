'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentSession, getPortalUrl } from '../lib/auth';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getCurrentSession();
    if (session) {
      router.replace(getPortalUrl(session.role));
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7fa] text-xs font-semibold text-[#5A6E7F]">
      Loading Translogix Transportation Management System…
    </div>
  );
}
