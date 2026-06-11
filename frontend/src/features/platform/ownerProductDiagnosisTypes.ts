import type { FormEvent } from 'react';
import type { StudioAssistantContext } from './StudioAssistantCard';
import type { ProductDiagnosis, ProductProfile, ServiceModule } from './types';

export interface DiagnosisFormValues {
  businessGoal: string;
  currentProblems: string;
  accessSignals: string;
  summary: string;
}

export interface DiagnosisFormController {
  values: DiagnosisFormValues;
  setValue: <TKey extends keyof DiagnosisFormValues>(
    key: TKey,
    value: DiagnosisFormValues[TKey]
  ) => void;
  handleSubmit: (onSubmit: () => void) => (event?: FormEvent) => Promise<void>;
}

export interface DiagnosisAssistantActions {
  onConfirmAction: (action: Record<string, unknown>) => Promise<void> | void;
  actionDisabledReason: (action: Record<string, unknown>) => string;
}

export interface OwnerProductDiagnosisCommonProps {
  product: ProductProfile;
  diagnosisForm: DiagnosisFormController;
  latestDiagnosis?: ProductDiagnosis | undefined;
  catalogModules: ServiceModule[];
  cartServiceIds: Set<string>;
  diagnosisPromptFacts: string;
  assistantContext: StudioAssistantContext;
  assistantActions: DiagnosisAssistantActions;
  isCreatingDiagnosis: boolean;
  isAddingService: boolean;
  onCreateDiagnosis: () => void;
  onAddService: (module: ServiceModule, source: string) => void;
  onOpenFindingsRisks: () => void;
  onOpenMap: () => void;
  onOpenSummary: () => void;
}
