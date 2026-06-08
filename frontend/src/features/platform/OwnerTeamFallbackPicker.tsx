'use client';

import {
  AddCircleOutlineOutlined,
  DeleteOutlineOutlined,
  GroupAddOutlined,
  PersonAddAltOutlined,
} from '@mui/icons-material';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { appleColors } from './PlatformComponents';
import type {
  ExpertProfile,
  ProductizationCartTalentItem,
  Team,
} from './types';

interface OwnerTeamFallbackPickerProps {
  suggestedTeams: Team[];
  suggestedExperts: ExpertProfile[];
  cartTalentItems: ProductizationCartTalentItem[];
  isAddingTalent: boolean;
  isRemovingTalent: boolean;
  onAddTeam: (team: Team) => void;
  onAddExpert: (expert: ExpertProfile) => void;
  onRemoveTalent: (itemId: string) => void;
}

export default function OwnerTeamFallbackPicker({
  suggestedTeams,
  suggestedExperts,
  cartTalentItems,
  isAddingTalent,
  isRemovingTalent,
  onAddTeam,
  onAddExpert,
  onRemoveTalent,
}: OwnerTeamFallbackPickerProps) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) minmax(0, 1fr)' }, gap: 1.5, minWidth: 0 }}>
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <GroupAddOutlined sx={{ color: appleColors.cyan }} />
          <Typography sx={{ fontWeight: 900 }}>Teams to consider</Typography>
        </Stack>
        <Stack spacing={1}>
          {suggestedTeams.map((team) => {
            const cartTeamItem = cartTalentItems.find((item) => item.team?.id === team.id);
            return (
              <Stack key={team.id} direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ border: '1px solid', borderColor: appleColors.line, borderRadius: 1, p: 1, minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
                <Box sx={{ minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
                  <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>{team.name}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>{team.headline || team.typicalProjectSize}</Typography>
                </Box>
                <IconButton
                  aria-label={cartTeamItem ? `Remove ${team.name}` : `Add ${team.name}`}
                  size="small"
                  onClick={() => cartTeamItem ? onRemoveTalent(cartTeamItem.id) : onAddTeam(team)}
                  disabled={isAddingTalent || isRemovingTalent}
                  sx={{ borderRadius: 1, color: cartTeamItem ? appleColors.red : appleColors.cyan, bgcolor: cartTeamItem ? '#fff7f8' : '#e4f9fd', flexShrink: 0 }}
                >
                  {cartTeamItem ? <DeleteOutlineOutlined fontSize="small" /> : <AddCircleOutlineOutlined fontSize="small" />}
                </IconButton>
              </Stack>
            );
          })}
        </Stack>
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <PersonAddAltOutlined sx={{ color: appleColors.purple }} />
          <Typography sx={{ fontWeight: 900 }}>Solo experts</Typography>
        </Stack>
        <Stack spacing={1}>
          {suggestedExperts.map((expert) => {
            const cartExpertItem = cartTalentItems.find((item) => item.expertProfile?.id === expert.id);
            return (
              <Stack key={expert.id} direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ border: '1px solid', borderColor: appleColors.line, borderRadius: 1, p: 1, minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
                <Box sx={{ minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
                  <Typography variant="body2" sx={{ fontWeight: 900 }} noWrap>{expert.displayName}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>{expert.headline || expert.skills}</Typography>
                </Box>
                <IconButton
                  aria-label={cartExpertItem ? `Remove ${expert.displayName}` : `Add ${expert.displayName}`}
                  size="small"
                  onClick={() => cartExpertItem ? onRemoveTalent(cartExpertItem.id) : onAddExpert(expert)}
                  disabled={isAddingTalent || isRemovingTalent}
                  sx={{ borderRadius: 1, color: cartExpertItem ? appleColors.red : appleColors.purple, bgcolor: cartExpertItem ? '#fff7f8' : '#f1efff', flexShrink: 0 }}
                >
                  {cartExpertItem ? <DeleteOutlineOutlined fontSize="small" /> : <AddCircleOutlineOutlined fontSize="small" />}
                </IconButton>
              </Stack>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}
