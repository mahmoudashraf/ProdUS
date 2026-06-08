'use client';

import { Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson } from './api';
import { PageHeader, QueryState } from './PlatformComponents';
import {
  ServicePlanHeroPanel,
  ServicePlanJourneyPanel,
  ServicePlanSelectorPanel,
} from './ServicePlanBuilderPanels';
import ServicePlanCommercialPanel from './ServicePlanCommercialPanel';
import { ServicePlanServicesPanel, ServicePlanTeamMatchPanel } from './ServicePlanBuilderServicesPanel';
import ServicePlanSummaryPanel from './ServicePlanBuilderSummaryPanel';
import { packageScore } from './servicePlanBuilderConfig';
import { useServicePlanBuilderUiState } from './useServicePlanBuilderUiState';
import { useServicePlanCommerceActions } from './useServicePlanCommerceActions';
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

  const {
    buildForm,
    contractForm,
    contractProposalId,
    eligibleRequirements,
    invoiceContractId,
    invoiceForm,
    openPlanView,
    packageList,
    planView,
    proposalForm,
    selectPackage,
    selectedPackage,
    selectedRequirement,
    setContractProposalId,
    setInvoiceContractId,
    setSelectedPackageId,
  } = useServicePlanBuilderUiState({
    packages: packages.data || [],
    requirements: requirements.data || [],
  });

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
  const score = packageScore(selectedPackage, moduleList);
  const estimatedBudget = (proposalList[0]?.fixedPriceCents || 18000000) + (proposalList[0]?.platformFeeCents || 3000000);

  const {
    acceptProposal,
    buildPackage,
    createContract,
    createInvoice,
    createProposal,
    toggleContractForm,
    toggleInvoiceForm,
  } = useServicePlanCommerceActions({
    buildForm,
    contractForm,
    contractProposalId,
    invoiceContractId,
    invoiceForm,
    openPlanView,
    proposalForm,
    selectedPackage,
    setContractProposalId,
    setInvoiceContractId,
    setSelectedPackageId,
    workspaceOptions,
  });

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
          onSelectPackage={selectPackage}
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
