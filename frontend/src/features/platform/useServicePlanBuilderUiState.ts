'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAdvancedForm } from '@/hooks/enterprise';
import { sortPackagesForOwner } from './displayOrder';
import {
  type BuildPackagePayload,
  type ContractPayload,
  type InvoicePayload,
  type ProposalPayload,
  type ServicePlanBuilderView,
  initialContractValues,
  initialInvoiceValues,
  initialProposalValues,
  isServicePlanBuilderView,
} from './servicePlanBuilderConfig';
import type { PackageInstance, RequirementIntake } from './types';

interface ServicePlanBuilderUiStateInput {
  packages: PackageInstance[];
  requirements: RequirementIntake[];
}

export function useServicePlanBuilderUiState({
  packages,
  requirements,
}: ServicePlanBuilderUiStateInput) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams?.toString() || '';
  const viewParam = searchParams?.get('view') || null;
  const detailOpen = isServicePlanBuilderView(viewParam);
  const planView: ServicePlanBuilderView = detailOpen ? viewParam : 'summary';
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [contractProposalId, setContractProposalId] = useState('');
  const [invoiceContractId, setInvoiceContractId] = useState('');

  const buildForm = useAdvancedForm<BuildPackagePayload>({
    initialValues: { requirementId: '' },
    validationRules: {
      requirementId: [{ type: 'required', message: 'Requirement intake is required' }],
    },
  });
  const proposalForm = useAdvancedForm<ProposalPayload>({
    initialValues: initialProposalValues,
    validationRules: {
      teamId: [{ type: 'required', message: 'Team is required' }],
      title: [{ type: 'required', message: 'Proposal title is required' }],
    },
  });
  const contractForm = useAdvancedForm<ContractPayload>({
    initialValues: initialContractValues,
    validationRules: {
      title: [{ type: 'required', message: 'Contract title is required' }],
    },
  });
  const invoiceForm = useAdvancedForm<InvoicePayload>({
    initialValues: initialInvoiceValues,
    validationRules: {
      invoiceNumber: [{ type: 'required', message: 'Invoice number is required' }],
    },
  });

  const packageList = useMemo(() => sortPackagesForOwner(packages), [packages]);
  const selectedPackage = useMemo(
    () => packageList.find((item) => item.id === selectedPackageId) || packageList[0],
    [packageList, selectedPackageId]
  );
  const eligibleRequirements = useMemo(
    () => requirements.filter((item) => item.status === 'SUBMITTED' || item.status === 'PACKAGE_RECOMMENDED'),
    [requirements]
  );
  const selectedRequirement = useMemo(
    () => eligibleRequirements.find((item) => item.id === buildForm.values.requirementId),
    [buildForm.values.requirementId, eligibleRequirements]
  );

  useEffect(() => {
    if (!selectedPackageId && packageList[0]) {
      setSelectedPackageId(packageList[0].id);
    }
  }, [packageList, selectedPackageId]);

  const openPlanView = useCallback(
    (view: ServicePlanBuilderView) => {
      const next = new URLSearchParams(searchParamString);
      next.set('view', view);
      router.push(`${pathname || '/packages'}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParamString]
  );

  const openPlanHub = useCallback(() => {
    const next = new URLSearchParams(searchParamString);
    next.delete('view');
    const suffix = next.toString();
    router.push(suffix ? `${pathname || '/packages'}?${suffix}` : pathname || '/packages', { scroll: false });
  }, [pathname, router, searchParamString]);

  const selectPackage = useCallback((packageId: string) => {
    setSelectedPackageId(packageId);
    setContractProposalId('');
    setInvoiceContractId('');
  }, []);

  return {
    buildForm,
    contractForm,
    contractProposalId,
    detailOpen,
    eligibleRequirements,
    invoiceContractId,
    invoiceForm,
    openPlanView,
    openPlanHub,
    packageList,
    planView,
    proposalForm,
    selectPackage,
    selectedPackage,
    selectedPackageId,
    selectedRequirement,
    setContractProposalId,
    setInvoiceContractId,
    setSelectedPackageId,
  };
}
