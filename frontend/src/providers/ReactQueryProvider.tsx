'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { queryClient } from '../lib/react-query';

// Provider wrapper for React Query
export const ReactQueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showDevtools = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS === 'true';

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {showDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default ReactQueryProvider;
