'use client';

import OwnerProductDiagnosisMapView from './OwnerProductDiagnosisMapView';
import OwnerProductDiagnosisSummaryView from './OwnerProductDiagnosisSummaryView';
import type { OwnerProductDiagnosisCommonProps } from './ownerProductDiagnosisTypes';

interface OwnerProductDiagnosisPanelProps extends OwnerProductDiagnosisCommonProps {
  mode: 'summary' | 'map';
}

export default function OwnerProductDiagnosisPanel({
  mode,
  ...props
}: OwnerProductDiagnosisPanelProps) {
  if (mode === 'map') {
    return (
      <OwnerProductDiagnosisMapView
        diagnosisForm={props.diagnosisForm}
        isCreatingDiagnosis={props.isCreatingDiagnosis}
        latestDiagnosis={props.latestDiagnosis}
        onCreateDiagnosis={props.onCreateDiagnosis}
        onOpenSummary={props.onOpenSummary}
      />
    );
  }

  return (
    <OwnerProductDiagnosisSummaryView
      assistantActions={props.assistantActions}
      assistantContext={props.assistantContext}
      cartServiceIds={props.cartServiceIds}
      catalogModules={props.catalogModules}
      diagnosisPromptFacts={props.diagnosisPromptFacts}
      isAddingService={props.isAddingService}
      latestDiagnosis={props.latestDiagnosis}
      product={props.product}
      onAddService={props.onAddService}
      onOpenFindingsRisks={props.onOpenFindingsRisks}
      onOpenMap={props.onOpenMap}
    />
  );
}
