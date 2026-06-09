'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { WorkspaceCommandHandoffView } from './WorkspaceCommandHandoffPanels';
import type { WorkspaceCommandView } from './WorkspaceCommandJourneyNav';
import type { WorkspaceCommandTeamView } from './WorkspaceCommandTeamPanels';

const isWorkspaceCommandView = (value: string | null): value is WorkspaceCommandView =>
  value === 'overview' || value === 'proof' || value === 'team' || value === 'handoff';

const isWorkspaceCommandTeamView = (value: string | null): value is WorkspaceCommandTeamView =>
  value === 'participants' || value === 'support' || value === 'risks';

const isWorkspaceCommandHandoffView = (value: string | null): value is WorkspaceCommandHandoffView =>
  value === 'review' || value === 'signals' || value === 'assistant';

export function useWorkspaceCommandRouteState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams?.toString() || '';
  const workspaceParam = searchParams?.get('workspace') || null;
  const viewParam = searchParams?.get('view') || null;
  const teamViewParam = searchParams?.get('teamView') || null;
  const handoffViewParam = searchParams?.get('handoffView') || null;
  const workspaceView = isWorkspaceCommandView(viewParam) ? viewParam : 'overview';
  const workspaceTeamView = workspaceView === 'team' && isWorkspaceCommandTeamView(teamViewParam) ? teamViewParam : null;
  const workspaceHandoffView = workspaceView === 'handoff' && isWorkspaceCommandHandoffView(handoffViewParam) ? handoffViewParam : null;

  const pushWorkspaceRoute = (
    view: WorkspaceCommandView,
    workspaceId?: string,
    options?: {
      teamView?: WorkspaceCommandTeamView;
      handoffView?: WorkspaceCommandHandoffView;
    },
  ) => {
    const next = new URLSearchParams(searchParamString);
    if (workspaceId) next.set('workspace', workspaceId);
    next.delete('teamView');
    next.delete('handoffView');
    if (view === 'overview') {
      next.delete('view');
    } else {
      next.set('view', view);
    }
    if (view === 'team' && options?.teamView) next.set('teamView', options.teamView);
    if (view === 'handoff' && options?.handoffView) next.set('handoffView', options.handoffView);
    const suffix = next.toString();
    router.push(suffix ? `${pathname || '/workspaces'}?${suffix}` : pathname || '/workspaces', { scroll: false });
  };

  return {
    workspaceParam,
    workspaceView,
    workspaceTeamView,
    workspaceHandoffView,
    pushWorkspaceRoute,
  };
}
