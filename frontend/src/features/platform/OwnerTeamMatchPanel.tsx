'use client';

import {
  AddCircleOutlineOutlined,
  DeleteOutlineOutlined,
  GroupAddOutlined,
  PersonAddAltOutlined,
} from '@mui/icons-material';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import {
  DotLabel,
  PastelChip,
  ProgressRing,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import type {
  ExpertProfile,
  ProductizationCartTalentItem,
  QuoteProposal,
  Team,
  TeamRecommendation,
  TeamShortlist,
} from './types';

const formatMoney = (amountCents: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format((amountCents || 0) / 100);

interface OwnerTeamMatchPanelProps {
  recommendations: TeamRecommendation[];
  productProposals: QuoteProposal[];
  cartTalentItems: ProductizationCartTalentItem[];
  activeShortlists: TeamShortlist[];
  suggestedTeams: Team[];
  suggestedExperts: ExpertProfile[];
  hasServicePlan: boolean;
  isAddingTalent: boolean;
  isRemovingTalent: boolean;
  isShortlisting: boolean;
  isAcceptingProposal: boolean;
  onAddRecommendationTeam: (recommendation: TeamRecommendation) => void;
  onAddTeam: (team: Team) => void;
  onAddExpert: (expert: ExpertProfile) => void;
  onRemoveTalent: (itemId: string) => void;
  onRecordShortlist: (teamId: string, status: TeamShortlist['status']) => void;
  onAcceptProposal: (proposalId: string) => void;
}

export default function OwnerTeamMatchPanel({
  recommendations,
  productProposals,
  cartTalentItems,
  activeShortlists,
  suggestedTeams,
  suggestedExperts,
  hasServicePlan,
  isAddingTalent,
  isRemovingTalent,
  isShortlisting,
  isAcceptingProposal,
  onAddRecommendationTeam,
  onAddTeam,
  onAddExpert,
  onRemoveTalent,
  onRecordShortlist,
  onAcceptProposal,
}: OwnerTeamMatchPanelProps) {
  return (
    <Surface>
      <SectionTitle title="Team Match" action={<PastelChip label={`${recommendations.length} matches`} accent={appleColors.cyan} bg="#e4f9fd" />} />
      <Box sx={{ mb: 1.5, p: 1.5, borderRadius: 1, border: '1px solid', borderColor: '#bae6fd', bgcolor: '#f5fdff' }}>
        <Typography variant="h4">Match delivery support to the service path</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
          Shortlist the team that can prove the launch blockers were fixed, then carry that choice into the project start plan.
        </Typography>
      </Box>

      {recommendations.length ? (
        <Stack spacing={1.25}>
          {recommendations.slice(0, 4).map((recommendation, index) => {
            const proposal = productProposals.find((item) => item.team.id === recommendation.team.id);
            const cartTeamItem = cartTalentItems.find((item) => item.team?.id === recommendation.team.id);
            const compared = activeShortlists.some((item) => item.team.id === recommendation.team.id && item.status === 'COMPARED');
            const shortlisted = activeShortlists.some((item) => item.team.id === recommendation.team.id);

            return (
              <Box
                key={recommendation.team.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: '82px minmax(0, 1.2fr) minmax(0, 1.45fr) auto' },
                  gap: 1.5,
                  alignItems: 'center',
                  py: 1.5,
                  borderTop: index === 0 ? 0 : '1px solid',
                  borderColor: 'divider',
                }}
              >
                <ProgressRing value={Math.round(recommendation.score * 100)} size={72} color={appleColors.cyan} label="match" />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h4">{recommendation.team.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{recommendation.team.timezone || recommendation.team.typicalProjectSize}</Typography>
                  {proposal && <Typography variant="body2" color="text.secondary">{formatMoney(proposal.fixedPriceCents + proposal.platformFeeCents, proposal.currency)} · {proposal.timelineDays} days</Typography>}
                </Box>
                <Stack spacing={0.5}>
                  {recommendation.reasons.slice(0, 3).map((reason) => <DotLabel key={reason} label={reason} color={appleColors.green} />)}
                </Stack>
                <Stack spacing={1} sx={{ minWidth: { lg: 132 } }}>
                  <Button
                    variant={cartTeamItem ? 'contained' : 'outlined'}
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
                  >
                    {cartTeamItem ? 'Remove Team' : 'Attach Team'}
                  </Button>
                  <Button
                    variant={compared ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => onRecordShortlist(recommendation.team.id, 'COMPARED')}
                    disabled={isShortlisting}
                  >
                    Compare
                  </Button>
                  <Button
                    variant={shortlisted ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => onRecordShortlist(recommendation.team.id, 'ACTIVE')}
                    disabled={isShortlisting}
                  >
                    Shortlist
                  </Button>
                  {proposal?.status === 'SUBMITTED' ? (
                    <Button variant="contained" size="small" onClick={() => onAcceptProposal(proposal.id)} disabled={isAcceptingProposal}>
                      Accept
                    </Button>
                  ) : (
                    <StatusChip label={proposal?.status || recommendation.team.verificationStatus} color={proposal?.status === 'OWNER_ACCEPTED' ? 'success' : 'default'} />
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          <Box sx={{ p: 1.5, border: '1px dashed', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fbfdff' }}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {hasServicePlan ? 'No ranked team matches are available yet.' : 'Create a service plan to unlock ranked matches. You can still attach promising teams or solo experts to the project start plan now.'}
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.5 }}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <GroupAddOutlined sx={{ color: appleColors.cyan }} />
                <Typography sx={{ fontWeight: 900 }}>Teams to consider</Typography>
              </Stack>
              <Stack spacing={1}>
                {suggestedTeams.map((team) => {
                  const cartTeamItem = cartTalentItems.find((item) => item.team?.id === team.id);
                  return (
                    <Stack key={team.id} direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ border: '1px solid', borderColor: appleColors.line, borderRadius: 1, p: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>{team.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{team.headline || team.typicalProjectSize}</Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => cartTeamItem ? onRemoveTalent(cartTeamItem.id) : onAddTeam(team)}
                        disabled={isAddingTalent || isRemovingTalent}
                        sx={{ borderRadius: 1, color: cartTeamItem ? appleColors.red : appleColors.cyan, bgcolor: cartTeamItem ? '#fff7f8' : '#e4f9fd' }}
                      >
                        {cartTeamItem ? <DeleteOutlineOutlined fontSize="small" /> : <AddCircleOutlineOutlined fontSize="small" />}
                      </IconButton>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <PersonAddAltOutlined sx={{ color: appleColors.purple }} />
                <Typography sx={{ fontWeight: 900 }}>Solo experts</Typography>
              </Stack>
              <Stack spacing={1}>
                {suggestedExperts.map((expert) => {
                  const cartExpertItem = cartTalentItems.find((item) => item.expertProfile?.id === expert.id);
                  return (
                    <Stack key={expert.id} direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ border: '1px solid', borderColor: appleColors.line, borderRadius: 1, p: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>{expert.displayName}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{expert.headline || expert.skills}</Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => cartExpertItem ? onRemoveTalent(cartExpertItem.id) : onAddExpert(expert)}
                        disabled={isAddingTalent || isRemovingTalent}
                        sx={{ borderRadius: 1, color: cartExpertItem ? appleColors.red : appleColors.purple, bgcolor: cartExpertItem ? '#fff7f8' : '#f1efff' }}
                      >
                        {cartExpertItem ? <DeleteOutlineOutlined fontSize="small" /> : <AddCircleOutlineOutlined fontSize="small" />}
                      </IconButton>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          </Box>
        </Stack>
      )}
    </Surface>
  );
}
