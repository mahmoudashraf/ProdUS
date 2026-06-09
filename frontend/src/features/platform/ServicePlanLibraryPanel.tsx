'use client';

import { ArrowForwardOutlined, PlaylistAddCheckOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { EmptyState, PastelChip, ProgressRing, SectionTitle, StatusChip, Surface, appleColors } from './PlatformComponents';
import { packageScore, servicePlanStatusAccent } from './servicePlanBuilderConfig';
import type { PackageInstance } from './types';

export default function ServicePlanLibraryPanel({
  packageList,
  onOpenPlan,
}: {
  packageList: PackageInstance[];
  onOpenPlan: (packageId: string) => void;
}) {
  const activeCount = packageList.filter((item) => item.status === 'ACTIVE_DELIVERY' || item.status === 'MILESTONE_REVIEW').length;
  const attentionCount = packageList.filter((item) => item.status === 'AWAITING_TEAM' || item.status === 'SCOPE_NEGOTIATION').length;

  return (
    <Stack spacing={2.5}>
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 360px' }, gap: 2.5, alignItems: 'center' }}>
          <Stack spacing={1.5} sx={{ minWidth: 0 }}>
            <Box sx={{ alignSelf: 'flex-start' }}>
              <PastelChip label="Service plan library" accent={appleColors.purple} bg="#f1efff" />
            </Box>
            <Box>
              <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 40 }, letterSpacing: 0, overflowWrap: 'anywhere' }}>
                Choose the plan to review
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 760, fontSize: 16, lineHeight: 1.7 }}>
                Review scoped production paths, delivery fit, and handoff readiness for each approved product plan.
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
            <LibraryMetric label="Plans" value={packageList.length} accent={appleColors.purple} />
            <LibraryMetric label="Active" value={activeCount} accent={appleColors.green} />
            <LibraryMetric label="Needs review" value={attentionCount} accent={attentionCount ? appleColors.amber : appleColors.blue} />
          </Box>
        </Box>
      </Surface>

      <Surface>
        <SectionTitle
          title="Open a Service Plan"
          action={<PastelChip label="Library view" accent={appleColors.purple} bg="#f1efff" />}
        />
        {packageList.length ? (
          <Stack spacing={1.25}>
            {packageList.map((item) => (
              <ServicePlanLibraryRow key={item.id} item={item} onOpen={() => onOpenPlan(item.id)} />
            ))}
          </Stack>
        ) : (
          <EmptyState label="No service plans yet. Submit a product brief or approve a start plan to create the first service plan." />
        )}
      </Surface>
    </Stack>
  );
}

function LibraryMetric({
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

function ServicePlanLibraryRow({
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
          <Typography color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.55, maxWidth: 820 }}>
            {item.summary || 'Open this plan to review services, delivery match, and commercial handoff.'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ justifySelf: { md: 'end' }, color: accent, fontWeight: 950 }}>
          <PlaylistAddCheckOutlined fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 950 }}>
            Open plan
          </Typography>
          <ArrowForwardOutlined fontSize="small" />
        </Stack>
      </Box>
    </Button>
  );
}
