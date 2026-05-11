'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Button, LinearProgress, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson, putJson } from './api';
import { EmptyState, PageHeader, QueryState, StatusChip, Surface } from './PlatformComponents';
import { ContractAgreement, InvoiceRecord, PackageInstance, PackageModule, ProjectWorkspace, QuoteProposal, RequirementIntake, Team, TeamRecommendation } from './types';

interface BuildPackagePayload {
  requirementId: string;
}

interface ProposalPayload {
  teamId: string;
  title: string;
  scope: string;
  assumptions: string;
  timelineDays: number;
  currency: string;
  fixedPriceCents: number;
  platformFeeCents: number;
  status: QuoteProposal['status'];
}

interface ContractPayload {
  workspaceId: string | null;
  title: string;
  terms: string;
  effectiveOn: string | null;
  status: ContractAgreement['status'];
}

interface InvoicePayload {
  invoiceNumber: string;
  description: string;
  amountCents: number;
  currency: string;
  dueDate: string | null;
  status: InvoiceRecord['status'];
}

const initialProposalValues: ProposalPayload = {
  teamId: '',
  title: '',
  scope: '',
  assumptions: '',
  timelineDays: 14,
  currency: 'USD',
  fixedPriceCents: 0,
  platformFeeCents: 0,
  status: 'SUBMITTED',
};

const initialContractValues: ContractPayload = {
  workspaceId: null,
  title: '',
  terms: '',
  effectiveOn: null,
  status: 'SIGNED',
};

const initialInvoiceValues: InvoicePayload = {
  invoiceNumber: '',
  description: '',
  amountCents: 0,
  currency: 'USD',
  dueDate: null,
  status: 'ISSUED',
};

const formatMoney = (amountCents: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format((amountCents || 0) / 100);

export default function PackagesPage() {
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
  const form = useAdvancedForm<BuildPackagePayload>({
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

  const buildPackage = useMutation({
    mutationFn: () => postJson<PackageInstance, Record<string, never>>(`/packages/from-requirement/${form.values.requirementId}`, {}),
    onSuccess: async (packageInstance) => {
      form.resetForm();
      setSelectedPackageId(packageInstance.id);
      await queryClient.invalidateQueries({ queryKey: ['packages'] });
      await queryClient.invalidateQueries({ queryKey: ['requirements'] });
      await queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
    },
  });

  const packageList = packages.data || [];
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

  const packageContracts = (contracts.data || []).filter(
    (contract) => contract.proposal?.packageInstance?.id === selectedPackage?.id
  );
  const packageInvoices = (invoices.data || []).filter((invoice) =>
    packageContracts.some((contract) => contract.id === invoice.contractAgreement?.id)
  );
  const workspaceOptions = (workspaces.data || []).filter(
    (workspace) => !selectedPackage?.id || workspace.packageInstance?.id === selectedPackage.id
  );

  const submit = form.handleSubmit(() => {
    buildPackage.mutate();
  });
  const createProposal = useMutation({
    mutationFn: () => postJson<QuoteProposal, ProposalPayload>(`/commerce/packages/${selectedPackage?.id}/proposals`, proposalForm.values),
    onSuccess: async () => {
      proposalForm.resetForm();
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
  const submitProposal = proposalForm.handleSubmit(() => {
    if (selectedPackage?.id) {
      createProposal.mutate();
    }
  });
  const submitContract = contractForm.handleSubmit(() => {
    if (contractProposalId) {
      createContract.mutate();
    }
  });
  const submitInvoice = invoiceForm.handleSubmit(() => {
    if (invoiceContractId) {
      createInvoice.mutate();
    }
  });

  return (
    <>
      <PageHeader title="Packages" description="Generate package drafts from requirement intake and deterministic service dependencies." />
      <QueryState
        isLoading={packages.isLoading || requirements.isLoading || teams.isLoading || workspaces.isLoading || contracts.isLoading || invoices.isLoading}
        error={packages.error || requirements.error || teams.error || workspaces.error || contracts.error || invoices.error || modules.error || teamRecommendations.error || proposals.error || buildPackage.error || createProposal.error || acceptProposal.error || createContract.error || createInvoice.error}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '380px 1fr' }, gap: 2 }}>
        <Stack spacing={1.5}>
          <Surface>
            <Box component="form" onSubmit={submit}>
              <Stack spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Requirement intake"
                  value={form.values.requirementId}
                  onChange={(event) => form.setValue('requirementId', event.target.value)}
                >
                  {(requirements.data || []).map((requirement) => (
                    <MenuItem key={requirement.id} value={requirement.id}>
                      {requirement.productProfile?.name || requirement.businessGoal}
                    </MenuItem>
                  ))}
                </TextField>
                <Button type="submit" variant="contained" disabled={!form.values.requirementId || buildPackage.isPending}>
                  Build package
                </Button>
              </Stack>
            </Box>
          </Surface>
          {packageList.length ? (
            <Surface>
              <Stack spacing={1}>
                {packageList.map((item) => (
                  <Button
                    key={item.id}
                    variant={selectedPackage?.id === item.id ? 'contained' : 'outlined'}
                    color={selectedPackage?.id === item.id ? 'primary' : 'inherit'}
                    onClick={() => setSelectedPackageId(item.id)}
                    sx={{ justifyContent: 'space-between', textAlign: 'left' }}
                  >
                    <span>{item.name}</span>
                    <span>{item.status.replaceAll('_', ' ').toLowerCase()}</span>
                  </Button>
                ))}
              </Stack>
            </Surface>
          ) : (
            <EmptyState label="No package drafts have been generated." />
          )}
        </Stack>
        <Surface>
          {selectedPackage ? (
            <Stack spacing={2.5}>
              <Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                  <Typography variant="h3">{selectedPackage.name}</Typography>
                  <StatusChip label={selectedPackage.status} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {selectedPackage.summary || 'No package summary yet.'}
                </Typography>
              </Box>
              {(modules.isFetching || teamRecommendations.isFetching) && <LinearProgress />}
              <Box>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  Service sequence
                </Typography>
                <Stack spacing={1.5}>
                  {modules.data?.length ? (
                    modules.data.map((module) => (
                      <Box key={module.id} sx={{ borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                          <Typography variant="subtitle1">
                            {module.sequenceOrder}. {module.serviceModule.name}
                          </Typography>
                          <StatusChip label={module.status} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {module.rationale || module.serviceModule.description || 'No module rationale yet.'}
                        </Typography>
                        {module.deliverables && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                            Deliverables: {module.deliverables}
                          </Typography>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No service modules are attached to this package yet.
                    </Typography>
                  )}
                </Stack>
              </Box>
              <Box>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  Team recommendations
                </Typography>
                <Stack spacing={1.5}>
                  {teamRecommendations.data?.length ? (
                    teamRecommendations.data.map((recommendation) => (
                      <Box key={recommendation.team.id} sx={{ borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                          <Typography variant="subtitle1">{recommendation.team.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {Math.round(recommendation.score * 100)}% match
                          </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {recommendation.reasons.join(' · ') || recommendation.team.capabilitiesSummary || 'No match rationale yet.'}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Add verified team capabilities to unlock recommendations.
                    </Typography>
                  )}
                </Stack>
              </Box>
              <Box>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  Commercial workflow
                </Typography>
                {canCreateProposal && (
                  <Box component="form" onSubmit={submitProposal} sx={{ mb: 2 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
                      <TextField
                        select
                        size="small"
                        label="Team"
                        value={proposalForm.values.teamId}
                        onChange={(event) => proposalForm.setValue('teamId', event.target.value)}
                        sx={{ minWidth: 220 }}
                      >
                        {(teams.data || []).map((team) => (
                          <MenuItem key={team.id} value={team.id}>
                            {team.name}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        size="small"
                        label="Proposal"
                        value={proposalForm.values.title}
                        onChange={(event) => proposalForm.setValue('title', event.target.value)}
                        sx={{ minWidth: 240 }}
                      />
                      <TextField
                        size="small"
                        type="number"
                        label="Price cents"
                        value={proposalForm.values.fixedPriceCents}
                        onChange={(event) => proposalForm.setValue('fixedPriceCents', Number(event.target.value))}
                        sx={{ width: 150 }}
                      />
                      <Button type="submit" variant="outlined" disabled={!proposalForm.values.teamId || !proposalForm.values.title || createProposal.isPending}>
                        Submit
                      </Button>
                    </Stack>
                  </Box>
                )}
                <Stack spacing={1.5}>
                  {proposals.data?.length ? (
                    proposals.data.map((proposal) => (
                      <Box key={proposal.id} sx={{ borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                          <Box>
                            <Typography variant="subtitle1">{proposal.title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {proposal.team.name} · {formatMoney(proposal.fixedPriceCents, proposal.currency)} · {proposal.timelineDays} days
                            </Typography>
                          </Box>
                          <StatusChip label={proposal.status} />
                        </Stack>
                        {proposal.scope && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                            {proposal.scope}
                          </Typography>
                        )}
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 1 }}>
                          {canAcceptProposal && proposal.status === 'SUBMITTED' && (
                            <Button size="small" variant="outlined" onClick={() => acceptProposal.mutate(proposal.id)} disabled={acceptProposal.isPending}>
                              Accept proposal
                            </Button>
                          )}
                          {canAcceptProposal && (
                            <Button
                              size="small"
                              variant={contractProposalId === proposal.id ? 'contained' : 'outlined'}
                              onClick={() => {
                                setContractProposalId(contractProposalId === proposal.id ? '' : proposal.id);
                                contractForm.setValue('title', `${proposal.team.name} delivery agreement`);
                                contractForm.setValue('workspaceId', workspaceOptions[0]?.id || null);
                              }}
                            >
                              Contract
                            </Button>
                          )}
                        </Stack>
                        {contractProposalId === proposal.id && (
                          <Box component="form" onSubmit={submitContract} sx={{ mt: 1.5 }}>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                              <TextField
                                select
                                size="small"
                                label="Workspace"
                                value={contractForm.values.workspaceId || ''}
                                onChange={(event) => contractForm.setValue('workspaceId', event.target.value || null)}
                                sx={{ minWidth: 220 }}
                              >
                                <MenuItem value="">No workspace</MenuItem>
                                {workspaceOptions.map((workspace) => (
                                  <MenuItem key={workspace.id} value={workspace.id}>
                                    {workspace.name}
                                  </MenuItem>
                                ))}
                              </TextField>
                              <TextField
                                size="small"
                                label="Contract title"
                                value={contractForm.values.title}
                                onChange={(event) => contractForm.setValue('title', event.target.value)}
                                sx={{ minWidth: 260 }}
                              />
                              <Button type="submit" variant="contained" disabled={!contractForm.values.title || createContract.isPending}>
                                Create
                              </Button>
                            </Stack>
                          </Box>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No proposals have been submitted for this package yet.
                    </Typography>
                  )}
                </Stack>
                {packageContracts.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Contracts and invoices
                    </Typography>
                    <Stack spacing={1.5}>
                      {packageContracts.map((contract) => (
                        <Box key={contract.id} sx={{ borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                            <Box>
                              <Typography variant="body2">{contract.title}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {contract.team.name}
                              </Typography>
                            </Box>
                            <StatusChip label={contract.status} />
                          </Stack>
                          {canCreateInvoice && (
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 1 }}>
                              <Button
                                size="small"
                                variant={invoiceContractId === contract.id ? 'contained' : 'outlined'}
                                onClick={() => {
                                  setInvoiceContractId(invoiceContractId === contract.id ? '' : contract.id);
                                  invoiceForm.setValue('invoiceNumber', `INV-${Date.now()}`);
                                  invoiceForm.setValue('amountCents', contract.proposal?.fixedPriceCents || 0);
                                }}
                              >
                                Invoice
                              </Button>
                            </Stack>
                          )}
                          {invoiceContractId === contract.id && (
                            <Box component="form" onSubmit={submitInvoice} sx={{ mt: 1 }}>
                              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                                <TextField
                                  size="small"
                                  label="Invoice number"
                                  value={invoiceForm.values.invoiceNumber}
                                  onChange={(event) => invoiceForm.setValue('invoiceNumber', event.target.value)}
                                />
                                <TextField
                                  size="small"
                                  type="number"
                                  label="Amount cents"
                                  value={invoiceForm.values.amountCents}
                                  onChange={(event) => invoiceForm.setValue('amountCents', Number(event.target.value))}
                                />
                                <Button type="submit" variant="contained" disabled={!invoiceForm.values.invoiceNumber || createInvoice.isPending}>
                                  Issue
                                </Button>
                              </Stack>
                            </Box>
                          )}
                          {packageInvoices
                            .filter((invoice) => invoice.contractAgreement?.id === contract.id)
                            .map((invoice) => (
                              <Typography key={invoice.id} variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                                {invoice.invoiceNumber}: {formatMoney(invoice.amountCents, invoice.currency)} · {invoice.status.replaceAll('_', ' ').toLowerCase()}
                              </Typography>
                            ))}
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            </Stack>
          ) : (
            <Typography color="text.secondary">Select or generate a package to inspect its service sequence.</Typography>
          )}
        </Surface>
      </Box>
    </>
  );
}
