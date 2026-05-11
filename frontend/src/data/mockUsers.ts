// Mock user data for testing
export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'PRODUCT_OWNER' | 'TEAM_MANAGER' | 'SPECIALIST' | 'ADVISOR';
  supabaseId: string;
  avatar?: string;
  phone?: string;
  isActive: boolean;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: '7128999e-576f-42a2-9495-01ecffe9f8a6',
    email: 'admin@produs.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    supabaseId: 'mock-supabase-mock-admin-001',
    avatar: 'https://i.pravatar.cc/150?img=1',
    phone: '+1-555-0101',
    isActive: true,
  },
  {
    id: 'f0d02ae4-6b4e-4aa1-b2c1-f1c7c567a001',
    email: 'owner@produs.com',
    firstName: 'Product',
    lastName: 'Owner',
    role: 'PRODUCT_OWNER',
    supabaseId: 'mock-supabase-mock-owner-001',
    isActive: true,
  },
  {
    id: 'f0d02ae4-6b4e-4aa1-b2c1-f1c7c567a002',
    email: 'team@produs.com',
    firstName: 'Team',
    lastName: 'Manager',
    role: 'TEAM_MANAGER',
    supabaseId: 'mock-supabase-mock-team-001',
    isActive: true,
  },
  {
    id: 'f0d02ae4-6b4e-4aa1-b2c1-f1c7c567a003',
    email: 'specialist@produs.com',
    firstName: 'Service',
    lastName: 'Specialist',
    role: 'SPECIALIST',
    supabaseId: 'mock-supabase-mock-specialist-001',
    isActive: true,
  },
  {
    id: 'f0d02ae4-6b4e-4aa1-b2c1-f1c7c567a004',
    email: 'advisor@produs.com',
    firstName: 'Platform',
    lastName: 'Advisor',
    role: 'ADVISOR',
    supabaseId: 'mock-supabase-mock-advisor-001',
    isActive: true,
  },
];

// Helper functions
export const getMockUserByRole = (role: MockUser['role']): MockUser | undefined => {
  return MOCK_USERS.find(user => user.role === role);
};

export const getMockUserByEmail = (email: string): MockUser | undefined => {
  return MOCK_USERS.find(user => user.email === email);
};

// Mock authentication tokens (for testing purposes)
export const MOCK_TOKENS = {
  admin: 'mock-token-admin-001',
  owner: 'mock-token-owner-001',
  team: 'mock-token-team-001',
};

// Mock login credentials
export const MOCK_CREDENTIALS = {
  admin: { email: 'admin@produs.com', password: 'admin123' },
  owner: { email: 'owner@produs.com', password: 'owner123' },
  team: { email: 'team@produs.com', password: 'team123' },
  specialist: { email: 'specialist@produs.com', password: 'specialist123' },
  advisor: { email: 'advisor@produs.com', password: 'advisor123' },
};
