'use client';

import {
  ArrowForwardOutlined,
  FactCheckOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import WorkspaceCommandSubrouteActions, { type WorkspaceCommandSubrouteItem } from './WorkspaceCommandSubrouteActions';
import {
  PastelChip,
  ProgressRing,
  SectionTitle,
  StatusChip,
  Surface,
  appleColors,
} from './PlatformComponents';
import {
  type ServicePlanBuilderView,
  formatCompactMoney,
  servicePlanStatusAccent,
} from './servicePlanBuilderConfig';
import type { PackageInstance } from './types';

const servicePlanViewLabel: Record<ServicePlanBuilderView, string> = {
  summary: 'Plan Summary',
  services: 'Services',
  team: 'Team Match',
  commercial: 'Handoff',
};

const servicePlanRouteItems: WorkspaceCommandSubrouteItem<ServicePlanBuilderView>[] = [
  { value: 'summary', label: 'Plan Summary', accent: appleColors.purple },
  { value: 'services', label: 'Services', accent: appleColors.blue },
  { value: 'team', label: 'Team Match', accent: appleColors.cyan },
  { value: 'commercial', label: 'Handoff', accent: appleColors.green },
];

export function ServicePlanHeroPanel({
  selectedPackage,
  score,
  moduleCount,
  teamMatchCount,
  proposalCount,
  estimatedBudget,
  onChangeView,
}: {
  selectedPackage: PackageInstance;
  score: number;
  moduleCount: number;
  teamMatchCount: number;
  proposalCount: number;
  estimatedBudget: number;
  onChangeView: (view: ServicePlanBuilderView) => void;
}) {
  const accent = servicePlanStatusAccent(selectedPackage.status);
  const isReadyForTeam = moduleCount > 0 && selectedPackage.status !== 'DRAFT';
  const verdict = selectedPackage.status === 'DELIVERED'
    ? 'Delivered plan ready for proof review'
    : isReadyForTeam
      ? 'Service path ready for team review'
      : 'Finish the service path before delivery starts';

  return (
    <Surface sx={{ p: 0, overflow: 'hidden', background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)' }}>
      <Box sx={{ p: { xs: 2.25, md: 3 }, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 320px' }, gap: 3, alignItems: 'center' }}>
        <Stack spacing={2} sx={{ minWidth: 0 }}>
          <Box sx={{ alignSelf: 'flex-start' }}>
            <PastelChip label="Service plan decision" accent={accent} bg={`${accent}12`} />
          </Box>
          <Box>
            <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 42 }, letterSpacing: 0, mb: 1, overflowWrap: 'anywhere' }}>
              {verdict}
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 760, fontSize: 16, lineHeight: 1.7 }}>
              {selectedPackage.summary || 'Review the service sequence, matched delivery team, and commercial handoff before opening or continuing the workspace.'}
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button variant="contained" endIcon={<ArrowForwardOutlined />} onClick={() => onChangeView(teamMatchCount ? 'team' : 'services')} sx={{ minHeight: 44 }}>
              {teamMatchCount ? 'Review team match' : 'Review services'}
            </Button>
            <Button variant="outlined" onClick={() => onChangeView('commercial')} sx={{ minHeight: 44 }}>
              Prepare handoff
            </Button>
          </Stack>
        </Stack>

        <Surface sx={{ boxShadow: '0 18px 60px rgba(24, 119, 242, 0.12)' }}>
          <Stack spacing={2}>
            <SectionTitle title="Plan Snapshot" action={<FactCheckOutlined sx={{ color: accent }} />} />
            <Stack direction="row" spacing={2} alignItems="center">
              <ProgressRing value={score || 58} size={88} color={accent} label="/100" />
              <Box>
                <Typography variant="h4">{selectedPackage.name}</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  {selectedPackage.productProfile?.name || 'Product not linked yet'}
                </Typography>
              </Box>
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
              <PlanMiniMetric label="Services" value={moduleCount} />
              <PlanMiniMetric label="Teams" value={teamMatchCount} />
              <PlanMiniMetric label="Budget" value={formatCompactMoney(estimatedBudget, 'USD')} />
            </Box>
            <PastelChip label={`${proposalCount} proposals`} accent={appleColors.purple} bg="#f1efff" />
          </Stack>
        </Surface>
      </Box>
    </Surface>
  );
}

function PlanMiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <Box sx={{ minWidth: 0, p: 1.25, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fbfdff' }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 950, fontSize: 20, overflowWrap: 'anywhere' }}>{value}</Typography>
    </Box>
  );
}

export function ServicePlanJourneyPanel({
  value,
  moduleCount,
  teamMatchCount,
  proposalCount,
  contractCount,
  onChange,
}: {
  value?: ServicePlanBuilderView | null;
  moduleCount: number;
  teamMatchCount: number;
  proposalCount: number;
  contractCount: number;
  onChange: (view: ServicePlanBuilderView) => void;
}) {
  const items: JourneyStepItem<ServicePlanBuilderView>[] = [
    {
      value: 'summary',
      label: 'Plan Summary',
      detail: 'Owner answer, warnings, and readiness context.',
      accent: appleColors.purple,
      meta: <PastelChip label="Start here" accent={appleColors.purple} bg="#f1efff" />,
    },
    {
      value: 'services',
      label: 'Services',
      detail: 'Sequence and milestone gates for the work.',
      accent: appleColors.blue,
      meta: <PastelChip label={`${moduleCount}`} accent={appleColors.blue} bg="#eaf3ff" />,
    },
    {
      value: 'team',
      label: 'Team Match',
      detail: 'Who can deliver this plan and why.',
      accent: appleColors.cyan,
      meta: <PastelChip label={`${teamMatchCount}`} accent={appleColors.cyan} bg="#e4f9fd" />,
    },
    {
      value: 'commercial',
      label: 'Handoff',
      detail: 'Proposal, contract, invoice, and workspace transition.',
      accent: proposalCount || contractCount ? appleColors.green : appleColors.amber,
      meta: <PastelChip label={`${proposalCount + contractCount}`} accent={proposalCount || contractCount ? appleColors.green : appleColors.amber} bg={proposalCount || contractCount ? '#e7f8ee' : '#fff4dc'} />,
    },
  ];

  return (
    <Surface>
      <SectionTitle title="Choose Focus" action={<PastelChip label="Plan sections" accent={appleColors.purple} />} />
      <OwnerWorkspaceJourneyNav
        label="Service plan builder focus"
        value={value ?? null}
        items={items}
        onChange={onChange}
      />
    </Surface>
  );
}

export function ServicePlanDetailNavigation({
  currentView,
  onOpenHub,
}: {
  currentView?: ServicePlanBuilderView | null;
  onOpenHub: () => void;
}) {
  return (
    <WorkspaceBreadcrumbs
      items={[
        { label: 'Plan Library', onClick: onOpenHub },
        { label: currentView ? servicePlanViewLabel[currentView] : 'Plan Home' },
      ]}
      backLabel="Plan library"
      onBack={onOpenHub}
    />
  );
}

export function ServicePlanInternalRouteActions({
  currentView,
  onChange,
}: {
  currentView: ServicePlanBuilderView;
  onChange: (view: ServicePlanBuilderView) => void;
}) {
  return (
    <WorkspaceCommandSubrouteActions
      ariaLabel="Plan library internal pages"
      currentValue={currentView}
      items={servicePlanRouteItems}
      onChange={onChange}
    />
  );
}

export function ServicePlanSelectedContextPanel({
  selectedPackage,
  score,
  moduleCount,
  teamMatchCount,
  proposalCount,
  estimatedBudget,
}: {
  selectedPackage: PackageInstance;
  score: number;
  moduleCount: number;
  teamMatchCount: number;
  proposalCount: number;
  estimatedBudget: number;
}) {
  const accent = servicePlanStatusAccent(selectedPackage.status);

  return (
    <Surface sx={{ background: '#fff' }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} alignItems={{ lg: 'center' }} justifyContent="space-between">
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <ProgressRing value={score || 58} size={68} color={accent} label="/100" />
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
              <PastelChip label="Selected service plan" accent={accent} bg={`${accent}12`} />
              <StatusChip label={selectedPackage.status} />
            </Stack>
            <Typography variant="h3" sx={{ mt: 0.75, overflowWrap: 'anywhere' }}>
              {selectedPackage.name}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.35, overflowWrap: 'anywhere' }}>
              {selectedPackage.productProfile?.name || 'Product not linked yet'}
            </Typography>
          </Box>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' }, gap: 1, minWidth: { lg: 460 }, width: { xs: '100%', lg: 'auto' } }}>
          <PlanMiniMetric label="Services" value={moduleCount} />
          <PlanMiniMetric label="Teams" value={teamMatchCount} />
          <PlanMiniMetric label="Proposals" value={proposalCount} />
          <PlanMiniMetric label="Budget" value={formatCompactMoney(estimatedBudget, 'USD')} />
        </Box>
      </Stack>
    </Surface>
  );
}
