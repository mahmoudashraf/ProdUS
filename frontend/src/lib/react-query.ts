import { QueryClient } from '@tanstack/react-query';

// Query client configuration following project guidelines
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Consider cached data fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache data for 10 minutes when inactive
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay with exponential backoff
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus (disable for development)
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // Retry delay
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  user: {
    all: ['user'] as const,
    current: () => [...queryKeys.user.all, 'current'] as const,
  },

  catalog: {
    all: ['catalog'] as const,
    categories: () => [...queryKeys.catalog.all, 'categories'] as const,
    modules: () => [...queryKeys.catalog.all, 'modules'] as const,
    dependencies: (moduleId: string) => [...queryKeys.catalog.all, 'dependencies', moduleId] as const,
  },

  products: {
    all: ['products'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.products.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.products.all, 'detail', id] as const,
  },

  requirements: {
    all: ['requirements'] as const,
    list: () => [...queryKeys.requirements.all, 'list'] as const,
  },

  packages: {
    all: ['packages'] as const,
    list: () => [...queryKeys.packages.all, 'list'] as const,
  },

  teams: {
    all: ['teams'] as const,
    list: () => [...queryKeys.teams.all, 'list'] as const,
  },

  workspaces: {
    all: ['workspaces'] as const,
    list: () => [...queryKeys.workspaces.all, 'list'] as const,
  },

  recommendations: {
    all: ['recommendations'] as const,
    list: () => [...queryKeys.recommendations.all, 'list'] as const,
  },
} as const;

// Error handling utilities
export const handleQueryError = (error: unknown) => {
  console.error('Query error:', error);
  
  // Return a user-friendly error message
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// Cache invalidation utilities
export const queryKeysUtils = {
  invalidateUser: () => queryClient.invalidateQueries({ queryKey: queryKeys.user.all }),
  invalidateCatalog: () => queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all }),
  invalidateProducts: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  invalidateRequirements: () => queryClient.invalidateQueries({ queryKey: queryKeys.requirements.all }),
  invalidatePackages: () => queryClient.invalidateQueries({ queryKey: queryKeys.packages.all }),
  invalidateTeams: () => queryClient.invalidateQueries({ queryKey: queryKeys.teams.all }),
  invalidateWorkspaces: () => queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all }),
  invalidateRecommendations: () => queryClient.invalidateQueries({ queryKey: queryKeys.recommendations.all }),
};
