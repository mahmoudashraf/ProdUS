'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { WorkspaceCommandHandoffView } from './WorkspaceCommandHandoffPanels';
import type { WorkspaceCommandProofView } from './WorkspaceCommandProofStepPanel';
import type { WorkspaceCommandView } from './WorkspaceCommandJourneyNav';
import type { WorkspaceCommandTeamView } from './WorkspaceCommandTeamPanels';

interface WorkspaceCommandRouteStateOptions {
  viewParamName?: string;
  proofViewParamName?: string;
  teamViewParamName?: string;
  handoffViewParamName?: string;
}

const isWorkspaceCommandView = (value: string | null): value is WorkspaceCommandView =>
  value === 'overview' || value === 'proof' || value === 'team' || value === 'handoff';

const isWorkspaceCommandTeamView = (value: string | null): value is WorkspaceCommandTeamView =>
  value === 'participants' || value === 'support' || value === 'risks';

const isWorkspaceCommandProofView = (value: string | null): value is WorkspaceCommandProofView =>
  value === 'findings' || value === 'readiness' || value === 'steps' || value === 'proof' || value === 'acceptance';

const isWorkspaceCommandHandoffView = (value: string | null): value is WorkspaceCommandHandoffView =>
  value === 'review' || value === 'signals' || value === 'assistant';

export function useWorkspaceCommandRouteState({
  handoffViewParamName = 'handoffView',
  proofViewParamName = 'proofView',
  teamViewParamName = 'teamView',
  viewParamName = 'view',
}: WorkspaceCommandRouteStateOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams?.toString() || '';
  const workspaceParam = searchParams?.get('workspace') || null;
  const viewParam = searchParams?.get(viewParamName) || null;
  const proofViewParam = searchParams?.get(proofViewParamName) || null;
  const teamViewParam = searchParams?.get(teamViewParamName) || null;
  const handoffViewParam = searchParams?.get(handoffViewParamName) || null;
  const workspaceView = isWorkspaceCommandView(viewParam) ? viewParam : 'overview';
  const workspaceProofView = workspaceView === 'proof' && isWorkspaceCommandProofView(proofViewParam) ? proofViewParam : null;
  const workspaceTeamView = workspaceView === 'team' && isWorkspaceCommandTeamView(teamViewParam) ? teamViewParam : null;
  const workspaceHandoffView = workspaceView === 'handoff' && isWorkspaceCommandHandoffView(handoffViewParam) ? handoffViewParam : null;

  const pushWorkspaceRoute = (
    view: WorkspaceCommandView,
    workspaceId?: string,
    options?: {
      proofView?: WorkspaceCommandProofView;
      teamView?: WorkspaceCommandTeamView;
      handoffView?: WorkspaceCommandHandoffView;
    },
  ) => {
    const next = new URLSearchParams(searchParamString);
    if (workspaceId) next.set('workspace', workspaceId);
    next.delete(proofViewParamName);
    next.delete(teamViewParamName);
    next.delete(handoffViewParamName);
    if (view === 'overview') {
      next.delete(viewParamName);
    } else {
      next.set(viewParamName, view);
    }
    if (view === 'proof' && options?.proofView) next.set(proofViewParamName, options.proofView);
    if (view === 'team' && options?.teamView) next.set(teamViewParamName, options.teamView);
    if (view === 'handoff' && options?.handoffView) next.set(handoffViewParamName, options.handoffView);
    const suffix = next.toString();
    router.push(suffix ? `${pathname || '/workspaces'}?${suffix}` : pathname || '/workspaces', { scroll: false });
  };

  return {
    workspaceParam,
    workspaceView,
    workspaceProofView,
    workspaceTeamView,
    workspaceHandoffView,
    pushWorkspaceRoute,
  };
}
