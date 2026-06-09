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
  const planIdParam = searchParams?.get('planId') || '';
  const viewParam = searchParams?.get('view') || null;
  const activePlanView = isServicePlanBuilderView(viewParam) ? viewParam : null;
  const planView: ServicePlanBuilderView = activePlanView || 'summary';
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
    () => packageList.find((item) => item.id === planIdParam),
    [packageList, planIdParam]
  );
  const planOpen = !!selectedPackage;
  const detailOpen = !!selectedPackage && !!activePlanView;
  const eligibleRequirements = useMemo(
    () => requirements.filter((item) => item.status === 'SUBMITTED' || item.status === 'PACKAGE_RECOMMENDED'),
    [requirements]
  );
  const selectedRequirement = useMemo(
    () => eligibleRequirements.find((item) => item.id === buildForm.values.requirementId),
    [buildForm.values.requirementId, eligibleRequirements]
  );

  useEffect(() => {
    if (planIdParam && packageList.length && !selectedPackage) {
      const next = new URLSearchParams(searchParamString);
      next.delete('planId');
      next.delete('view');
      const suffix = next.toString();
      router.replace(suffix ? `${pathname || '/packages'}?${suffix}` : pathname || '/packages', { scroll: false });
    }
  }, [packageList.length, pathname, planIdParam, router, searchParamString, selectedPackage]);

  const openPlanView = useCallback(
    (view: ServicePlanBuilderView, packageIdOverride?: string) => {
      const next = new URLSearchParams(searchParamString);
      const packageId = packageIdOverride || selectedPackage?.id || planIdParam;
      if (packageId) {
        next.set('planId', packageId);
      }
      next.set('view', view);
      router.push(`${pathname || '/packages'}?${next.toString()}`, { scroll: false });
    },
    [pathname, planIdParam, router, searchParamString, selectedPackage?.id]
  );

  const openPlanOverview = useCallback(
    (packageId: string) => {
      const next = new URLSearchParams(searchParamString);
      next.set('planId', packageId);
      next.delete('view');
      router.push(`${pathname || '/packages'}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParamString]
  );

  const openPlanHub = useCallback(() => {
    const next = new URLSearchParams(searchParamString);
    next.delete('planId');
    next.delete('view');
    const suffix = next.toString();
    router.push(suffix ? `${pathname || '/packages'}?${suffix}` : pathname || '/packages', { scroll: false });
  }, [pathname, router, searchParamString]);

  const selectPackage = useCallback((packageId: string) => {
    setContractProposalId('');
    setInvoiceContractId('');
    openPlanOverview(packageId);
  }, [openPlanOverview]);

  return {
    buildForm,
    contractForm,
    contractProposalId,
    detailOpen,
    eligibleRequirements,
    invoiceContractId,
    invoiceForm,
    openPlanHub,
    openPlanOverview,
    openPlanView,
    packageList,
    planOpen,
    planView,
    proposalForm,
    selectPackage,
    selectedPackage,
    selectedPackageId: selectedPackage?.id || '',
    selectedRequirement,
    setContractProposalId,
    setInvoiceContractId,
    setSelectedPackageId: openPlanOverview,
  };
}
