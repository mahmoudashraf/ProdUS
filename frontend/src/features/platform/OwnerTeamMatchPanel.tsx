'use client';

import { Box, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
} from './PlatformComponents';
import OwnerTeamFallbackPicker from './OwnerTeamFallbackPicker';
import OwnerTeamRecommendationCard from './OwnerTeamRecommendationCard';
import type {
  ExpertProfile,
  ProductizationCartTalentItem,
  QuoteProposal,
  Team,
  TeamRecommendation,
  TeamShortlist,
} from './types';

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
  const visibleRecommendations = recommendations.slice(0, 3);
  const hiddenRecommendationCount = Math.max(0, recommendations.length - visibleRecommendations.length);

  return (
    <Surface>
      <SectionTitle title="Team Match" action={<PastelChip label={`${recommendations.length} matches`} accent={appleColors.cyan} bg="#e4f9fd" />} />
      <Box sx={{ mb: 1.5, p: 1.5, borderRadius: 1, border: '1px solid', borderColor: '#bae6fd', bgcolor: '#f5fdff' }}>
        <Typography variant="h4">Match delivery support to the service path</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
          Shortlist the team that can prove the launch blockers were fixed, then carry that choice into Planning.
        </Typography>
      </Box>

      {recommendations.length ? (
        <Stack spacing={1.25}>
          {visibleRecommendations.map((recommendation) => {
            const proposal = productProposals.find((item) => item.team.id === recommendation.team.id);
            const cartTeamItem = cartTalentItems.find((item) => item.team?.id === recommendation.team.id);
            const compared = activeShortlists.some((item) => item.team.id === recommendation.team.id && item.status === 'COMPARED');
            const shortlisted = activeShortlists.some((item) => item.team.id === recommendation.team.id);

            return (
              <OwnerTeamRecommendationCard
                key={recommendation.team.id}
                recommendation={recommendation}
                proposal={proposal}
                cartTeamItem={cartTeamItem}
                compared={compared}
                shortlisted={shortlisted}
                isAddingTalent={isAddingTalent}
                isRemovingTalent={isRemovingTalent}
                isShortlisting={isShortlisting}
                isAcceptingProposal={isAcceptingProposal}
                onAddRecommendationTeam={onAddRecommendationTeam}
                onRemoveTalent={onRemoveTalent}
                onRecordShortlist={onRecordShortlist}
                onAcceptProposal={onAcceptProposal}
              />
            );
          })}
          {hiddenRecommendationCount > 0 && (
            <Box sx={{ p: 1.25, border: '1px dashed', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#f8fafc' }}>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                {hiddenRecommendationCount} more matches are available, but the owner only needs to compare the strongest shortlist here.
              </Typography>
            </Box>
          )}
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          <Box sx={{ p: 1.5, border: '1px dashed', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fbfdff' }}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {hasServicePlan ? 'No ranked team matches are available yet.' : 'Create a service plan to unlock ranked matches. You can still attach promising teams or solo experts to Planning now.'}
            </Typography>
          </Box>
          <OwnerTeamFallbackPicker
            suggestedTeams={suggestedTeams}
            suggestedExperts={suggestedExperts}
            cartTalentItems={cartTalentItems}
            isAddingTalent={isAddingTalent}
            isRemovingTalent={isRemovingTalent}
            onAddTeam={onAddTeam}
            onAddExpert={onAddExpert}
            onRemoveTalent={onRemoveTalent}
          />
        </Stack>
      )}
    </Surface>
  );
}
