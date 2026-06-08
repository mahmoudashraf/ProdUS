'use client';

import {
  CheckCircleOutline,
  FactCheckOutlined,
  PsychologyAltOutlined,
  ScienceOutlined,
  ShieldOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import {
  EmptyState,
  MetricTile,
  PastelChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { FixtureResultCard } from './DiagnosisQualityResultCard';
import {
  scoreAccent,
  scoreLabel,
  statusAccent,
} from './diagnosisQualityPresentation';
import type {
  DiagnosisQualityFixture,
  DiagnosisQualityFixtureResult,
  DiagnosisQualityRun,
} from './types';

export function DiagnosisQualityFixturePanel({
  fixtures,
  includeBadExamples,
  selectedFixtureIds,
  onIncludeBadExamplesChange,
  onToggleFixture,
}: {
  fixtures: DiagnosisQualityFixture[];
  includeBadExamples: boolean;
  selectedFixtureIds: string[];
  onIncludeBadExamplesChange: (include: boolean) => void;
  onToggleFixture: (fixtureId: string) => void;
}) {
  return (
    <Surface
      sx={{
        background:
          'linear-gradient(135deg, rgba(98, 92, 255, 0.08), rgba(14, 165, 198, 0.05) 46%, rgba(255,255,255,0.96))',
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4">Prototype Fixtures</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
              Based on real app patterns, but stored as compact expected findings so ProdUS does not depend on external repos to test diagnosis quality.
            </Typography>
          </Box>
          <PastelChip
            label={`${selectedFixtureIds.length || fixtures.length || 0} selected`}
            accent={appleColors.purple}
          />
        </Stack>

        <FormControlLabel
          control={
            <Checkbox
              checked={includeBadExamples}
              onChange={event => onIncludeBadExamplesChange(event.target.checked)}
            />
          }
          label={<Typography variant="body2">Score bad diagnosis examples too</Typography>}
        />

        {fixtures.length ? (
          <Stack spacing={1}>
            {fixtures.map(fixture => {
              const selected = selectedFixtureIds.length === 0 || selectedFixtureIds.includes(fixture.id);
              return (
                <Box
                  key={fixture.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onToggleFixture(fixture.id)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') onToggleFixture(fixture.id);
                  }}
                  sx={{
                    p: 1.35,
                    border: '1px solid',
                    borderColor: selected ? 'rgba(98, 92, 255, 0.38)' : appleColors.line,
                    borderRadius: 1,
                    bgcolor: selected ? 'rgba(98, 92, 255, 0.06)' : '#fff',
                    cursor: 'pointer',
                    transition: '160ms ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 12px 28px rgba(15, 23, 42, 0.07)',
                    },
                  }}
                >
                  <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 950, color: appleColors.ink }}>{fixture.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                        {fixture.sourceApp} · {fixture.prototypeType}
                      </Typography>
                    </Box>
                    <Checkbox checked={selected} size="small" sx={{ p: 0.25 }} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.55 }}>
                    {fixture.description}
                  </Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                    <PastelChip label={`${fixture.findingCount} findings`} accent={appleColors.cyan} bg="#e4f9fd" />
                    {fixture.expectedServiceCodes.slice(0, 3).map(code => (
                      <PastelChip key={code} label={code} accent={appleColors.purple} bg="#f1efff" />
                    ))}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        ) : (
          <EmptyState label="No diagnosis quality fixtures are available." />
        )}
      </Stack>
    </Surface>
  );
}

export function DiagnosisQualityNextActionsPanel({ latestRun }: { latestRun: DiagnosisQualityRun | undefined }) {
  if (!latestRun) return null;

  return (
    <Surface>
      <Stack spacing={1.25}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Box>
            <Typography variant="h4">Next Actions</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
              Use this as the weekly tuning queue for classifier and catalog quality.
            </Typography>
          </Box>
          <PastelChip label={formatLabel(latestRun.status)} accent={statusAccent(latestRun.status)} />
        </Stack>
        {latestRun.nextActions.map(action => (
          <Stack key={action} direction="row" spacing={1} alignItems="flex-start">
            <CheckCircleOutline sx={{ mt: 0.2, color: appleColors.green }} fontSize="small" />
            <Typography variant="body2" sx={{ lineHeight: 1.55 }}>{action}</Typography>
          </Stack>
        ))}
      </Stack>
    </Surface>
  );
}

export function DiagnosisQualityResultsPanel({
  latestRun,
  sortedResults,
}: {
  latestRun: DiagnosisQualityRun | undefined;
  sortedResults: DiagnosisQualityFixtureResult[];
}) {
  if (!latestRun) {
    return (
      <Surface
        sx={{
          minHeight: 420,
          display: 'flex',
          alignItems: 'center',
          background:
            'radial-gradient(circle at 10% 10%, rgba(98, 92, 255, 0.10), transparent 28%), linear-gradient(135deg, #fff, #f8fbff)',
        }}
      >
        <Stack spacing={1.5} sx={{ maxWidth: 680 }}>
          <ScienceOutlined sx={{ color: appleColors.purple, fontSize: 44 }} />
          <Typography variant="h3">Run the harness before trusting the next demo.</Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
            This check scores whether ProdUS maps prototype scanner signals to real catalog services,
            catches generic diagnosis language, and keeps the fix path specific enough for startup and MVP owners.
          </Typography>
          <Alert severity="info" sx={{ borderRadius: 1 }}>
            This is deterministic. It does not call LoomAI and does not run scanners.
          </Alert>
        </Stack>
      </Surface>
    );
  }

  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25 }}>
        <MetricTile
          label="Average score"
          value={`${latestRun.averageScore}%`}
          detail={scoreLabel(latestRun.averageScore)}
          accent={scoreAccent(latestRun.averageScore)}
          icon={<PsychologyAltOutlined />}
        />
        <MetricTile
          label="Fixtures"
          value={latestRun.fixtureCount}
          detail={`${latestRun.passCount} pass · ${latestRun.warnCount} warn · ${latestRun.failCount} fail`}
          accent={statusAccent(latestRun.status)}
          icon={<ScienceOutlined />}
        />
        <MetricTile
          label="Service mapping"
          value={`${latestRun.totalMatchedServices}/${latestRun.totalExpectedServices}`}
          detail="Catalog-backed matches"
          accent={latestRun.totalMatchedServices === latestRun.totalExpectedServices ? appleColors.green : appleColors.amber}
          icon={<FactCheckOutlined />}
        />
        <MetricTile
          label="Catalog gaps"
          value={latestRun.unresolvedCatalogCodeCount}
          detail="Missing codes"
          accent={latestRun.unresolvedCatalogCodeCount ? appleColors.red : appleColors.green}
          icon={<ShieldOutlined />}
        />
      </Box>

      <Stack spacing={2}>
        {sortedResults.map(result => (
          <FixtureResultCard key={result.fixtureId} result={result} />
        ))}
      </Stack>
    </>
  );
}
