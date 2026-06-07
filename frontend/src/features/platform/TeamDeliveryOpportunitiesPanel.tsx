'use client';

import { Box, Stack, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import { formatDeliveryMoney } from './teamDeliveryUtils';
import type { QuoteProposal } from './types';

export default function TeamDeliveryOpportunitiesPanel({
  proposals,
}: {
  proposals: QuoteProposal[];
}) {
  return (
    <Surface>
      <SectionTitle title="Proposal Queue" action={<PastelChip label={`${proposals.length} records`} accent={appleColors.purple} />} />
      {proposals.length ? (
        <Stack spacing={0}>
          {proposals.slice(0, 6).map((proposal, index) => (
            <Box key={proposal.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.3fr 1fr 130px 120px' }, gap: 1.5, alignItems: 'center', py: 1.75, borderTop: index === 0 ? 0 : '1px solid', borderColor: 'divider' }}>
              <Box>
                <Typography sx={{ fontWeight: 900 }}>{proposal.title}</Typography>
                <Typography variant="body2" color="text.secondary">{proposal.packageInstance?.productProfile?.name || proposal.packageInstance?.name}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">{proposal.scope || 'Scope details pending.'}</Typography>
              <Typography sx={{ fontWeight: 900 }}>{formatDeliveryMoney(proposal.fixedPriceCents + proposal.platformFeeCents, proposal.currency)}</Typography>
              <StatusChip label={proposal.status} color={proposal.status === 'OWNER_ACCEPTED' ? 'success' : 'default'} />
            </Box>
          ))}
        </Stack>
      ) : (
        <EmptyState label="No proposals are visible for this team yet." />
      )}
    </Surface>
  );
}
