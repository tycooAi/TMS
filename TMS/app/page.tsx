'use client';

import { useEffect, useState } from 'react';
import { getCurrentSession, getPortalUrl } from '../lib/auth';

export default function RootPage() {
  const [targetUrl, setTargetUrl] = useState<string>('/login');

  useEffect(() => {
    const session = getCurrentSession();
    const dest = session ? getPortalUrl(session.role) : '/login';
    setTargetUrl(dest);
    window.location.href = dest;
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f7fa] text-xs font-semibold text-[#5A6E7F] gap-3">
      <div className="w-7 h-7 border-2 border-[#16425B] border-t-[#81C4D7] rounded-full animate-spin"></div>
      <p>Redirecting to SRI AMMAN ARUL TRANSPORTS...</p>
      <a
        href={targetUrl}
        className="text-[#2F668F] underline text-[11px] mt-1"
      >
        Click here if you are not automatically redirected
      </a>
    </div>
  );
}
