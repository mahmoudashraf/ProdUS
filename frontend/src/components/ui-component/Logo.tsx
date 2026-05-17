// material-ui
import { Box, Stack, Typography } from '@mui/material';

// ==============================|| PRODUS LOGO ||============================== //

const Logo = () => (
  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: { xs: 44, sm: 170 } }}>
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: 1,
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(135deg, #625cff 0%, #8da2ff 100%)',
        color: '#fff',
        boxShadow: '0 10px 24px rgba(98, 92, 255, 0.24)',
      }}
    >
      <Typography sx={{ fontWeight: 900, fontSize: 21, lineHeight: 1 }}>P</Typography>
    </Box>
    <Box sx={{ lineHeight: 1, display: { xs: 'none', sm: 'block' } }}>
      <Typography sx={{ fontWeight: 800, fontSize: 18, lineHeight: 1.05, color: '#101828' }}>
        ProdOps
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: 12, lineHeight: 1.15, color: '#64748b' }}>
        Network
      </Typography>
    </Box>
  </Stack>
);

export default Logo;
