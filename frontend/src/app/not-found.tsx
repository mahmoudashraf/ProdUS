import { Stack, Typography } from '@mui/material';

export default function NotFound() {
  return (
    <Stack minHeight="100vh" alignItems="center" justifyContent="center" spacing={1}>
      <Typography variant="h2">Page not found</Typography>
      <Typography color="text.secondary">The requested ProdUS page does not exist.</Typography>
    </Stack>
  );
}
