'use client';

import { ArrowForwardOutlined, GroupsOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import NextLink from 'next/link';

import {
  EmptyState,
  PastelChip,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import type { SupportRequest, Team } from './types';

interface IWorkspaceSelectedTeamsPanelProps {
  supportList: SupportRequest[];
  onChooseTeam: () => void;
}

export default function WorkspaceSelectedTeamsPanel({
  supportList,
  onChooseTeam,
}: IWorkspaceSelectedTeamsPanelProps) {
  const teams = uniqueTeams(supportList);
  const openRequests = supportList.filter(
    request => !['RESOLVED', 'CANCELLED'].includes(request.status)
  );

  return (
    <Surface>
      <SectionTitle
        title="Selected team"
        action={
          <PastelChip
            label={
              teams.length ? `${teams.length} team${teams.length === 1 ? '' : 's'}` : 'No team yet'
            }
            accent={teams.length ? appleColors.cyan : appleColors.amber}
            bg={teams.length ? '#e4f9fd' : '#fff4dc'}
          />
        }
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.55 }}>
        The team currently attached to this workspace through active support and delivery requests.
      </Typography>

      {teams.length ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 1.25,
            mt: 1.5,
          }}
        >
          {teams.map(team => {
            const teamRequests = supportList.filter(request => request.team?.id === team.id);
            const teamOpenRequests = teamRequests.filter(
              request => !['RESOLVED', 'CANCELLED'].includes(request.status)
            );
            return (
              <Box
                key={team.id}
                sx={{
                  border: '1px solid',
                  borderColor: appleColors.line,
                  borderRadius: 1,
                  bgcolor: '#fff',
                  p: 1.3,
                }}
              >
                <Stack spacing={1}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="flex-start"
                    justifyContent="space-between"
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 950, overflowWrap: 'anywhere' }}
                      >
                        {team.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {team.headline || team.capabilitiesSummary || 'Workspace delivery team'}
                      </Typography>
                    </Box>
                    <StatusChip label={team.verificationStatus} />
                  </Stack>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    <PastelChip
                      label={`${teamOpenRequests.length} active ask${teamOpenRequests.length === 1 ? '' : 's'}`}
                      accent={teamOpenRequests.length ? appleColors.amber : appleColors.green}
                      bg={teamOpenRequests.length ? '#fff4dc' : '#e7f8ee'}
                    />
                    {team.timezone && (
                      <PastelChip label={team.timezone} accent={appleColors.blue} bg="#eaf3ff" />
                    )}
                    {team.typicalProjectSize && (
                      <PastelChip
                        label={team.typicalProjectSize}
                        accent={appleColors.purple}
                        bg="#f3edff"
                      />
                    )}
                  </Stack>
                  <Button
                    component={NextLink}
                    href={`/teams/${team.id}`}
                    variant="outlined"
                    endIcon={<ArrowForwardOutlined />}
                    sx={{ alignSelf: 'flex-start', minHeight: 38 }}
                  >
                    Open team page
                  </Button>
                </Stack>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Box sx={{ mt: 1.5 }}>
          <EmptyState label="No team is attached yet. Choose a team when this workspace needs delivery help, support, or specialist review." />
        </Box>
      )}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        sx={{ mt: 1.5 }}
      >
        <Stack direction="row" spacing={0.8} alignItems="center">
          <GroupsOutlined sx={{ color: appleColors.cyan }} />
          <Typography variant="body2" color="text.secondary">
            {openRequests.length
              ? `${openRequests.length} active team request${openRequests.length === 1 ? '' : 's'} in this workspace.`
              : 'Use support to attach the right team for this workspace.'}
          </Typography>
        </Stack>
        <Button variant="contained" onClick={onChooseTeam} sx={{ minHeight: 40 }}>
          Choose team
        </Button>
      </Stack>
    </Surface>
  );
}

function uniqueTeams(supportList: SupportRequest[]): Team[] {
  const byId = new Map<string, Team>();
  supportList.forEach(request => {
    if (request.team?.id) byId.set(request.team.id, request.team);
  });
  return Array.from(byId.values());
}
