'use client';

// PROJECT IMPORTS
import { usePathname } from 'next/navigation';
import PublicPlatformShell from '@/features/platform/PublicPlatformShell';
import useAuth from '@/hooks/useAuth';
import DashboardLayout from 'layout/MainLayout';
import AuthGuard from 'utils/route-guard/AuthGuard';

// ==============================|| DASHBOARD LAYOUT ||============================== //

const publicDiscoveryRoutes = ['/catalog', '/services', '/teams', '/solo-experts'];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const { isLoading, isLoggedIn } = useAuth();
  const isPublicDiscoveryRoute = publicDiscoveryRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicDiscoveryRoute && !isLoading && !isLoggedIn) {
    return <PublicPlatformShell>{children}</PublicPlatformShell>;
  }

  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
