'use client';

import React, { useEffect } from 'react';
import { SupabaseAuthProvider } from './SupabaseAuthContext';
import { authConfig } from '@/config/authConfig';

interface AuthProviderWrapperProps {
  children: React.ReactNode;
}

const MockAuthProviderComponent = React.lazy(() =>
  import('./dev/MockAuthProvider').then(module => ({
    default: module.MockAuthProvider,
  }))
);

/**
 * Conditional Auth Provider Wrapper
 * Uses MockAuthProvider in development mode with mock auth enabled
 * Uses SupabaseAuthProvider in production or when mock auth is disabled
 */
export const AuthProviderWrapper: React.FC<AuthProviderWrapperProps> = ({ children }) => {
  const shouldUseMockAuth = authConfig.shouldUseMockAuth();

  // Initialize API client with conditional mock interceptors
  useEffect(() => {
    // Dynamic import to avoid bundling dev code in production
    if (shouldUseMockAuth) {
      import('@/lib/api-client-init').then(({ initializeApiClient }) => {
        initializeApiClient();
      });
    }
  }, [shouldUseMockAuth]);

  // In development mode with mock auth enabled, use MockAuthProvider
  if (shouldUseMockAuth) {
    return (
      <React.Suspense fallback={null}>
        <MockAuthProviderComponent>
          {children}
        </MockAuthProviderComponent>
      </React.Suspense>
    );
  }

  // Production mode - use Supabase authentication
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
};
