'use client';

import { useState } from 'react';
import { useAdvancedForm } from '@/hooks/enterprise';
import type { ScannerEvidenceFilter } from './scannerProofOperationsTypes';
import {
  type DiagnosisPayload,
  type ProductProfilePayload,
  type RequirementPayload,
  productInitialValues,
  requirementInitialValues,
} from './ownerProductizationWorkspaceConfig';

export function useOwnerProductizationWorkspaceUiState(productId?: string) {
  const [selectedProductId, setSelectedProductId] = useState(productId || '');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [pendingRequirementId, setPendingRequirementId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [cartNotice, setCartNotice] = useState('');
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedFindingId, setSelectedFindingId] = useState('');
  const [evidenceFilter, setEvidenceFilter] = useState<ScannerEvidenceFilter>('ALL');

  const productForm = useAdvancedForm<ProductProfilePayload>({
    initialValues: productInitialValues,
    validationRules: {
      name: [{ type: 'required', message: 'Product name is required' }],
    },
  });
  const requirementForm = useAdvancedForm<RequirementPayload>({
    initialValues: requirementInitialValues,
    validationRules: {
      businessGoal: [{ type: 'required', message: 'Business goal is required' }],
    },
  });
  const diagnosisForm = useAdvancedForm<DiagnosisPayload>({
    initialValues: {
      businessGoal: '',
      currentProblems: '',
      accessSignals: '',
      summary: '',
    },
  });

  return {
    cartNotice,
    diagnosisForm,
    evidenceFilter,
    pendingRequirementId,
    productForm,
    projectName,
    requirementForm,
    selectedFindingId,
    selectedPackageId,
    selectedProductId,
    setCartNotice,
    setEvidenceFilter,
    setPendingRequirementId,
    setProjectName,
    setSelectedFindingId,
    setSelectedPackageId,
    setSelectedProductId,
    setTimelineOpen,
    timelineOpen,
  };
}
