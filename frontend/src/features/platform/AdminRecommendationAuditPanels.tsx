'use client';

import { AutoAwesomeOutlined, CloudSyncOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import PlatformAssistantCard from './PlatformAssistantCard';
import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import {
  EmptyState,
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import type { AdminReadiness, AIRecommendation, LoomAIKnowledgeSync, LoomAIStatus } from './types';

export type AdminRecommendationAuditView = 'readiness' | 'gates' | 'brief' | 'events';

export const isAdminRecommendationAuditView = (value: string | null): value is AdminRecommendationAuditView =>
  value === 'readiness' || value === 'gates' || value === 'brief' || value === 'events';

const adminRecommendationViewLabel: Record<AdminRecommendationAuditView, string> = {
  readiness: 'AI Runtime',
  gates: 'Production Gates',
  brief: 'Ops Brief',
  events: 'Recommendation Events',
};

const gateAccent = (status?: AdminReadiness['overallStatus']) =>
  status === 'BLOCKED' ? appleColors.red : status === 'WARN' ? appleColors.amber : appleColors.green;

export function AdminRecommendationAuditBreadcrumb({
  view,
  onOpenHub,
}: {
  view: AdminRecommendationAuditView;
  onOpenHub: () => void;
}) {
  return (
    <WorkspaceBreadcrumbs
      items={[
        { label: 'AI Audit', onClick: onOpenHub },
        { label: adminRecommendationViewLabel[view] },
      ]}
      backLabel="AI audit hub"
      onBack={onOpenHub}
    />
  );
}

export function AdminRecommendationAuditHubPanel({
  loomAIStatus,
  readiness,
  recommendations,
  onOpenView,
}: {
  loomAIStatus?: LoomAIStatus | undefined;
  readiness?: AdminReadiness | undefined;
  recommendations: AIRecommendation[];
  onOpenView: (view: AdminRecommendationAuditView) => void;
}) {
  const fallbackCount = recommendations.filter((recommendation) => recommendation.fallback).length;
  const providerCount = recommendations.length - fallbackCount;
  const items: JourneyStepItem<AdminRecommendationAuditView>[] = [
    {
      value: 'readiness',
      label: 'AI Runtime',
      detail: 'LoomAI setup, allowed actions, and safe knowledge sync.',
      accent: appleColors.purple,
      meta: <PastelChip label={loomAIStatus?.configured ? 'Configured' : 'Fallback'} accent={loomAIStatus?.configured ? appleColors.green : appleColors.amber} bg={loomAIStatus?.configured ? '#e7f8ee' : '#fff4dc'} />,
    },
    {
      value: 'gates',
      label: 'Production Gates',
      detail: 'Runtime gates that decide whether AI/scanner operations are safe.',
      accent: gateAccent(readiness?.overallStatus),
      meta: <PastelChip label={readiness?.overallStatus || 'Checking'} accent={gateAccent(readiness?.overallStatus)} />,
    },
    {
      value: 'brief',
      label: 'Ops Brief',
      detail: 'Ask the assistant for an admin-facing readiness summary.',
      accent: appleColors.blue,
      meta: <PastelChip label="Assistant" accent={appleColors.blue} bg="#eaf3ff" />,
    },
    {
      value: 'events',
      label: 'Recommendation Events',
      detail: 'Provider traces, confidence, rationale, and fallback history.',
      accent: appleColors.cyan,
      meta: (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <PastelChip label={`${providerCount} provider`} accent={appleColors.green} bg="#e7f8ee" />
          <PastelChip label={`${fallbackCount} fallback`} accent={fallbackCount ? appleColors.amber : appleColors.cyan} bg={fallbackCount ? '#fff4dc' : '#e4f9fd'} />
        </Stack>
      ),
    },
  ];

  return (
    <Stack spacing={2}>
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8fbff)' }}>
        <SectionTitle title="AI Operations Snapshot" action={<PastelChip label="Admin-safe status" accent={appleColors.purple} />} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25 }}>
          <SnapshotTile label="Runtime" value={loomAIStatus?.configured ? 'Configured' : 'Fallback'} />
          <SnapshotTile label="Environment" value={loomAIStatus?.environment || 'local'} />
          <SnapshotTile label="Gate" value={readiness?.overallStatus || 'Checking'} accent={gateAccent(readiness?.overallStatus)} />
          <SnapshotTile label="Events" value={recommendations.length} />
        </Box>
      </Surface>

      <Surface>
        <SectionTitle title="Choose Audit Area" action={<PastelChip label="One admin decision at a time" accent={appleColors.purple} />} />
        <OwnerWorkspaceJourneyNav
          label="AI audit sections"
          value={null}
          items={items}
          maxColumns={4}
          onChange={onOpenView}
        />
      </Surface>
    </Stack>
  );
}

function SnapshotTile({
  label,
  value,
  accent = appleColors.purple,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <Box sx={{ p: 1.5, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, background: 'rgba(248, 250, 252, 0.72)' }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h4" sx={{ color: accent }}>{value}</Typography>
    </Box>
  );
}

export function AdminLoomAiReadinessPanel({
  loomAIStatus,
  knowledgeSyncResult,
  isSyncing,
  onSyncKnowledge,
}: {
  loomAIStatus?: LoomAIStatus | undefined;
  knowledgeSyncResult?: LoomAIKnowledgeSync | undefined;
  isSyncing: boolean;
  onSyncKnowledge: () => void;
}) {
  return (
    <Surface>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
        <Box>
          <SectionTitle title="LoomAI Runtime Readiness" action={<AutoAwesomeOutlined sx={{ color: appleColors.purple }} />} />
          <Typography variant="body2" color="text.secondary">
            Assistant runtime, MCP action allowlist, and catalog knowledge export stay behind ProdUS authorization and fallback paths.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<CloudSyncOutlined />}
          onClick={onSyncKnowledge}
          disabled={isSyncing || !loomAIStatus}
          sx={{ minWidth: 176 }}
        >
          Sync Knowledge
        </Button>
      </Stack>
      {knowledgeSyncResult && (
        <Alert severity={knowledgeSyncResult.status === 'SYNCED' ? 'success' : knowledgeSyncResult.status === 'FAILED' ? 'error' : 'info'} sx={{ mt: 2 }}>
          {formatLabel(knowledgeSyncResult.status)} {knowledgeSyncResult.recordCount} safe records
          {typeof knowledgeSyncResult.succeededOperations === 'number' ? ` - ${knowledgeSyncResult.succeededOperations}/${knowledgeSyncResult.totalOperations ?? knowledgeSyncResult.recordCount} operations accepted` : ''}
          {knowledgeSyncResult.providerRequestId ? ` - request ${knowledgeSyncResult.providerRequestId}` : ''}
          {typeof knowledgeSyncResult.failedOperations === 'number' && knowledgeSyncResult.failedOperations > 0 ? ` - ${knowledgeSyncResult.failedOperations} failed` : ''}
          {knowledgeSyncResult.fallbackReason ? ` - ${formatLabel(knowledgeSyncResult.fallbackReason)}` : ''}
        </Alert>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.25, mt: 2 }}>
        <SnapshotTile label="Environment" value={loomAIStatus?.environment || 'local'} />
        <SnapshotTile label="Runtime" value={loomAIStatus?.configured ? 'Configured' : 'Fallback'} accent={loomAIStatus?.configured ? appleColors.green : appleColors.amber} />
        <SnapshotTile label="Live read actions" value={loomAIStatus?.activeReadActions?.length || 0} accent={appleColors.cyan} />
        <SnapshotTile label="Knowledge sync" value={loomAIStatus?.knowledgeSyncConfigured ? 'Ready' : 'Disabled'} accent={loomAIStatus?.knowledgeSyncConfigured ? appleColors.green : appleColors.amber} />
      </Box>
    </Surface>
  );
}

export function AdminAiOperationsBriefPanel({
  loomAIStatus,
  readiness,
  recommendations,
}: {
  loomAIStatus?: LoomAIStatus | undefined;
  readiness?: AdminReadiness | undefined;
  recommendations: AIRecommendation[];
}) {
  return (
    <PlatformAssistantCard
      title="AI Operations Brief"
      description="Summarize LoomAI readiness, scanner gates, provider traces, fallback risk, and production-readiness follow-up."
      prompt={`Review ProdUS AI and scanner operations readiness for admins. LoomAI configured: ${loomAIStatus?.configured ? 'yes' : 'no'}, environment: ${loomAIStatus?.environment || 'unknown'}, live read actions: ${loomAIStatus?.activeReadActions?.length || 0}, knowledge sync configured: ${loomAIStatus?.knowledgeSyncConfigured ? 'yes' : 'no'}, production gate status: ${readiness?.overallStatus || 'unknown'}, latest recommendation events: ${recommendations.slice(0, 5).map((item) => `${item.recommendationType} via ${item.providerName || 'unknown'}${item.fallback ? ' fallback' : ''}`).join('; ') || 'none'}. Explain operational risks, missing integration proof, fallback implications, and what the admin should inspect next. Do not expose secrets or runtime internals beyond high-level status.`}
      conversationId="admin-ai-operations-brief"
      context={{ pageType: 'admin-scanner-ops' }}
      disabled={!loomAIStatus}
      accent={readiness?.overallStatus === 'BLOCKED' ? appleColors.red : readiness?.overallStatus === 'WARN' ? appleColors.amber : appleColors.purple}
      cta="Summarize Ops"
    />
  );
}

export function AdminProductionGatesPanel({
  readiness,
}: {
  readiness?: AdminReadiness | undefined;
}) {
  return (
    <Surface>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <SectionTitle title="Production Gates" />
          <Typography variant="body2" color="text.secondary">
            Real scanner, MCP, LoomAI, storage, auth, and security gates checked from runtime configuration.
          </Typography>
        </Box>
        <PastelChip label={readiness?.overallStatus || 'Checking'} accent={gateAccent(readiness?.overallStatus)} />
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
        {(readiness?.gates || []).map((gate) => (
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
              <PastelChip label={gate.status} accent={gateAccent(gate.status)} />
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
  );
}

export function AdminRecommendationEventsPanel({
  recommendations,
}: {
  recommendations: AIRecommendation[];
}) {
  return recommendations.length ? (
    <Stack spacing={1.5}>
      {recommendations.map((recommendation) => (
        <Surface key={recommendation.id}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
            <Box sx={{ minWidth: 0 }}>
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
  );
}
