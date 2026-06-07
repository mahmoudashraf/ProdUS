'use client';

import type { ComponentProps } from 'react';
import OwnerActionPlanPanel from './OwnerActionPlanPanel';
import OwnerProductDiagnosisPanel from './OwnerProductDiagnosisPanel';
import type { ActionJourneyView } from './ownerWorkspaceJourneyConfig';

type ActionPlanProps = ComponentProps<typeof OwnerActionPlanPanel>;
type DiagnosisProps = ComponentProps<typeof OwnerProductDiagnosisPanel>;

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

  if (view === 'diagnosis') {
    return <OwnerProductDiagnosisPanel {...diagnosis} />;
  }

  return <OwnerActionPlanPanel {...actionPlan} />;
}
