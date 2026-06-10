'use client';

import OwnerFindingReviewDrawer from './OwnerFindingReviewDrawer';
import StudioAssistantCard, { type StudioAssistantContext } from './StudioAssistantCard';
import { findingStatusAccent } from './ownerFindingPresentation';
import type { NormalizedFinding, ProductProfile, ScannerEvidenceItem, ServiceModule } from './types';

interface AssistantActionHandlers {
  onConfirmAction?: (action: Record<string, unknown>) => Promise<void> | void;
  actionDisabledReason?: (action: Record<string, unknown>) => string;
}

interface OwnerFindingReviewDrawerHostProps {
  open: boolean;
  product?: ProductProfile | undefined;
  finding?: NormalizedFinding | undefined;
  ownerCategory: string;
  evidence: ScannerEvidenceItem[];
  decisionReason: string;
  reviewDueOn: string;
  canResolve: boolean;
  canAcceptRisk: boolean;
  recommendedInCart: boolean;
  isAddingService: boolean;
  isUpdatingStatus: boolean;
  isOpeningEvidence: boolean;
  assistantActions: AssistantActionHandlers;
  assistantContext: (pageType: string, overrides?: Partial<StudioAssistantContext>) => StudioAssistantContext;
  onClose: () => void;
  onDecisionReasonChange: (value: string) => void;
  onReviewDueChange: (value: string) => void;
  onRecordDecision: (status: NormalizedFinding['status']) => void;
  onAddService: (serviceModule: ServiceModule, source: string) => void;
  onOpenEvidence: (evidence: ScannerEvidenceItem) => void;
}

const findingReviewPrompt = (
  product: ProductProfile,
  finding: NormalizedFinding,
  linkedEvidenceCount: number
) =>
  `Do not call write actions for this answer. Review scanner finding ${finding.id} for ${product.name}. Finding details: title "${finding.title}", severity ${finding.severity}, status ${finding.status}, affected area "${finding.readinessArea || finding.affectedComponent || 'not specified'}", source rule "${finding.sourceRuleId || finding.sourceTool}", description "${finding.description}", business risk "${finding.businessRisk || 'not mapped'}", required evidence "${finding.evidenceRequired || 'not mapped'}", recommended service "${finding.recommendedModule?.name || 'not mapped'}", linked evidence count ${linkedEvidenceCount}. Explain likely impact, what evidence is needed to resolve or accept risk, and which service or milestone should own follow-up. Use these provided details directly. Do not include raw artifact contents.`;

export default function OwnerFindingReviewDrawerHost({
  open,
  product,
  finding,
  ownerCategory,
  evidence,
  decisionReason,
  reviewDueOn,
  canResolve,
  canAcceptRisk,
  recommendedInCart,
  isAddingService,
  isUpdatingStatus,
  isOpeningEvidence,
  assistantActions,
  assistantContext,
  onClose,
  onDecisionReasonChange,
  onReviewDueChange,
  onRecordDecision,
  onAddService,
  onOpenEvidence,
}: OwnerFindingReviewDrawerHostProps) {
  const assistantSlot = finding && product ? (
    <StudioAssistantCard
      title="AI Finding Review"
      description="Turn this finding into an owner-readable decision with evidence needs and remediation direction."
      prompt={findingReviewPrompt(product, finding, evidence.length)}
      conversationId={`studio-finding-${product.id}-${finding.id}`}
      context={assistantContext('scanner-finding-review', { findingId: finding.id })}
      {...assistantActions}
      accent={findingStatusAccent(finding.status)}
      compact
      cta="Review Finding"
    />
  ) : undefined;

  return (
    <OwnerFindingReviewDrawer
      open={open}
      product={product}
      finding={finding}
      ownerCategory={ownerCategory}
      evidence={evidence}
      decisionReason={decisionReason}
      reviewDueOn={reviewDueOn}
      canResolve={canResolve}
      canAcceptRisk={canAcceptRisk}
      recommendedInCart={recommendedInCart}
      isAddingService={isAddingService}
      isUpdatingStatus={isUpdatingStatus}
      isOpeningEvidence={isOpeningEvidence}
      onClose={onClose}
      onDecisionReasonChange={onDecisionReasonChange}
      onReviewDueChange={onReviewDueChange}
      onRecordDecision={onRecordDecision}
      onAddService={onAddService}
      onOpenEvidence={onOpenEvidence}
      assistantSlot={assistantSlot}
    />
  );
}
