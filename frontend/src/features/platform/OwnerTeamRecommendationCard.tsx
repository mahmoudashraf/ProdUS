'use client';

import {
  CheckCircleOutlineOutlined,
  CompareArrowsOutlined,
  DeleteOutlineOutlined,
  GroupAddOutlined,
  PlaylistAddCheckOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  DotLabel,
  ProgressRing,
  StatusChip,
  appleColors,
} from './PlatformComponents';
import type {
  ProductizationCartTalentItem,
  QuoteProposal,
  TeamRecommendation,
  TeamShortlist,
} from './types';

const formatMoney = (amountCents: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format((amountCents || 0) / 100);

interface OwnerTeamRecommendationCardProps {
  recommendation: TeamRecommendation;
  proposal?: QuoteProposal | undefined;
  cartTeamItem?: ProductizationCartTalentItem | undefined;
  compared: boolean;
  shortlisted: boolean;
  isAddingTalent: boolean;
  isRemovingTalent: boolean;
  isShortlisting: boolean;
  isAcceptingProposal: boolean;
  onAddRecommendationTeam: (recommendation: TeamRecommendation) => void;
  onRemoveTalent: (itemId: string) => void;
  onRecordShortlist: (teamId: string, status: TeamShortlist['status']) => void;
  onAcceptProposal: (proposalId: string) => void;
}

export default function OwnerTeamRecommendationCard({
  recommendation,
  proposal,
  cartTeamItem,
  compared,
  shortlisted,
  isAddingTalent,
  isRemovingTalent,
  isShortlisting,
  isAcceptingProposal,
  onAddRecommendationTeam,
  onRemoveTalent,
  onRecordShortlist,
  onAcceptProposal,
}: OwnerTeamRecommendationCardProps) {
  const proposalTotal = proposal ? formatMoney(proposal.fixedPriceCents + proposal.platformFeeCents, proposal.currency) : null;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '82px minmax(0, 1fr) minmax(220px, 0.82fr)' },
        gap: 1.5,
        alignItems: 'start',
        p: 1.5,
        border: '1px solid',
        borderColor: cartTeamItem ? '#bae6fd' : 'divider',
        borderRadius: 1,
        bgcolor: cartTeamItem ? '#f5fdff' : '#fff',
      }}
    >
      <ProgressRing value={Math.round(recommendation.score * 100)} size={72} color={appleColors.cyan} label="match" />

      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography variant="h4">{recommendation.team.name}</Typography>
          {cartTeamItem && <StatusChip label="Attached" color="success" />}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
          {recommendation.team.timezone || recommendation.team.typicalProjectSize || 'Delivery team'}
        </Typography>
        {proposalTotal && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
            {proposalTotal} · {proposal?.timelineDays} days
          </Typography>
        )}

        <Stack spacing={0.5} sx={{ mt: 1 }}>
          {recommendation.reasons.slice(0, 3).map((reason) => (
            <DotLabel key={reason} label={reason} color={appleColors.green} />
          ))}
        </Stack>
      </Box>

      <Stack spacing={1} sx={{ minWidth: 0 }}>
        {proposal?.status === 'SUBMITTED' ? (
          <Button
            variant="contained"
            size="small"
            startIcon={<PlaylistAddCheckOutlined />}
            onClick={() => onAcceptProposal(proposal.id)}
            disabled={isAcceptingProposal}
            sx={{ minHeight: 38 }}
          >
            Approve Proposal
          </Button>
        ) : (
          <Button
            variant={cartTeamItem ? 'outlined' : 'contained'}
            size="small"
            startIcon={cartTeamItem ? <DeleteOutlineOutlined /> : <GroupAddOutlined />}
            onClick={() => {
              if (cartTeamItem) {
                onRemoveTalent(cartTeamItem.id);
              } else {
                onAddRecommendationTeam(recommendation);
              }
            }}
            disabled={isAddingTalent || isRemovingTalent}
            sx={{ minHeight: 38 }}
          >
            {cartTeamItem ? 'Remove Team' : 'Attach Team'}
          </Button>
        )}

        <Stack direction="row" spacing={1}>
          <Button
            variant={shortlisted ? 'contained' : 'outlined'}
            size="small"
            startIcon={<CheckCircleOutlineOutlined />}
            onClick={() => onRecordShortlist(recommendation.team.id, 'ACTIVE')}
            disabled={isShortlisting}
            sx={{ flex: 1, minHeight: 36 }}
          >
            Shortlist
          </Button>
          <Button
            variant={compared ? 'contained' : 'outlined'}
            size="small"
            startIcon={<CompareArrowsOutlined />}
            onClick={() => onRecordShortlist(recommendation.team.id, 'COMPARED')}
            disabled={isShortlisting}
            sx={{ flex: 1, minHeight: 36 }}
          >
            Compare
          </Button>
        </Stack>

        {proposal?.status !== 'SUBMITTED' && (
          <StatusChip label={proposal?.status || recommendation.team.verificationStatus} color={proposal?.status === 'OWNER_ACCEPTED' ? 'success' : 'default'} />
        )}
      </Stack>
    </Box>
  );
}
