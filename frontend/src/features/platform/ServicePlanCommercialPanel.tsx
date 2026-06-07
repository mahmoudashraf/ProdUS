'use client';

import NextLink from 'next/link';
import { ArrowForwardOutlined, GroupsOutlined } from '@mui/icons-material';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import {
  EmptyState,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import {
  type ContractPayload,
  type InvoicePayload,
  type ProposalPayload,
  type ServicePlanFormController,
  formatMoney,
} from './servicePlanBuilderConfig';
import type {
  ContractAgreement,
  InvoiceRecord,
  ProjectWorkspace,
  QuoteProposal,
  Team,
} from './types';

export default function ServicePlanCommercialPanel({
  canCreateProposal,
  canAcceptProposal,
  canCreateInvoice,
  teams,
  proposals,
  packageContracts,
  packageInvoices,
  workspaceOptions,
  proposalForm,
  contractForm,
  invoiceForm,
  contractProposalId,
  invoiceContractId,
  isCreatingProposal,
  isAcceptingProposal,
  isCreatingContract,
  isCreatingInvoice,
  onCreateProposal,
  onAcceptProposal,
  onToggleContract,
  onCreateContract,
  onToggleInvoice,
  onCreateInvoice,
}: {
  canCreateProposal: boolean;
  canAcceptProposal: boolean;
  canCreateInvoice: boolean;
  teams: Team[];
  proposals: QuoteProposal[];
  packageContracts: ContractAgreement[];
  packageInvoices: InvoiceRecord[];
  workspaceOptions: ProjectWorkspace[];
  proposalForm: ServicePlanFormController<ProposalPayload>;
  contractForm: ServicePlanFormController<ContractPayload>;
  invoiceForm: ServicePlanFormController<InvoicePayload>;
  contractProposalId: string;
  invoiceContractId: string;
  isCreatingProposal: boolean;
  isAcceptingProposal: boolean;
  isCreatingContract: boolean;
  isCreatingInvoice: boolean;
  onCreateProposal: () => void;
  onAcceptProposal: (proposalId: string) => void;
  onToggleContract: (proposal: QuoteProposal) => void;
  onCreateContract: () => void;
  onToggleInvoice: (contract: ContractAgreement) => void;
  onCreateInvoice: () => void;
}) {
  return (
    <Surface>
      <SectionTitle title="Commercial Handoff" action={<GroupsOutlined sx={{ color: appleColors.green }} />} />
      {canCreateProposal && (
        <Box component="form" onSubmit={proposalForm.handleSubmit(onCreateProposal)} sx={{ mb: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.2fr 140px auto' }, gap: 1.25 }}>
            <TextField select size="small" label="Team" value={proposalForm.values.teamId} onChange={(event) => proposalForm.setValue('teamId', event.target.value)}>
              {teams.map((team) => (
                <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
              ))}
            </TextField>
            <TextField size="small" label="Proposal" value={proposalForm.values.title} onChange={(event) => proposalForm.setValue('title', event.target.value)} />
            <TextField size="small" type="number" label="Price cents" value={proposalForm.values.fixedPriceCents} onChange={(event) => proposalForm.setValue('fixedPriceCents', Number(event.target.value))} />
            <Button type="submit" variant="outlined" disabled={!proposalForm.values.teamId || !proposalForm.values.title || isCreatingProposal}>
              Submit
            </Button>
          </Box>
        </Box>
      )}

      <Stack spacing={1.5}>
        {proposals.length ? (
          proposals.map((proposal) => (
            <Box key={proposal.id} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>{proposal.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {proposal.team.name} · {formatMoney(proposal.fixedPriceCents, proposal.currency)} · {proposal.timelineDays} days
                  </Typography>
                </Box>
                <StatusChip label={proposal.status} />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
                {canAcceptProposal && proposal.status === 'SUBMITTED' && (
                  <Button size="small" variant="outlined" onClick={() => onAcceptProposal(proposal.id)} disabled={isAcceptingProposal}>
                    Accept proposal
                  </Button>
                )}
                {canAcceptProposal && (
                  <Button
                    size="small"
                    variant={contractProposalId === proposal.id ? 'contained' : 'outlined'}
                    onClick={() => onToggleContract(proposal)}
                  >
                    Contract
                  </Button>
                )}
              </Stack>
              {contractProposalId === proposal.id && (
                <Box component="form" onSubmit={contractForm.handleSubmit(onCreateContract)} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.2fr auto' }, gap: 1, mt: 1.5 }}>
                  <TextField select size="small" label="Workspace" value={contractForm.values.workspaceId || ''} onChange={(event) => contractForm.setValue('workspaceId', event.target.value || null)}>
                    <MenuItem value="">No workspace</MenuItem>
                    {workspaceOptions.map((workspace) => (
                      <MenuItem key={workspace.id} value={workspace.id}>{workspace.name}</MenuItem>
                    ))}
                  </TextField>
                  <TextField size="small" label="Contract title" value={contractForm.values.title} onChange={(event) => contractForm.setValue('title', event.target.value)} />
                  <Button type="submit" variant="contained" disabled={!contractForm.values.title || isCreatingContract}>Create</Button>
                </Box>
              )}
            </Box>
          ))
        ) : (
          <EmptyState label="No proposals have been submitted for this service plan yet." />
        )}
      </Stack>

      {packageContracts.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <SectionTitle title="Contracts And Invoices" />
          <Stack spacing={1.5}>
            {packageContracts.map((contract) => (
              <Box key={contract.id} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>{contract.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{contract.team.name}</Typography>
                  </Box>
                  <StatusChip label={contract.status} />
                </Stack>
                {canCreateInvoice && (
                  <Button
                    size="small"
                    variant={invoiceContractId === contract.id ? 'contained' : 'outlined'}
                    sx={{ mt: 1 }}
                    onClick={() => onToggleInvoice(contract)}
                  >
                    Invoice
                  </Button>
                )}
                {invoiceContractId === contract.id && (
                  <Box component="form" onSubmit={invoiceForm.handleSubmit(onCreateInvoice)} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 160px auto' }, gap: 1, mt: 1 }}>
                    <TextField size="small" label="Invoice number" value={invoiceForm.values.invoiceNumber} onChange={(event) => invoiceForm.setValue('invoiceNumber', event.target.value)} />
                    <TextField size="small" type="number" label="Amount cents" value={invoiceForm.values.amountCents} onChange={(event) => invoiceForm.setValue('amountCents', Number(event.target.value))} />
                    <Button type="submit" variant="contained" disabled={!invoiceForm.values.invoiceNumber || isCreatingInvoice}>Issue</Button>
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

      <Box sx={{ mt: 2 }}>
        <Button component={NextLink} href="/workspaces" variant="outlined" endIcon={<ArrowForwardOutlined />} sx={{ minHeight: 42 }}>
          Open delivery workspaces
        </Button>
      </Box>
    </Surface>
  );
}
