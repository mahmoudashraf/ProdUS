'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson, putJson } from './api';
import { sortPackagesForOwner } from './displayOrder';
import { PageHeader, QueryState } from './PlatformComponents';
import {
  ServicePlanHeroPanel,
  ServicePlanJourneyPanel,
  ServicePlanSelectorPanel,
} from './ServicePlanBuilderPanels';
import ServicePlanCommercialPanel from './ServicePlanCommercialPanel';
import { ServicePlanServicesPanel, ServicePlanTeamMatchPanel } from './ServicePlanBuilderServicesPanel';
import ServicePlanSummaryPanel from './ServicePlanBuilderSummaryPanel';
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
  packageScore,
} from './servicePlanBuilderConfig';
import type {
  ContractAgreement,
  InvoiceRecord,
  PackageInstance,
  PackageModule,
  ProjectWorkspace,
  QuoteProposal,
  RequirementIntake,
  Team,
  TeamRecommendation,
} from './types';

export default function PackagesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams?.toString() || '';
  const viewParam = searchParams?.get('view') || null;
  const planView: ServicePlanBuilderView = isServicePlanBuilderView(viewParam) ? viewParam : 'summary';
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canCreateProposal = hasRole([UserRole.ADMIN, UserRole.TEAM_MANAGER]);
  const canAcceptProposal = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER]);
  const canCreateInvoice = hasRole([UserRole.ADMIN, UserRole.TEAM_MANAGER]);

  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
  const requirements = useQuery({ queryKey: ['requirements'], queryFn: () => getJson<RequirementIntake[]>('/requirements') });
  const teams = useQuery({ queryKey: ['teams'], queryFn: () => getJson<Team[]>('/teams') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });
  const contracts = useQuery({ queryKey: ['commerce-contracts'], queryFn: () => getJson<ContractAgreement[]>('/commerce/contracts') });
  const invoices = useQuery({ queryKey: ['commerce-invoices'], queryFn: () => getJson<InvoiceRecord[]>('/commerce/invoices') });

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

  const packageList = sortPackagesForOwner(packages.data || []);
  const selectedPackage = useMemo(
    () => packageList.find((item) => item.id === selectedPackageId) || packageList[0],
    [packageList, selectedPackageId]
  );

  useEffect(() => {
    if (!selectedPackageId && packageList[0]) {
      setSelectedPackageId(packageList[0].id);
    }
  }, [packageList, selectedPackageId]);

  const modules = useQuery({
    queryKey: ['packages', selectedPackage?.id, 'modules'],
    enabled: !!selectedPackage?.id,
    queryFn: () => getJson<PackageModule[]>(`/packages/${selectedPackage?.id}/modules`),
  });
  const teamRecommendations = useQuery({
    queryKey: ['packages', selectedPackage?.id, 'team-recommendations'],
    enabled: !!selectedPackage?.id,
    queryFn: () => getJson<TeamRecommendation[]>(`/packages/${selectedPackage?.id}/team-recommendations`),
  });
  const proposals = useQuery({
    queryKey: ['commerce-package-proposals', selectedPackage?.id],
    enabled: !!selectedPackage?.id,
    queryFn: () => getJson<QuoteProposal[]>(`/commerce/packages/${selectedPackage?.id}/proposals`),
  });

  const moduleList = modules.data || [];
  const teamRecommendationList = teamRecommendations.data || [];
  const proposalList = proposals.data || [];
  const packageContracts = (contracts.data || []).filter(
    (contract) => contract.proposal?.packageInstance?.id === selectedPackage?.id
  );
  const packageInvoices = (invoices.data || []).filter((invoice) =>
    packageContracts.some((contract) => contract.id === invoice.contractAgreement?.id)
  );
  const workspaceOptions = (workspaces.data || []).filter(
    (workspace) => !selectedPackage?.id || workspace.packageInstance?.id === selectedPackage.id
  );
  const requirementList = requirements.data || [];
  const eligibleRequirements = requirementList.filter((item) => item.status === 'SUBMITTED' || item.status === 'PACKAGE_RECOMMENDED');
  const selectedRequirement = eligibleRequirements.find((item) => item.id === buildForm.values.requirementId);
  const score = packageScore(selectedPackage, moduleList);
  const estimatedBudget = (proposalList[0]?.fixedPriceCents || 18000000) + (proposalList[0]?.platformFeeCents || 3000000);

  const openPlanView = (view: ServicePlanBuilderView) => {
    const next = new URLSearchParams(searchParamString);
    next.set('view', view);
    router.push(`${pathname || '/packages'}?${next.toString()}`, { scroll: false });
  };

  const buildPackage = useMutation({
    mutationFn: () => postJson<PackageInstance, Record<string, never>>(`/packages/from-requirement/${buildForm.values.requirementId}`, {}),
    onSuccess: async (packageInstance) => {
      buildForm.resetForm();
      setSelectedPackageId(packageInstance.id);
      openPlanView('summary');
      await queryClient.invalidateQueries({ queryKey: ['packages'] });
      await queryClient.invalidateQueries({ queryKey: ['requirements'] });
      await queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    },
  });
  const createProposal = useMutation({
    mutationFn: () => postJson<QuoteProposal, ProposalPayload>(`/commerce/packages/${selectedPackage?.id}/proposals`, proposalForm.values),
    onSuccess: async () => {
      proposalForm.resetForm();
      openPlanView('commercial');
      await queryClient.invalidateQueries({ queryKey: ['commerce-package-proposals', selectedPackage?.id] });
      await queryClient.invalidateQueries({ queryKey: ['commerce-contracts'] });
    },
  });
  const acceptProposal = useMutation({
    mutationFn: (proposalId: string) =>
      putJson<QuoteProposal, { status: QuoteProposal['status'] }>(`/commerce/proposals/${proposalId}/status`, { status: 'OWNER_ACCEPTED' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['commerce-package-proposals', selectedPackage?.id] });
    },
  });
  const createContract = useMutation({
    mutationFn: () => postJson<ContractAgreement, ContractPayload>(`/commerce/proposals/${contractProposalId}/contract`, contractForm.values),
    onSuccess: async () => {
      contractForm.resetForm();
      setContractProposalId('');
      await queryClient.invalidateQueries({ queryKey: ['commerce-contracts'] });
      await queryClient.invalidateQueries({ queryKey: ['commerce-package-proposals', selectedPackage?.id] });
    },
  });
  const createInvoice = useMutation({
    mutationFn: () => postJson<InvoiceRecord, InvoicePayload>(`/commerce/contracts/${invoiceContractId}/invoices`, invoiceForm.values),
    onSuccess: async () => {
      invoiceForm.resetForm();
      setInvoiceContractId('');
      await queryClient.invalidateQueries({ queryKey: ['commerce-invoices'] });
    },
  });

  const toggleContractForm = (proposal: QuoteProposal) => {
    setContractProposalId((current) => (current === proposal.id ? '' : proposal.id));
    contractForm.setValue('title', `${proposal.team.name} delivery agreement`);
    contractForm.setValue('workspaceId', workspaceOptions[0]?.id || null);
  };

  const toggleInvoiceForm = (contract: ContractAgreement) => {
    setInvoiceContractId((current) => (current === contract.id ? '' : contract.id));
    invoiceForm.setValue('invoiceNumber', `INV-${Date.now()}`);
    invoiceForm.setValue('amountCents', contract.proposal?.fixedPriceCents || 0);
  };

  return (
    <>
      <PageHeader
        title="Service Plans"
        description="Review one service plan at a time: scope, sequence, delivery match, and handoff readiness."
      />
      <QueryState
        isLoading={packages.isLoading || requirements.isLoading || teams.isLoading || workspaces.isLoading || contracts.isLoading || invoices.isLoading}
        error={
          packages.error
          || requirements.error
          || teams.error
          || workspaces.error
          || contracts.error
          || invoices.error
          || modules.error
          || teamRecommendations.error
          || proposals.error
          || buildPackage.error
          || createProposal.error
          || acceptProposal.error
          || createContract.error
          || createInvoice.error
        }
      />

      <Stack spacing={2.5}>
        <ServicePlanSelectorPanel
          packageList={packageList}
          selectedPackage={selectedPackage}
          onSelectPackage={(packageId) => {
            setSelectedPackageId(packageId);
            setContractProposalId('');
            setInvoiceContractId('');
          }}
        />

        {selectedPackage && (
          <>
          <ServicePlanHeroPanel
            selectedPackage={selectedPackage}
            score={score}
            moduleCount={moduleList.length}
            teamMatchCount={teamRecommendationList.length}
            proposalCount={proposalList.length}
            estimatedBudget={estimatedBudget}
            onChangeView={openPlanView}
          />

          <ServicePlanJourneyPanel
            value={planView}
            moduleCount={moduleList.length}
            teamMatchCount={teamRecommendationList.length}
            proposalCount={proposalList.length}
            contractCount={packageContracts.length}
            onChange={openPlanView}
          />

          {planView === 'summary' && (
            <ServicePlanSummaryPanel
              selectedPackage={selectedPackage}
              modules={moduleList}
              teamRecommendations={teamRecommendationList}
              proposals={proposalList}
              workspaceOptions={workspaceOptions}
              score={score}
              estimatedBudget={estimatedBudget}
              requirements={requirementList}
              eligibleRequirements={eligibleRequirements}
              selectedRequirement={selectedRequirement}
              buildForm={buildForm}
              isBuildingPackage={buildPackage.isPending}
              onBuildPackage={() => buildPackage.mutate()}
            />
          )}

          {planView === 'services' && (
            <ServicePlanServicesPanel
              modules={moduleList}
              isFetching={modules.isFetching}
            />
          )}

          {planView === 'team' && (
            <ServicePlanTeamMatchPanel
              teamRecommendations={teamRecommendationList}
              isFetching={teamRecommendations.isFetching}
            />
          )}

          {planView === 'commercial' && (
            <ServicePlanCommercialPanel
              canCreateProposal={canCreateProposal}
              canAcceptProposal={canAcceptProposal}
              canCreateInvoice={canCreateInvoice}
              teams={teams.data || []}
              proposals={proposalList}
              packageContracts={packageContracts}
              packageInvoices={packageInvoices}
              workspaceOptions={workspaceOptions}
              proposalForm={proposalForm}
              contractForm={contractForm}
              invoiceForm={invoiceForm}
              contractProposalId={contractProposalId}
              invoiceContractId={invoiceContractId}
              isCreatingProposal={createProposal.isPending}
              isAcceptingProposal={acceptProposal.isPending}
              isCreatingContract={createContract.isPending}
              isCreatingInvoice={createInvoice.isPending}
              onCreateProposal={() => createProposal.mutate()}
              onAcceptProposal={(proposalId) => acceptProposal.mutate(proposalId)}
              onToggleContract={toggleContractForm}
              onCreateContract={() => createContract.mutate()}
              onToggleInvoice={toggleInvoiceForm}
              onCreateInvoice={() => createInvoice.mutate()}
            />
          )}
          </>
        )}
      </Stack>
    </>
  );
}
