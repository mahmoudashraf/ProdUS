// material-ui
import { Avatar, Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// project imports
import { IconMenu2 } from '@tabler/icons-react';

import { LAYOUT_CONST } from 'constant';
import useConfig from 'hooks/useConfig';
// Using Context API
import { useMenuState, useMenuActions } from 'contexts/MenuContext';

import LogoSection from '../LogoSection';

import MobileSection from './MobileSection';
import NotificationSection from './NotificationSection';
import ProfileSection from './ProfileSection';
import SearchSection from './SearchSection';

// assets

// ==============================|| MAIN NAVBAR / HEADER ||============================== //

const Header = () => {
  const theme = useTheme();

  // Using Context API
  const { drawerOpen } = useMenuState();
  const { setDrawerOpen } = useMenuActions();

  const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));
  const { layout } = useConfig();

  return (
    <>
      {/* logo & toggler button */}
      <Box
        sx={{
          width: 228,
          display: 'flex',
          [theme.breakpoints.down('md')]: {
            width: 'auto',
          },
        }}
      >
        <Box component="span" sx={{ display: { xs: 'none', md: 'block' }, flexGrow: 1 }}>
          <LogoSection />
        </Box>
        {(layout === LAYOUT_CONST.VERTICAL_LAYOUT ||
          (layout === LAYOUT_CONST.HORIZONTAL_LAYOUT && matchDownMd)) && (
          <Avatar
            component="div"
            variant="rounded"
            sx={{
              ...theme.typography.commonAvatar,
              ...theme.typography.mediumAvatar,
              overflow: 'hidden',
              transition: 'all .2s ease-in-out',
              background: '#fff',
              color: theme.palette.primary.main,
              border: '1px solid #dbe4f0',
              '&:hover': {
                background: '#f1efff',
                color: theme.palette.primary.main,
              },
            } as any}
            onClick={() => setDrawerOpen(!drawerOpen)}
            color="inherit"
          >
            <IconMenu2 stroke={1.5} size="20px" />
          </Avatar>
        )}
      </Box>

      {/* header search */}
      <SearchSection />
      <Box sx={{ flexGrow: 1 }} />

      {/* notification */}
      <NotificationSection />

      {/* profile */}
      <ProfileSection />

      {/* mobile header */}
      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
        <MobileSection />
      </Box>
    </>
  );
};

export default Header;
