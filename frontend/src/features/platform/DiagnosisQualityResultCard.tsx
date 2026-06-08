'use client';

import {
  BugReportOutlined,
  CheckCircleOutline,
  WarningAmberOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Stack,
  Typography,
} from '@mui/material';
import {
  PastelChip,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import {
  scoreAccent,
  statusAccent,
} from './diagnosisQualityPresentation';
import type { DiagnosisQualityFixtureResult } from './types';

export function FixtureResultCard({ result }: { result: DiagnosisQualityFixtureResult }) {
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
