import { Typography, Stack } from '@mui/material';

const AuthFooter = () => (
  <Stack
    direction={{ xs: 'column', sm: 'row' }}
    justifyContent="space-between"
    alignItems={{ xs: 'center', sm: 'center' }}
    spacing={1}
    sx={{ width: '100%', maxWidth: 1120, mx: 'auto' }}
  >
    <Typography variant="subtitle2">
      ProdUS Platform
    </Typography>
    <Typography variant="subtitle2">
      Productization collaboration
    </Typography>
  </Stack>
);

export default AuthFooter;
