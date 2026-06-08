'use client';

import {
  PlayArrowOutlined,
  ScienceOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  LinearProgress,
  Stack,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { getJson, postJson } from './api';
import {
  PageHeader,
  QueryState,
} from './PlatformComponents';
import {
  DiagnosisQualityFixturePanel,
  DiagnosisQualityNextActionsPanel,
  DiagnosisQualityResultsPanel,
} from './DiagnosisQualityPanels';
import {
  DiagnosisQualityFixture,
  DiagnosisQualityRun,
} from './types';

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
          <DiagnosisQualityFixturePanel
            fixtures={fixtures.data || []}
            includeBadExamples={includeBadExamples}
            selectedFixtureIds={selectedFixtureIds}
            onIncludeBadExamplesChange={setIncludeBadExamples}
            onToggleFixture={toggleFixture}
          />
          <DiagnosisQualityNextActionsPanel latestRun={latestRun} />
        </Stack>

        <Stack spacing={2}>
          <DiagnosisQualityResultsPanel latestRun={latestRun} sortedResults={sortedResults} />
        </Stack>
      </Box>
    </>
  );
}
