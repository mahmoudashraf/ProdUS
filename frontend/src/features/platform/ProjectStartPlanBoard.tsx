'use client';

import type { ComponentProps } from 'react';
import { Box, Stack } from '@mui/material';
import { ProjectStartJourneyNavigation } from './ProjectStartJourneyNavigation';
import ProjectStartApprovalPanel from './ProjectStartApprovalPanel';
import ProjectStartLifecycleServicesPanel from './ProjectStartLifecycleServicesPanel';
import ProjectStartPackageTemplatesPanel from './ProjectStartPackageTemplatesPanel';
import ProjectStartPlanOverview from './ProjectStartPlanOverview';
import ProjectStartReadinessPanel from './ProjectStartReadinessPanel';
import ProjectStartTalentPanel from './ProjectStartTalentPanel';

type OverviewProps = ComponentProps<typeof ProjectStartPlanOverview>;
type NavigationProps = ComponentProps<typeof ProjectStartJourneyNavigation>;
type TemplatesProps = ComponentProps<typeof ProjectStartPackageTemplatesPanel>;
type ServicesProps = ComponentProps<typeof ProjectStartLifecycleServicesPanel>;
type ReadinessProps = ComponentProps<typeof ProjectStartReadinessPanel>;
type TalentProps = ComponentProps<typeof ProjectStartTalentPanel>;
type ApprovalProps = ComponentProps<typeof ProjectStartApprovalPanel>;

interface ProjectStartPlanBoardProps {
  detailOpen: boolean;
  view: NavigationProps['value'];
  overview: OverviewProps;
  navigation: NavigationProps;
  templates: TemplatesProps;
  services: ServicesProps;
  readiness: ReadinessProps;
  talent: TalentProps;
  approval: ApprovalProps;
}

export default function ProjectStartPlanBoard({
  detailOpen,
  view,
  overview,
  navigation,
  templates,
  services,
  readiness,
  talent,
  approval,
}: ProjectStartPlanBoardProps) {
  return (
    <Box sx={{ minWidth: 0, display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', xl: detailOpen && view === 'handoff' ? 'minmax(0, 1fr) 360px' : 'minmax(0, 1fr)' }, gap: 2.5 }}>
      <Stack spacing={2.5} sx={{ minWidth: 0 }}>
        <ProjectStartPlanOverview {...overview} />
        <ProjectStartJourneyNavigation {...navigation} />

        {detailOpen && view === 'readiness' && (
          <ProjectStartPackageTemplatesPanel {...templates} />
        )}

        {detailOpen && view === 'services' && (
          <ProjectStartLifecycleServicesPanel {...services} />
        )}

        {detailOpen && view === 'readiness' && (
          <ProjectStartReadinessPanel {...readiness} />
        )}

        {detailOpen && view === 'talent' && (
          <ProjectStartTalentPanel {...talent} />
        )}
      </Stack>

      {detailOpen && view === 'handoff' && (
        <ProjectStartApprovalPanel {...approval} />
      )}
    </Box>
  );
}
