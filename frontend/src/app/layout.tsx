import type { Metadata } from 'next';

import './globals.css';

// PROJECT IMPORTS
// Modern Context API Provider - Redux eliminated
import { ReactQueryProvider } from 'providers/ReactQueryProvider';
import { ConfigProvider } from 'contexts/ConfigContext';
import { AuthProviderWrapper } from 'contexts/AuthProviderWrapper';
import { NotificationProvider } from 'contexts/NotificationContext';
import { MenuProvider } from 'contexts/MenuContext';

// UI components
import NavigationScroll from 'layout/NavigationScroll';
import MigrationThemeWrapper from 'layout/MigrationThemeWrapper';
// Note: ThemeCustomization handled by MigrationThemeWrapper
import SnackbarWrapper from 'ui-component/extended/SnackbarWrapper';
import Locales from 'ui-component/Locales';
import RTLLayout from 'ui-component/RTLLayout';
import Notistack from 'ui-component/third-party/Notistack';

const ProviderWrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactQueryProvider>
    <ConfigProvider>
      <MigrationThemeWrapper>
        <RTLLayout>
          <Locales>
            <NavigationScroll>
              <AuthProviderWrapper>
                <NotificationProvider>
                  <Notistack>
                    <SnackbarWrapper />
                    <MenuProvider>
                      {children}
                    </MenuProvider>
                  </Notistack>
                </NotificationProvider>
              </AuthProviderWrapper>
            </NavigationScroll>
          </Locales>
        </RTLLayout>
      </MigrationThemeWrapper>
    </ConfigProvider>
  </ReactQueryProvider>
);

export const metadata: Metadata = {
  title: 'ProdUS Platform',
  description:
    'ProdUS productization collaboration platform.',
};

// ==============================|| ROOT LAYOUT ||============================== //

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ProviderWrapper>{children}</ProviderWrapper>
      </body>
    </html>
  );
}
