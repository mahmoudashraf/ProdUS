'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postJson, putJson } from './api';
import {
  type BuildPackagePayload,
  type ContractPayload,
  type InvoicePayload,
  type ProposalPayload,
  type ServicePlanBuilderView,
} from './servicePlanBuilderConfig';
import type {
  ContractAgreement,
  InvoiceRecord,
  PackageInstance,
  ProjectWorkspace,
  QuoteProposal,
} from './types';

interface ServicePlanMutationForm<TValues> {
  values: TValues;
  resetForm: () => void;
}

interface ServicePlanEditableForm<TValues> extends ServicePlanMutationForm<TValues> {
  setValue: <TKey extends keyof TValues>(key: TKey, value: TValues[TKey]) => void;
}

interface ServicePlanCommerceActionsInput {
  buildForm: ServicePlanMutationForm<BuildPackagePayload>;
  contractForm: ServicePlanEditableForm<ContractPayload>;
  contractProposalId: string;
  invoiceContractId: string;
  invoiceForm: ServicePlanEditableForm<InvoicePayload>;
  openPlanView: (view: ServicePlanBuilderView, packageIdOverride?: string) => void;
  proposalForm: ServicePlanMutationForm<ProposalPayload>;
  selectedPackage: PackageInstance | undefined;
  setContractProposalId: Dispatch<SetStateAction<string>>;
  setInvoiceContractId: Dispatch<SetStateAction<string>>;
  setSelectedPackageId: (packageId: string) => void;
  workspaceOptions: ProjectWorkspace[];
}

export function useServicePlanCommerceActions({
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
}: ServicePlanCommerceActionsInput) {
  const queryClient = useQueryClient();

  const buildPackage = useMutation({
    mutationFn: () => postJson<PackageInstance, Record<string, never>>(`/packages/from-requirement/${buildForm.values.requirementId}`, {}),
    onSuccess: async (packageInstance) => {
      buildForm.resetForm();
      setSelectedPackageId(packageInstance.id);
      openPlanView('summary', packageInstance.id);
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

  return {
    acceptProposal,
    buildPackage,
    createContract,
    createInvoice,
    createProposal,
    toggleContractForm,
    toggleInvoiceForm,
  };
}
