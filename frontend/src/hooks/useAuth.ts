import { useContext } from 'react';

import { SupabaseAuthContext } from 'contexts/SupabaseAuthContext';

// ==============================|| AUTH HOOKS ||============================== //

const useAuth = () => {
  const context = useContext(SupabaseAuthContext);

  if (!context) throw new Error('context must be use inside provider');

  return context;
};

export default useAuth;
