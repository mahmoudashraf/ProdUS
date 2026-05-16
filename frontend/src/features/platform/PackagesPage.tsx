'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AutoAwesomeOutlined,
  SaveOutlined,
  SendOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { Box, Button, LinearProgress, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import { getJson, postJson, putJson } from './api';
import {
  DotLabel,
  EmptyState,
  PageHeader,
  PastelChip,
  ProgressRing,
  QueryState,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  categoryPalette,
  clampScore,
  formatLabel,
} from './PlatformComponents';
import {
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
  timelineDays: 42,
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
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format((amountCents || 0) / 100);

const statusAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK') || status.includes('REJECT')) return appleColors.red;
  if (status.includes('REVIEW') || status.includes('NEGOTIATION') || status.includes('AWAITING') || status.includes('SUBMITTED')) return appleColors.amber;
  if (status.includes('ACTIVE') || status.includes('ACCEPT') || status.includes('DELIVER') || status.includes('SIGNED')) return appleColors.green;
  return appleColors.purple;
};

const packageScore = (packageInstance?: PackageInstance, modules?: PackageModule[]) => {
  if (!packageInstance) return 0;
  const moduleScore = modules?.length
    ? modules.reduce((total, module) => {
        if (module.status === 'ACCEPTED') return total + 100;
        if (module.status === 'REVIEW') return total + 78;
        if (module.status === 'IN_PROGRESS') return total + 62;
        if (module.status === 'BLOCKED') return total + 24;
        return total + 42;
      }, 0) / modules.length
    : 68;
  const statusBonus = packageInstance.status === 'ACTIVE_DELIVERY' ? 8 : packageInstance.status === 'DELIVERED' ? 16 : 0;
  return clampScore(moduleScore + statusBonus);
};

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
  const score = packageScore(selectedPackage, modules.data);
  const estimatedBudget = (proposals.data?.[0]?.fixedPriceCents || 18000000) + (proposals.data?.[0]?.platformFeeCents || 3000000);

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
      <PageHeader
        title="Service Plan Builder"
        description="Configure services, dependencies, milestones, teams, proposals, and commercial handoff from real service plan records."
      />
      <QueryState
        isLoading={packages.isLoading || requirements.isLoading || teams.isLoading || workspaces.isLoading || contracts.isLoading || invoices.isLoading}
        error={packages.error || requirements.error || teams.error || workspaces.error || contracts.error || invoices.error || modules.error || teamRecommendations.error || proposals.error || buildPackage.error || createProposal.error || acceptProposal.error || createContract.error || createInvoice.error}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 340px' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          <Surface>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ md: 'center' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
                <Typography color="text.secondary" sx={{ fontWeight: 800 }}>Service plan</Typography>
                <TextField
                  select
                  size="small"
                  value={selectedPackage?.id || ''}
                  onChange={(event) => setSelectedPackageId(event.target.value)}
                  sx={{ minWidth: 300 }}
                >
                  {packageList.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              {selectedPackage && <StatusChip label={selectedPackage.status} />}
            </Stack>
          </Surface>

          <Surface>
            {selectedPackage ? (
              <Stack spacing={2.5}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
                  <Box>
                    <Typography variant="h2" sx={{ mb: 0.75 }}>{selectedPackage.name}</Typography>
                    <Typography color="text.secondary" sx={{ maxWidth: 720, lineHeight: 1.7 }}>
                      {selectedPackage.summary || 'No service plan summary yet.'}
                    </Typography>
                  </Box>
                  <ProgressRing value={score} size={96} color={statusAccent(selectedPackage.status)} label="confidence" />
                </Stack>
                {(modules.isFetching || teamRecommendations.isFetching) && <LinearProgress sx={{ borderRadius: 999 }} />}

                <Box>
                  <SectionTitle title="Selected Services" action={<PastelChip label={`${modules.data?.length || 0} included`} accent={appleColors.green} />} />
                  {modules.data?.length ? (
                    <Stack spacing={0}>
                      {modules.data.map((module, index) => {
                        const palette = categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!;
                        return (
                          <Box
                            key={module.id}
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: { xs: '1fr', lg: '64px 1fr 120px 1fr auto' },
                              gap: 1.5,
                              alignItems: 'center',
                              py: 1.75,
                              borderTop: index === 0 ? 0 : '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: palette.bg, color: palette.accent, display: 'grid', placeItems: 'center', fontWeight: 900 }}>
                              {module.sequenceOrder}
                            </Box>
                            <Box>
                              <Typography sx={{ fontWeight: 800 }}>{module.serviceModule.name}</Typography>
                              <Typography variant="body2" color="text.secondary">{module.rationale || module.serviceModule.description}</Typography>
                            </Box>
                            <PastelChip label={module.required ? 'Included' : 'Optional'} accent={module.required ? appleColors.green : appleColors.amber} />
                            <Typography variant="body2" color="text.secondary">{module.deliverables || module.serviceModule.expectedDeliverables || 'Deliverables pending.'}</Typography>
                            <StatusChip label={module.status} />
                          </Box>
                        );
                      })}
                    </Stack>
                  ) : (
                    <EmptyState label="No service modules are attached to this service plan yet." />
                  )}
                </Box>

                <Box>
                  <SectionTitle title="Milestone Plan" />
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: `repeat(${Math.max(1, modules.data?.length || 1)}, 1fr)` }, gap: 1.5 }}>
                    {(modules.data || []).map((module, index) => (
                      <Box key={module.id} sx={{ textAlign: 'center' }}>
                        <Box sx={{ height: 2, bgcolor: index === 0 ? 'transparent' : '#cfd8ea', mb: -2.5 }} />
                        <Box sx={{ width: 44, height: 44, mx: 'auto', borderRadius: '50%', bgcolor: (categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!).bg, color: (categoryPalette[index % categoryPalette.length] ?? categoryPalette[0]!).accent, display: 'grid', placeItems: 'center', fontWeight: 900, border: '1px solid #dbe4f0' }}>
                          {index + 1}
                        </Box>
                        <Typography sx={{ mt: 1, fontWeight: 800 }}>{module.serviceModule.name}</Typography>
                        <Typography variant="body2" color="text.secondary">Week {index * 2 + 1}-{index * 2 + 2}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box>
                  <SectionTitle title="Matched Teams" action={<PastelChip label={`${teamRecommendations.data?.length || 0} matches`} accent={appleColors.cyan} />} />
                  {teamRecommendations.data?.length ? (
                    <Stack spacing={1.5}>
                      {teamRecommendations.data.map((recommendation, index) => (
                        <Box key={recommendation.team.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '90px 1.2fr 1.4fr auto' }, gap: 1.5, alignItems: 'center', py: 1.5, borderTop: index === 0 ? 0 : '1px solid', borderColor: 'divider' }}>
                          <ProgressRing value={Math.round(recommendation.score * 100)} size={70} color={statusAccent(recommendation.team.verificationStatus)} label="match" />
                          <Box>
                            <Typography sx={{ fontWeight: 800 }}>{recommendation.team.name}</Typography>
                            <Typography variant="body2" color="text.secondary">{recommendation.team.timezone || recommendation.team.typicalProjectSize}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">{recommendation.reasons.join(' · ') || recommendation.team.capabilitiesSummary}</Typography>
                          <StatusChip label={recommendation.team.verificationStatus} color="success" />
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <EmptyState label="Add verified team capabilities to unlock recommendations." />
                  )}
                </Box>
              </Stack>
            ) : (
              <EmptyState label="Select or generate a service plan to inspect its service sequence." />
            )}
          </Surface>

          <Surface>
            <SectionTitle title="Commercial Workflow" action={<PastelChip label={`${proposals.data?.length || 0} proposals`} accent={appleColors.purple} />} />
            {canCreateProposal && (
              <Box component="form" onSubmit={submitProposal} sx={{ mb: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.2fr 140px auto' }, gap: 1.25 }}>
                  <TextField select size="small" label="Team" value={proposalForm.values.teamId} onChange={(event) => proposalForm.setValue('teamId', event.target.value)}>
                    {(teams.data || []).map((team) => (
                      <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
                    ))}
                  </TextField>
                  <TextField size="small" label="Proposal" value={proposalForm.values.title} onChange={(event) => proposalForm.setValue('title', event.target.value)} />
                  <TextField size="small" type="number" label="Price cents" value={proposalForm.values.fixedPriceCents} onChange={(event) => proposalForm.setValue('fixedPriceCents', Number(event.target.value))} />
                  <Button type="submit" variant="outlined" disabled={!proposalForm.values.teamId || !proposalForm.values.title || createProposal.isPending}>
                    Submit
                  </Button>
                </Box>
              </Box>
            )}
            <Stack spacing={1.5}>
              {proposals.data?.length ? (
                proposals.data.map((proposal) => (
                  <Box key={proposal.id} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                      <Box>
                        <Typography sx={{ fontWeight: 800 }}>{proposal.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {proposal.team.name} · {formatMoney(proposal.fixedPriceCents, proposal.currency)} · {proposal.timelineDays} days
                        </Typography>
                      </Box>
                      <StatusChip label={proposal.status} />
                    </Stack>
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
                      <Box component="form" onSubmit={submitContract} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.2fr auto' }, gap: 1, mt: 1.5 }}>
                        <TextField select size="small" label="Workspace" value={contractForm.values.workspaceId || ''} onChange={(event) => contractForm.setValue('workspaceId', event.target.value || null)}>
                          <MenuItem value="">No workspace</MenuItem>
                          {workspaceOptions.map((workspace) => (
                            <MenuItem key={workspace.id} value={workspace.id}>{workspace.name}</MenuItem>
                          ))}
                        </TextField>
                        <TextField size="small" label="Contract title" value={contractForm.values.title} onChange={(event) => contractForm.setValue('title', event.target.value)} />
                        <Button type="submit" variant="contained" disabled={!contractForm.values.title || createContract.isPending}>Create</Button>
                      </Box>
                    )}
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">No proposals have been submitted for this service plan yet.</Typography>
              )}
            </Stack>

            {packageContracts.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <SectionTitle title="Contracts and Invoices" />
                <Stack spacing={1.5}>
                  {packageContracts.map((contract) => (
                    <Box key={contract.id} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                        <Box>
                          <Typography sx={{ fontWeight: 800 }}>{contract.title}</Typography>
                          <Typography variant="body2" color="text.secondary">{contract.team.name}</Typography>
                        </Box>
                        <StatusChip label={contract.status} />
                      </Stack>
                      {canCreateInvoice && (
                        <Button
                          size="small"
                          variant={invoiceContractId === contract.id ? 'contained' : 'outlined'}
                          sx={{ mt: 1 }}
                          onClick={() => {
                            setInvoiceContractId(invoiceContractId === contract.id ? '' : contract.id);
                            invoiceForm.setValue('invoiceNumber', `INV-${Date.now()}`);
                            invoiceForm.setValue('amountCents', contract.proposal?.fixedPriceCents || 0);
                          }}
                        >
                          Invoice
                        </Button>
                      )}
                      {invoiceContractId === contract.id && (
                        <Box component="form" onSubmit={submitInvoice} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 160px auto' }, gap: 1, mt: 1 }}>
                          <TextField size="small" label="Invoice number" value={invoiceForm.values.invoiceNumber} onChange={(event) => invoiceForm.setValue('invoiceNumber', event.target.value)} />
                          <TextField size="small" type="number" label="Amount cents" value={invoiceForm.values.amountCents} onChange={(event) => invoiceForm.setValue('amountCents', Number(event.target.value))} />
                          <Button type="submit" variant="contained" disabled={!invoiceForm.values.invoiceNumber || createInvoice.isPending}>Issue</Button>
                        </Box>
                      )}
                      {packageInvoices
                        .filter((invoice) => invoice.contractAgreement?.id === contract.id)
                        .map((invoice) => (
                          <Typography key={invoice.id} variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {invoice.invoiceNumber}: {formatMoney(invoice.amountCents, invoice.currency)} · {formatLabel(invoice.status)}
                          </Typography>
                        ))}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Surface>
        </Stack>

        <Stack spacing={2.5}>
          <Surface>
            <SectionTitle title="Recommended Service Plan" action={<AutoAwesomeOutlined sx={{ color: appleColors.purple }} />} />
            <Stack direction="row" spacing={2} alignItems="center">
              <ProgressRing value={score || 86} size={94} color={appleColors.purple} label="/100" />
              <Box>
                <Typography variant="h4">High confidence match</Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Based on requirements, dependencies, and verified team supply.
                </Typography>
              </Box>
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mt: 2 }}>
              <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="caption">Services</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 22 }}>{modules.data?.length || 0}</Typography>
              </Box>
              <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="caption">Duration</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 22 }}>{Math.max(4, (modules.data?.length || 1) * 2)}w</Typography>
              </Box>
              <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="caption">Budget</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 22 }}>{formatMoney(estimatedBudget, 'USD')}</Typography>
              </Box>
            </Box>
          </Surface>

          <Surface>
            <SectionTitle title="Service Plan Builder" action={<SaveOutlined sx={{ color: appleColors.blue }} />} />
            <Box component="form" onSubmit={submit}>
              <Stack spacing={1.5}>
                <TextField select fullWidth label="Requirement intake" value={form.values.requirementId} onChange={(event) => form.setValue('requirementId', event.target.value)}>
                  {(requirements.data || []).map((requirement) => (
                    <MenuItem key={requirement.id} value={requirement.id}>
                      {requirement.productProfile?.name || requirement.businessGoal}
                    </MenuItem>
                  ))}
                </TextField>
                <Button type="submit" variant="contained" disabled={!form.values.requirementId || buildPackage.isPending} startIcon={<SendOutlined />}>
                  Create service plan
                </Button>
              </Stack>
            </Box>
          </Surface>

          <Surface>
            <SectionTitle title="Service Plan Summary" />
            <Stack spacing={1.25}>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Included services</Typography>
                <Typography sx={{ fontWeight: 800 }}>{modules.data?.length || 0}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Optional services</Typography>
                <Typography sx={{ fontWeight: 800 }}>{(modules.data || []).filter((module) => !module.required).length}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Est. duration</Typography>
                <Typography sx={{ fontWeight: 800 }}>{Math.max(4, (modules.data?.length || 1) * 2)} weeks</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Confidence</Typography>
                <Typography sx={{ fontWeight: 800, color: appleColors.green }}>{score || 86}/100</Typography>
              </Stack>
            </Stack>
          </Surface>

          <Surface sx={{ background: '#fffaf1' }}>
            <SectionTitle title="Warnings" action={<WarningAmberOutlined sx={{ color: appleColors.amber }} />} />
            <Stack spacing={1.5}>
              {(modules.data || []).some((module) => module.status === 'BLOCKED') ? (
                <DotLabel label="Blocked service in sequence" color={appleColors.red} />
              ) : (
                <DotLabel label="No blocked services" color={appleColors.green} />
              )}
              {!teamRecommendations.data?.length && <DotLabel label="No verified team matches yet" color={appleColors.amber} />}
              {!workspaceOptions.length && <DotLabel label="Open a workspace before contract handoff" color={appleColors.amber} />}
            </Stack>
          </Surface>
        </Stack>
      </Box>
    </>
  );
}
