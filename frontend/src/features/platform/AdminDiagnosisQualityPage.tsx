'use client';

import {
  BugReportOutlined,
  CheckCircleOutline,
  FactCheckOutlined,
  PlayArrowOutlined,
  PsychologyAltOutlined,
  ScienceOutlined,
  ShieldOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { getJson, postJson } from './api';
import {
  EmptyState,
  MetricTile,
  PageHeader,
  PastelChip,
  QueryState,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import {
  DiagnosisQualityFixture,
  DiagnosisQualityFixtureResult,
  DiagnosisQualityRun,
} from './types';

const statusAccent = (status?: string) => {
  if (status === 'PASS') return appleColors.green;
  if (status === 'WARN') return appleColors.amber;
  if (status === 'FAIL') return appleColors.red;
  return appleColors.cyan;
};

const scoreAccent = (score: number) => {
  if (score >= 86) return appleColors.green;
  if (score >= 72) return appleColors.amber;
  return appleColors.red;
};

const scoreLabel = (score: number) => {
  if (score >= 86) return 'Specific';
  if (score >= 72) return 'Needs tuning';
  return 'Too generic';
};

export default function AdminDiagnosisQualityPage() {
  const [selectedFixtureIds, setSelectedFixtureIds] = useState<string[]>([]);
  const [includeBadExamples, setIncludeBadExamples] = useState(true);

  const fixtures = useQuery({
    queryKey: ['diagnosis-quality-fixtures'],
    queryFn: () => getJson<DiagnosisQualityFixture[]>('/productization-engine/diagnosis-quality/fixtures'),
  });

  const runHarness = useMutation({
    mutationFn: () => {
      const payload: { fixtureIds?: string[]; includeBadExamples: boolean } = { includeBadExamples };
      if (selectedFixtureIds.length) {
        payload.fixtureIds = selectedFixtureIds;
      }
      return postJson<DiagnosisQualityRun, { fixtureIds?: string[]; includeBadExamples: boolean }>(
        '/productization-engine/diagnosis-quality/run',
        payload
      );
    },
  });

  const selectedAll = fixtures.data?.length ? selectedFixtureIds.length === fixtures.data.length : false;
  const latestRun = runHarness.data;
  const sortedResults = useMemo(
    () =>
      [...(latestRun?.fixtures || [])].sort((left, right) => {
        const statusOrder = { FAIL: 0, WARN: 1, PASS: 2 };
        return statusOrder[left.status] - statusOrder[right.status] || left.overallScore - right.overallScore;
      }),
    [latestRun]
  );

  const toggleFixture = (fixtureId: string) => {
    setSelectedFixtureIds(current =>
      current.includes(fixtureId)
        ? current.filter(id => id !== fixtureId)
        : [...current, fixtureId]
    );
  };

  return (
    <>
      <PageHeader
        title="Diagnosis Quality Harness"
        description="Run curated MVP and startup-prototype fixtures against the current scanner classifier and catalog mapping. This catches generic diagnosis output before it reaches owner demos."
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ScienceOutlined />}
              disabled={!fixtures.data?.length}
              onClick={() => setSelectedFixtureIds(selectedAll ? [] : fixtures.data?.map(fixture => fixture.id) || [])}
              sx={{ minHeight: 42 }}
            >
              {selectedAll ? 'Clear Fixtures' : 'Select All'}
            </Button>
            <Button
              variant="contained"
              startIcon={<PlayArrowOutlined />}
              disabled={runHarness.isPending || fixtures.isLoading}
              onClick={() => runHarness.mutate()}
              sx={{
                minHeight: 42,
                px: 2.5,
                boxShadow: '0 16px 32px rgba(98, 92, 255, 0.22)',
              }}
            >
              Run Quality Check
            </Button>
          </Stack>
        }
      />

      <QueryState isLoading={fixtures.isLoading} error={fixtures.error || runHarness.error} />
      {runHarness.isPending && <LinearProgress sx={{ mb: 2, borderRadius: 999 }} />}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.05fr 1.45fr' }, gap: 2 }}>
        <Stack spacing={2}>
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
                  label={`${selectedFixtureIds.length || fixtures.data?.length || 0} selected`}
                  accent={appleColors.purple}
                />
              </Stack>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeBadExamples}
                    onChange={event => setIncludeBadExamples(event.target.checked)}
                  />
                }
                label={<Typography variant="body2">Score bad diagnosis examples too</Typography>}
              />

              {fixtures.data?.length ? (
                <Stack spacing={1}>
                  {fixtures.data.map(fixture => {
                    const selected = selectedFixtureIds.length === 0 || selectedFixtureIds.includes(fixture.id);
                    return (
                      <Box
                        key={fixture.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleFixture(fixture.id)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') toggleFixture(fixture.id);
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

          {latestRun ? (
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
          ) : null}
        </Stack>

        <Stack spacing={2}>
          {latestRun ? (
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
          ) : (
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
          )}
        </Stack>
      </Box>
    </>
  );
}

function FixtureResultCard({ result }: { result: DiagnosisQualityFixtureResult }) {
  const worstFindings = result.findings.filter(finding => !finding.categoryMatched || !finding.serviceMatched || !finding.catalogResolved);

  return (
    <Surface>
      <Stack spacing={1.4}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ md: 'flex-start' }}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h4">{result.name}</Typography>
              <PastelChip label={formatLabel(result.status)} accent={statusAccent(result.status)} bg={result.status === 'PASS' ? '#e7f8ee' : result.status === 'WARN' ? '#fff4dc' : '#ffe9ec'} />
              <PastelChip label={`${result.overallScore}%`} accent={scoreAccent(result.overallScore)} />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {result.sourceApp} · {result.prototypeType}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <PastelChip label={`Specificity ${result.specificityScore}%`} accent={scoreAccent(result.specificityScore)} />
            <PastelChip label={`Services ${result.serviceMappingScore}%`} accent={scoreAccent(result.serviceMappingScore)} />
            <PastelChip label={`Bad examples ${result.badExampleScore}%`} accent={scoreAccent(result.badExampleScore)} />
          </Stack>
        </Stack>

        <Box
          sx={{
            p: 1.4,
            border: '1px solid',
            borderColor: appleColors.line,
            borderRadius: 1,
            bgcolor: '#fbfdff',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
            Generated diagnosis sample
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.65, lineHeight: 1.65 }}>
            {result.generatedDiagnosis}
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1 }}>
          <Box sx={{ p: 1.25, border: '1px solid', borderColor: appleColors.line, borderRadius: 1 }}>
            <Typography sx={{ fontWeight: 950, mb: 1 }}>Expected services</Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {result.expectedServiceCodes.map(code => (
                <PastelChip key={code} label={code} accent={result.matchedServiceCodes.includes(code) ? appleColors.green : appleColors.red} bg={result.matchedServiceCodes.includes(code) ? '#e7f8ee' : '#ffe9ec'} />
              ))}
            </Stack>
          </Box>
          <Box sx={{ p: 1.25, border: '1px solid', borderColor: appleColors.line, borderRadius: 1 }}>
            <Typography sx={{ fontWeight: 950, mb: 1 }}>Readiness areas</Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {result.actualReadinessAreas.map(area => (
                <PastelChip key={area} label={area} accent={appleColors.cyan} bg="#e4f9fd" />
              ))}
            </Stack>
          </Box>
        </Box>

        {result.genericIssues.length ? (
          <Alert severity="warning" sx={{ borderRadius: 1 }}>
            {result.genericIssues.join(' ')}
          </Alert>
        ) : null}

        {result.unresolvedCatalogCodes.length ? (
          <Alert severity="error" sx={{ borderRadius: 1 }}>
            Missing catalog code(s): {result.unresolvedCatalogCodes.join(', ')}
          </Alert>
        ) : null}

        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 950 }}>Finding checks</Typography>
          {(worstFindings.length ? worstFindings : result.findings.slice(0, 4)).map(finding => (
            <Box key={`${result.fixtureId}-${finding.title}`} sx={{ p: 1.2, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fff' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ md: 'flex-start' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                    {finding.categoryMatched && finding.serviceMatched && finding.catalogResolved ? (
                      <CheckCircleOutline fontSize="small" sx={{ color: appleColors.green }} />
                    ) : (
                      <WarningAmberOutlined fontSize="small" sx={{ color: appleColors.amber }} />
                    )}
                    <Typography sx={{ fontWeight: 900 }}>{finding.title}</Typography>
                    <StatusChip label={finding.severity} color={finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? 'error' : 'warning'} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {finding.sourceTool} · {finding.actualCategory} · {finding.actualReadinessArea || 'No area'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.55 }}>
                    {finding.businessRisk}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                  <PastelChip label={finding.actualServiceCode || 'Unmapped'} accent={finding.serviceMatched ? appleColors.green : appleColors.red} bg={finding.serviceMatched ? '#e7f8ee' : '#ffe9ec'} />
                  <PastelChip label={finding.catalogResolved ? 'Catalog ready' : 'Catalog gap'} accent={finding.catalogResolved ? appleColors.green : appleColors.red} bg={finding.catalogResolved ? '#e7f8ee' : '#ffe9ec'} />
                  <PastelChip label={`${Math.round((finding.mappingConfidence || 0) * 100)}%`} accent={scoreAccent(Math.round((finding.mappingConfidence || 0) * 100))} />
                </Stack>
              </Stack>
            </Box>
          ))}
        </Stack>

        {result.badDiagnosisExamples.length ? (
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 950 }}>Bad diagnosis detector</Typography>
            {result.badDiagnosisExamples.map((example, index) => (
              <Box key={`${result.fixtureId}-bad-${index}`} sx={{ p: 1.2, border: '1px solid', borderColor: example.caught ? '#bbf7d0' : '#fecaca', borderRadius: 1, bgcolor: example.caught ? '#f6fff9' : '#fff7f8' }}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <BugReportOutlined fontSize="small" sx={{ mt: 0.2, color: example.caught ? appleColors.green : appleColors.red }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 850, lineHeight: 1.55 }}>
                      "{example.text}"
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {example.caught ? 'Caught as generic' : 'Not caught'} · {example.issues.join(' ')}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>
        ) : null}

        {result.reviewerNotes ? (
          <Alert severity="info" sx={{ borderRadius: 1 }}>
            {result.reviewerNotes}
          </Alert>
        ) : null}
      </Stack>
    </Surface>
  );
}
