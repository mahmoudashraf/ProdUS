'use client';

import NetworkChrome from '@/features/expert-network/NetworkChrome';
import AuthGuard from '@/utils/route-guard/AuthGuard';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <NetworkChrome>{children}</NetworkChrome>
    </AuthGuard>
  );
}
