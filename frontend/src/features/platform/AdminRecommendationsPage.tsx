'use client';

import { AutoAwesomeOutlined, CloudSyncOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getJson, postJson } from './api';
import { EmptyState, PageHeader, PastelChip, QueryState, SectionTitle, Surface, appleColors, formatLabel } from './PlatformComponents';
import { AdminReadiness, AIRecommendation, LoomAIKnowledgeSync, LoomAIStatus } from './types';

export default function AdminRecommendationsPage() {
  const queryClient = useQueryClient();
  const recommendations = useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: () => getJson<AIRecommendation[]>('/ai/recommendations'),
    retry: false,
  });
  const loomAIStatus = useQuery({
    queryKey: ['loomai-status'],
    queryFn: () => getJson<LoomAIStatus>('/ai/loomai/status'),
    retry: false,
  });
  const readiness = useQuery({
    queryKey: ['production-readiness'],
    queryFn: () => getJson<AdminReadiness>('/admin/production-readiness'),
    retry: false,
  });
  const knowledgeSync = useMutation({
    mutationFn: () => postJson<LoomAIKnowledgeSync, Record<string, never>>('/ai/loomai/knowledge-sync', {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loomai-status'] }),
  });

  return (
    <>
      <PageHeader title="AI Recommendation Audit" description="Review provider traces, LoomAI readiness, safe knowledge sync, confidence, rationale, and fallback state." />
      <QueryState isLoading={recommendations.isLoading || loomAIStatus.isLoading || readiness.isLoading} error={recommendations.error || loomAIStatus.error || readiness.error || knowledgeSync.error} />
      <Surface>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
          <Box>
            <SectionTitle title="LoomAI Staging Readiness" action={<AutoAwesomeOutlined sx={{ color: appleColors.purple }} />} />
            <Typography variant="body2" color="text.secondary">
              Assistant runtime, MCP action allowlist, and catalog knowledge export stay behind ProdUS authorization and fallback paths.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<CloudSyncOutlined />}
            onClick={() => knowledgeSync.mutate()}
            disabled={knowledgeSync.isPending || !loomAIStatus.data}
            sx={{ minWidth: 176 }}
          >
            Sync Knowledge
          </Button>
        </Stack>
        {knowledgeSync.data && (
          <Alert severity={knowledgeSync.data.status === 'SYNCED' ? 'success' : knowledgeSync.data.status === 'FAILED' ? 'error' : 'info'} sx={{ mt: 2 }}>
            {formatLabel(knowledgeSync.data.status)} {knowledgeSync.data.recordCount} safe records
            {typeof knowledgeSync.data.succeededOperations === 'number' ? ` - ${knowledgeSync.data.succeededOperations}/${knowledgeSync.data.totalOperations ?? knowledgeSync.data.recordCount} operations accepted` : ''}
            {knowledgeSync.data.providerRequestId ? ` - request ${knowledgeSync.data.providerRequestId}` : ''}
            {typeof knowledgeSync.data.failedOperations === 'number' && knowledgeSync.data.failedOperations > 0 ? ` - ${knowledgeSync.data.failedOperations} failed` : ''}
            {knowledgeSync.data.fallbackReason ? ` - ${formatLabel(knowledgeSync.data.fallbackReason)}` : ''}
          </Alert>
        )}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.25, mt: 2 }}>
          <Box sx={{ p: 1.5, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, background: 'rgba(248, 250, 252, 0.72)' }}>
            <Typography variant="body2" color="text.secondary">Environment</Typography>
            <Typography variant="h4">{loomAIStatus.data?.environment || 'local'}</Typography>
          </Box>
          <Box sx={{ p: 1.5, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, background: 'rgba(248, 250, 252, 0.72)' }}>
            <Typography variant="body2" color="text.secondary">Runtime</Typography>
            <Typography variant="h4">{loomAIStatus.data?.configured ? 'Configured' : 'Fallback'}</Typography>
          </Box>
          <Box sx={{ p: 1.5, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, background: 'rgba(248, 250, 252, 0.72)' }}>
            <Typography variant="body2" color="text.secondary">Live read actions</Typography>
            <Typography variant="h4">{loomAIStatus.data?.activeReadActions?.length || 0}</Typography>
          </Box>
          <Box sx={{ p: 1.5, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, background: 'rgba(248, 250, 252, 0.72)' }}>
            <Typography variant="body2" color="text.secondary">Knowledge sync</Typography>
            <Typography variant="h4">{loomAIStatus.data?.knowledgeSyncConfigured ? 'Ready' : 'Disabled'}</Typography>
          </Box>
        </Box>
      </Surface>
      <Surface>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <SectionTitle title="Production Gates" />
            <Typography variant="body2" color="text.secondary">
              Real scanner, MCP, LoomAI, storage, auth, and security gates checked from runtime configuration.
            </Typography>
          </Box>
          <PastelChip
            label={readiness.data?.overallStatus || 'Checking'}
            accent={readiness.data?.overallStatus === 'BLOCKED' ? appleColors.red : readiness.data?.overallStatus === 'WARN' ? appleColors.amber : appleColors.green}
          />
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
          {(readiness.data?.gates || []).map((gate) => (
            <Box
              key={gate.key}
              sx={{
                p: 1.5,
                border: '1px solid',
                borderColor: gate.status === 'BLOCKED' ? '#fecdd3' : appleColors.line,
                borderRadius: 1,
                background: gate.status === 'BLOCKED' ? '#fff7f8' : gate.status === 'WARN' ? '#fffaf0' : '#ffffff',
              }}
            >
              <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900 }}>{gate.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{gate.area}</Typography>
                </Box>
                <PastelChip
                  label={gate.status}
                  accent={gate.status === 'BLOCKED' ? appleColors.red : gate.status === 'WARN' ? appleColors.amber : appleColors.green}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.55 }}>{gate.detail}</Typography>
              {gate.status !== 'PASS' && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 800 }}>
                  {gate.remediation}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Surface>
      {recommendations.data?.length ? (
        <Stack spacing={1.5}>
          {recommendations.data.map((recommendation) => (
            <Surface key={recommendation.id}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
                <Box>
                  <Typography variant="h4">{recommendation.recommendationType}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {recommendation.sourceEntityType || 'source'} / {recommendation.sourceEntityId || 'unlinked'}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <PastelChip label={recommendation.providerName || 'Rules'} accent={recommendation.providerName === 'LOOMAI' ? appleColors.purple : appleColors.blue} />
                  <PastelChip label={recommendation.fallback ? 'Fallback' : 'Provider reviewed'} accent={recommendation.fallback ? appleColors.amber : appleColors.green} />
                  <PastelChip
                    label={typeof recommendation.confidence === 'number' ? `${Math.round(recommendation.confidence * 100)}% confidence` : 'No confidence'}
                    accent={appleColors.cyan}
                  />
                </Stack>
              </Stack>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {recommendation.rationale || 'No rationale recorded.'}
              </Typography>
              {(recommendation.providerRequestId || recommendation.fallbackReason) && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {recommendation.providerRequestId ? `Provider request ${recommendation.providerRequestId}` : ''}
                  {recommendation.providerRequestId && recommendation.fallbackReason ? ' - ' : ''}
                  {recommendation.fallbackReason ? formatLabel(recommendation.fallbackReason) : ''}
                </Typography>
              )}
            </Surface>
          ))}
        </Stack>
      ) : (
        <EmptyState label="No AI recommendation events recorded yet." />
      )}
    </>
  );
}
