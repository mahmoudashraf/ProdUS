'use client';

import { useMemo, useState } from 'react';
import { ownerCategoryFromSignal } from './ownerWorkspaceModel';
import type { NormalizedFinding, ScannerEvidenceItem } from './types';

interface OwnerWorkspaceFindingReviewStateInput {
  cartServiceIds: Set<string>;
  scannerEvidence: ScannerEvidenceItem[];
  scannerFindings: NormalizedFinding[];
  scannerOpenFindings: NormalizedFinding[];
  selectedFindingId: string;
  setSelectedFindingId: (findingId: string) => void;
}

export function useOwnerWorkspaceFindingReviewState({
  cartServiceIds,
  scannerEvidence,
  scannerFindings,
  scannerOpenFindings,
  selectedFindingId,
  setSelectedFindingId,
}: OwnerWorkspaceFindingReviewStateInput) {
  const [findingDrawerOpen, setFindingDrawerOpen] = useState(false);
  const [openFindingGroups, setOpenFindingGroups] = useState<Record<string, boolean>>({ 'Launch blockers': true });
  const [findingReasonById, setFindingReasonById] = useState<Record<string, string>>({});
  const [findingReviewDueById, setFindingReviewDueById] = useState<Record<string, string>>({});

  const selectedFinding = useMemo(
    () => scannerFindings.find((finding) => finding.id === selectedFindingId) || scannerOpenFindings[0] || scannerFindings[0],
    [scannerFindings, scannerOpenFindings, selectedFindingId]
  );

  const selectedFindingOwnerCategory = selectedFinding
    ? ownerCategoryFromSignal(selectedFinding.sourceTool, selectedFinding.readinessArea, selectedFinding.title)
    : 'Product risk';

  const selectedFindingEvidence = useMemo(
    () => scannerEvidence.filter((item) => item.findingId && item.findingId === selectedFinding?.id),
    [scannerEvidence, selectedFinding?.id]
  );

  const selectedFindingReason = selectedFinding ? findingReasonById[selectedFinding.id] || '' : '';
  const selectedFindingReviewDue = selectedFinding ? findingReviewDueById[selectedFinding.id] || '' : '';
  const selectedFindingCanResolve = !!selectedFindingReason.trim();
  const selectedFindingCanAcceptRisk = !!selectedFindingReason.trim() && !!selectedFindingReviewDue;
  const selectedFindingRecommendedInCart = !!selectedFinding?.recommendedModule && cartServiceIds.has(selectedFinding.recommendedModule.id);

  const openFindingReview = (findingId: string) => {
    setSelectedFindingId(findingId);
    setFindingDrawerOpen(true);
  };

  const closeFindingReview = () => setFindingDrawerOpen(false);

  const setFindingGroupOpen = (label: string, expanded: boolean) => {
    setOpenFindingGroups((current) => ({ ...current, [label]: expanded }));
  };

  const setFindingReason = (findingId: string, value: string) => {
    setFindingReasonById((current) => ({ ...current, [findingId]: value }));
  };

  const setFindingReviewDue = (findingId: string, value: string) => {
    setFindingReviewDueById((current) => ({ ...current, [findingId]: value }));
  };

  const setSelectedFindingReason = (value: string) => {
    if (selectedFinding) setFindingReason(selectedFinding.id, value);
  };

  const setSelectedFindingReviewDue = (value: string) => {
    if (selectedFinding) setFindingReviewDue(selectedFinding.id, value);
  };

  return {
    closeFindingReview,
    findingDrawerOpen,
    findingReasonById,
    findingReviewDueById,
    openFindingGroups,
    openFindingReview,
    selectedFinding,
    selectedFindingCanAcceptRisk,
    selectedFindingCanResolve,
    selectedFindingEvidence,
    selectedFindingOwnerCategory,
    selectedFindingReason,
    selectedFindingRecommendedInCart,
    selectedFindingReviewDue,
    setFindingGroupOpen,
    setFindingReason,
    setFindingReviewDue,
    setSelectedFindingReason,
    setSelectedFindingReviewDue,
  };
}
