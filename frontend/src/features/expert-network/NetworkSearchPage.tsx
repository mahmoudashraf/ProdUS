'use client';

import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowForward, ExploreOutlined } from '@mui/icons-material';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  EmptyState,
  PageHeader,
  PastelChip,
  QueryState,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from '@/features/platform/PlatformComponents';
import { networkApi } from './api';

export function NetworkSearchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQuery = params?.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);
  const results = useQuery({
    queryKey: ['network', 'search', initialQuery],
    queryFn: () => networkApi.search(initialQuery),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(`/expert-network/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <Stack spacing={3}>
      <PageHeader title="Network Search" description="Search experts, teams, formation posts, service channels, and community answers from one place." />
      <Box component="form" onSubmit={submit}>
        <Surface>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField fullWidth label="Search Network" value={query} onChange={(event) => setQuery(event.target.value)} />
            <Button type="submit" variant="contained" startIcon={<ExploreOutlined />} sx={{ minHeight: 52, minWidth: 150 }}>
              Search
            </Button>
          </Stack>
        </Surface>
      </Box>
      <QueryState isLoading={results.isLoading} error={results.error} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, 1fr)' }, gap: 2 }}>
        {(results.data?.results || []).map((result) => (
          <Surface key={`${result.resultType}-${result.id}`}>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: result.accent || appleColors.purple, mt: 0.75, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h3">{result.title}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>{result.description || 'Network result'}</Typography>
                </Box>
              </Stack>
              <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center">
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <StatusChip label={formatLabel(result.resultType)} />
                  {result.meta && <PastelChip label={formatLabel(result.meta)} accent={result.accent || appleColors.cyan} />}
                </Stack>
                <Button component={NextLink} href={result.href} endIcon={<ArrowForward />}>Open</Button>
              </Stack>
            </Stack>
          </Surface>
        ))}
      </Box>
      {!results.data?.results?.length && (
        <EmptyState label={initialQuery ? 'No matching experts, teams, posts, or channels found.' : 'Start with a service, skill, team, or delivery question.'} />
      )}
    </Stack>
  );
}
