'use client';

import { useState } from 'react';
import { ArrowForwardOutlined, Groups2Outlined, SearchOutlined } from '@mui/icons-material';
import { Box, Button, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { EmptyState, PastelChip, ProgressRing, SectionTitle, StatusChip, Surface, appleColors } from './PlatformComponents';
import { packageScore, servicePlanStatusAccent } from './servicePlanBuilderConfig';
import type { PackageInstance } from './types';

export default function TeamMatchPlanPickerPanel({
  packageList,
  onChoosePlan,
}: {
  packageList: PackageInstance[];
  onChoosePlan: (packageId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const matchingPackages = normalizedQuery
    ? packageList.filter((item) =>
        [
          item.name,
          item.summary,
          item.status,
          item.productProfile?.name,
          item.productProfile?.summary,
        ].some((value) => (value || '').toLowerCase().includes(normalizedQuery))
      )
    : packageList;
  const visibleLimit = normalizedQuery ? 12 : 8;
  const visiblePackages = matchingPackages.slice(0, visibleLimit);
  const hiddenCount = Math.max(0, matchingPackages.length - visiblePackages.length);
  const readyCount = packageList.filter((item) => item.status === 'AWAITING_TEAM' || item.status === 'SCOPE_NEGOTIATION').length;

  return (
    <Stack spacing={2.5}>
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f7fdff 100%)' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 320px' }, gap: 2.5, alignItems: 'center' }}>
          <Stack spacing={1.5} sx={{ minWidth: 0 }}>
            <Box sx={{ alignSelf: 'flex-start' }}>
              <PastelChip label="Team match setup" accent={appleColors.cyan} bg="#e4f9fd" />
            </Box>
            <Box>
              <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 40 }, letterSpacing: 0, overflowWrap: 'anywhere' }}>
                Choose a service plan to match
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 760, fontSize: 16, lineHeight: 1.7 }}>
                Team recommendations depend on the selected service path. Pick one plan first, then compare delivery teams in focused internal views.
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
            <PickerMetric label="Service plans" value={packageList.length} accent={appleColors.cyan} />
            <PickerMetric label="Ready to match" value={readyCount} accent={readyCount ? appleColors.green : appleColors.amber} />
          </Box>
        </Box>
      </Surface>

      <Surface>
        <SectionTitle title="Start With A Plan" action={<PastelChip label="No auto-selected plan" accent={appleColors.cyan} bg="#e4f9fd" />} />
        {packageList.length ? (
          <Stack spacing={1.25}>
            <TextField
              size="small"
              fullWidth
              label="Search service plans"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            {visiblePackages.length ? (
              <>
                {visiblePackages.map((item) => (
                  <TeamMatchPlanRow key={item.id} item={item} onOpen={() => onChoosePlan(item.id)} />
                ))}
                <Box sx={{ p: 1.25, border: '1px dashed', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fbfdff' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                    {hiddenCount
                      ? `Showing ${visiblePackages.length} ${normalizedQuery ? 'matching' : 'visible'} service plans. ${hiddenCount} more ${normalizedQuery ? 'matches are hidden; refine the search to narrow them' : 'plans are available through search'}.`
                      : normalizedQuery
                        ? `Showing all ${visiblePackages.length} matching service plans.`
                        : 'Showing the visible service plans first.'}
                  </Typography>
                </Box>
              </>
            ) : (
              <EmptyState label="No service plans match that search." />
            )}
          </Stack>
        ) : (
          <EmptyState label="No service plans are ready for team matching yet. Create or approve a product plan first." />
        )}
      </Surface>
    </Stack>
  );
}

function PickerMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <Box sx={{ minWidth: 0, p: 1.25, border: '1px solid', borderColor: `${accent}30`, borderRadius: 1, bgcolor: `${accent}0d` }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ mt: 0.25, fontWeight: 950, fontSize: { xs: 22, md: 26 }, color: appleColors.ink }}>
        {value}
      </Typography>
    </Box>
  );
}

function TeamMatchPlanRow({
  item,
  onOpen,
}: {
  item: PackageInstance;
  onOpen: () => void;
}) {
  const accent = servicePlanStatusAccent(item.status);
  const score = packageScore(item);

  return (
    <Button
      variant="outlined"
      onClick={onOpen}
      sx={{
        justifyContent: 'stretch',
        textAlign: 'left',
        whiteSpace: 'normal',
        minHeight: 104,
        borderRadius: 1,
        px: { xs: 1.25, md: 1.5 },
        py: 1.25,
        borderColor: appleColors.line,
        color: appleColors.ink,
        bgcolor: '#fff',
        '&:hover': { borderColor: `${accent}55`, bgcolor: '#fbfdff' },
      }}
    >
      <Box sx={{ width: '100%', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '76px minmax(0, 1fr) auto' }, gap: 1.5, alignItems: { xs: 'flex-start', md: 'center' } }}>
        <ProgressRing value={score || 58} size={64} color={accent} label="/100" />
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            <StatusChip label={item.status} />
            {item.productProfile?.name && <PastelChip label={item.productProfile.name} accent={accent} bg={`${accent}10`} />}
          </Stack>
          <Typography variant="h4" sx={{ mt: 0.75, overflowWrap: 'anywhere' }}>
            {item.name}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{
              mt: 0.35,
              lineHeight: 1.55,
              maxWidth: 820,
              display: '-webkit-box',
              WebkitLineClamp: { xs: 4, md: 2 },
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.summary || 'Choose this plan to compare verified delivery teams.'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ justifySelf: { md: 'end' }, color: accent, fontWeight: 950 }}>
          <Groups2Outlined fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 950 }}>
            Match teams
          </Typography>
          <ArrowForwardOutlined fontSize="small" />
        </Stack>
      </Box>
    </Button>
  );
}
