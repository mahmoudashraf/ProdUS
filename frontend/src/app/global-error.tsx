'use client';

import { Button, Stack, Typography } from '@mui/material';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <Stack minHeight="100vh" alignItems="center" justifyContent="center" spacing={2}>
          <Typography variant="h2">Something went wrong</Typography>
          <Button variant="contained" onClick={reset}>
            Try again
          </Button>
        </Stack>
      </body>
    </html>
  );
}
