'use client';

import type { ComponentProps } from 'react';
import OwnerActionPlanPanel from './OwnerActionPlanPanel';
import OwnerProductDiagnosisPanel from './OwnerProductDiagnosisPanel';
import type { ActionJourneyView } from './ownerWorkspaceJourneyConfig';

type ActionPlanProps = ComponentProps<typeof OwnerActionPlanPanel>;
type DiagnosisProps = Omit<ComponentProps<typeof OwnerProductDiagnosisPanel>, 'mode'>;

interface OwnerWorkspaceActionsPaneProps {
  view: ActionJourneyView;
  detailOpen: boolean;
  actionPlan: ActionPlanProps;
  diagnosis: DiagnosisProps;
}

export default function OwnerWorkspaceActionsPane({
  view,
  detailOpen,
  actionPlan,
  diagnosis,
}: OwnerWorkspaceActionsPaneProps) {
  if (!detailOpen) return null;

  if (view === 'map') {
    return <OwnerProductDiagnosisPanel {...diagnosis} mode="map" />;
  }

  if (view === 'diagnosis') {
    return <OwnerProductDiagnosisPanel {...diagnosis} mode="summary" />;
  }

  return <OwnerActionPlanPanel {...actionPlan} />;
}
