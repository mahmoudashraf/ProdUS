'use client';

import type { ComponentProps } from 'react';
import OwnerServicesRecommendationPanel from './OwnerServicesRecommendationPanel';
import OwnerServicePlanPanel from './OwnerServicePlanPanel';
import OwnerTeamMatchPanel from './OwnerTeamMatchPanel';
import type { ServicesJourneyView } from './ownerWorkspaceJourneyConfig';

type ServiceRecommendationProps = ComponentProps<typeof OwnerServicesRecommendationPanel>;
type ServicePlanProps = ComponentProps<typeof OwnerServicePlanPanel>;
type TeamMatchProps = ComponentProps<typeof OwnerTeamMatchPanel>;

interface OwnerWorkspaceServicesPaneProps {
  view: ServicesJourneyView;
  detailOpen: boolean;
  recommend: ServiceRecommendationProps;
  plan: ServicePlanProps;
  team: TeamMatchProps;
}

export default function OwnerWorkspaceServicesPane({
  view,
  detailOpen,
  recommend,
  plan,
  team,
}: OwnerWorkspaceServicesPaneProps) {
  if (!detailOpen) return null;

  if (view === 'plan') {
    return <OwnerServicePlanPanel {...plan} />;
  }

  if (view === 'team') {
    return <OwnerTeamMatchPanel {...team} />;
  }

  if (view === 'browse') {
    return <OwnerServicesRecommendationPanel {...recommend} mode="browse" />;
  }

  return <OwnerServicesRecommendationPanel {...recommend} mode="decision" />;
}
