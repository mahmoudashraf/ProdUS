'use client';

import React, { ReactNode } from 'react';
import ThemeCustomization from 'themes';

// ==============================|| MIGRATION THEME WRAPPER ||============================== //

interface MigrationThemeWrapperProps {
  children: ReactNode;
}

const MigrationThemeWrapper: React.FC<MigrationThemeWrapperProps> = ({ children }) => {
  return <ThemeCustomization>{children}</ThemeCustomization>;
};

export default MigrationThemeWrapper;
