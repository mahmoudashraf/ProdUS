'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getJson, postJson } from './api';
import {
  AdminAiOperationsBriefPanel,
  AdminLoomAiReadinessPanel,
  AdminProductionGatesPanel,
  AdminRecommendationAuditBreadcrumb,
  AdminRecommendationAuditHubPanel,
  AdminRecommendationEventsPanel,
  type AdminRecommendationAuditView,
  isAdminRecommendationAuditView,
} from './AdminRecommendationAuditPanels';
import { PageHeader, QueryState } from './PlatformComponents';
import type { AdminReadiness, AIRecommendation, LoomAIKnowledgeSync, LoomAIStatus } from './types';

export default function AdminRecommendationsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams?.toString() || '';
  const viewParam = searchParams?.get('view') || null;
  const activeView = isAdminRecommendationAuditView(viewParam) ? viewParam : null;

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

  const openView = (view: AdminRecommendationAuditView) => {
    const next = new URLSearchParams(searchParamString);
    next.set('view', view);
    router.push(`${pathname || '/admin/recommendations'}?${next.toString()}`, { scroll: false });
  };

  const openHub = () => {
    const next = new URLSearchParams(searchParamString);
    next.delete('view');
    const query = next.toString();
    router.push(query ? `${pathname || '/admin/recommendations'}?${query}` : (pathname || '/admin/recommendations'), { scroll: false });
  };

  const recommendationList = recommendations.data || [];

  return (
    <>
      <PageHeader
        title="AI Recommendation Audit"
        description="Review LoomAI readiness, production gates, admin AI brief, and recommendation events one area at a time."
      />
      <QueryState
        isLoading={recommendations.isLoading || loomAIStatus.isLoading || readiness.isLoading}
        error={recommendations.error || loomAIStatus.error || readiness.error || knowledgeSync.error}
      />

      {!activeView && (
        <AdminRecommendationAuditHubPanel
          loomAIStatus={loomAIStatus.data}
          readiness={readiness.data}
          recommendations={recommendationList}
          onOpenView={openView}
        />
      )}

      {activeView && (
        <Stack spacing={2}>
          <AdminRecommendationAuditBreadcrumb view={activeView} onOpenHub={openHub} />

          {activeView === 'readiness' && (
            <AdminLoomAiReadinessPanel
              loomAIStatus={loomAIStatus.data}
              knowledgeSyncResult={knowledgeSync.data}
              isSyncing={knowledgeSync.isPending}
              onSyncKnowledge={() => knowledgeSync.mutate()}
            />
          )}

          {activeView === 'gates' && (
            <AdminProductionGatesPanel readiness={readiness.data} />
          )}

          {activeView === 'brief' && (
            <AdminAiOperationsBriefPanel
              loomAIStatus={loomAIStatus.data}
              readiness={readiness.data}
              recommendations={recommendationList}
            />
          )}

          {activeView === 'events' && (
            <AdminRecommendationEventsPanel recommendations={recommendationList} />
          )}
        </Stack>
      )}
    </>
  );
}
