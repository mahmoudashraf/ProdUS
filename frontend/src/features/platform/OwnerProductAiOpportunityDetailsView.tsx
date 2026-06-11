'use client';

import {
  AutoAwesomeOutlined,
  PsychologyOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { ownerFacingAiText } from './ownerProductAiOpportunityModel';
import type {
  AiAssistedProductAnalysisResponse,
  AiOpportunityUseCase,
  ProductAiOpportunityContextResponse,
  ProductProfile,
} from './types';

interface OwnerProductAiOpportunityDetailsViewProps {
  context: ProductAiOpportunityContextResponse | undefined;
  latestAnalysis: AiAssistedProductAnalysisResponse | null;
  onRefresh: () => void;
  product: ProductProfile;
}

const cleanList = (items: Array<string | undefined>) =>
  Array.from(new Set(items.map((item) => item?.trim()).filter(Boolean))) as string[];

const shortChipLabel = (item: string) =>
  item.length > 44 ? `${item.slice(0, 41).trim()}...` : item;

export default function OwnerProductAiOpportunityDetailsView({
  context,
  latestAnalysis,
  onRefresh,
  product,
}: OwnerProductAiOpportunityDetailsViewProps) {
  const latestOverview = latestAnalysis?.loomaiIntegrationOverview?.live
    ? latestAnalysis.loomaiIntegrationOverview
    : undefined;
  const latestUseCases = latestAnalysis?.aiOpportunityReport?.live
    ? (latestAnalysis.aiOpportunityReport.useCases ?? [])
    : [];
  const useCases = latestUseCases.length ? latestUseCases : (context?.aiOpportunityReport?.useCases ?? []);
  const overview = latestOverview || context?.loomaiIntegrationOverview;
  const capabilities = overview?.capabilities?.length
    ? overview.capabilities
    : cleanList(useCases.map((useCase) => useCase.loomaiCapability || useCase.loomaiCapabilityCode));
  const implementationSteps = overview?.implementationSteps?.length
    ? overview.implementationSteps
    : cleanList(context?.recommendedServiceModules?.map((service) => service.moduleName || service.moduleCode) ?? []);
  const ownerDecisions = overview?.ownerDecisions?.length
    ? overview.ownerDecisions
    : context?.suggestedNextSteps ?? [];
  const services = context?.recommendedServiceModules ?? [];
  const scannerFocus = context?.scannerFocusAreas ?? [];
  const nextSteps = context?.suggestedNextSteps ?? [];
  const hasContext = !!context?.hasAcceptedContext;
  const hasLoomAiRead = !!latestOverview || hasContext;
  const overviewSummary = ownerFacingAiText(overview?.summary);
  const recommendedStartingPoint = ownerFacingAiText(overview?.recommendedStartingPoint);

  return (
    <Stack spacing={2}>
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #effcff 100%)' }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ lg: 'flex-start' }}
        >
          <Stack spacing={1.5} sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <PsychologyOutlined sx={{ color: appleColors.cyan }} />
              <Typography variant="h3">Opportunity details</Typography>
              <PastelChip
                label={latestOverview ? 'New AI result' : hasContext ? 'Product-specific' : 'Needs analysis'}
                accent={latestOverview || hasContext ? appleColors.green : appleColors.amber}
                bg={latestOverview || hasContext ? '#e7f8ee' : '#fff4dc'}
              />
            </Stack>
            <Typography color="text.secondary" sx={{ maxWidth: 860, lineHeight: 1.65 }}>
              {overviewSummary
                || context?.aiCreationSummary
                || product.aiCreationSummary
                || 'Review how the accepted AI opportunities shape LoomAI fit, services, launch checks, and owner next steps.'}
            </Typography>
          </Stack>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeOutlined />}
            onClick={onRefresh}
            sx={{ minHeight: 44, whiteSpace: 'normal' }}
          >
            Refresh analysis
          </Button>
        </Stack>
      </Surface>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
          gap: 1,
        }}
      >
        <Metric label="Opportunities" value={useCases.length} detail="Saved or latest" accent={appleColors.purple} />
        <Metric label="LoomAI capabilities" value={capabilities.length} detail="Fit signals" accent={appleColors.cyan} />
        <Metric label="Services" value={services.length} detail="Can shape delivery" accent={appleColors.green} />
        <Metric label="Checks to watch" value={scannerFocus.length} detail="Launch checks" accent={appleColors.amber} />
      </Box>

      <Surface>
        <Stack spacing={1.25}>
          <Typography variant="h4">LoomAI fit</Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {recommendedStartingPoint
              || (hasLoomAiRead
                ? 'Saved LoomAI fit needs a fresh analysis to replace an older provider diagnostic.'
                : 'Accept an AI opportunity refresh before choosing a LoomAI starting point.')}
          </Typography>
        </Stack>
      </Surface>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
        <ListSurface title="Capabilities to consider" items={capabilities} empty="No LoomAI capabilities have been accepted yet." />
        <ListSurface title="Starting path" items={implementationSteps} empty="No starting path has been accepted yet." />
        <ListSurface title="Owner decisions" items={ownerDecisions} empty="No owner decisions have been accepted yet." />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
        <ListSurface
          title="Services shaped by AI"
          items={services.map((service) => service.moduleName || service.moduleCode)}
          empty="No AI-shaped services have been accepted yet."
        />
        <ListSurface
          title="Launch checks to watch"
          items={scannerFocus}
          empty="No launch check focus areas have been accepted yet."
        />
        <ListSurface
          title="Next owner steps"
          items={nextSteps}
          empty="No next owner steps have been accepted yet."
        />
      </Box>

      <Surface>
        <Stack spacing={1.5}>
          <Typography variant="h4">Opportunities linked to LoomAI</Typography>
          {useCases.length ? (
            <Box sx={{ display: 'grid', gap: 1 }}>
              {useCases.slice(0, 6).map((useCase, index) => (
                <UseCaseRow key={`${useCase.title}-${index}`} useCase={useCase} index={index} />
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
              No accepted AI opportunities are linked to LoomAI yet. Refresh analysis and accept
              the useful items first.
            </Typography>
          )}
        </Stack>
      </Surface>
    </Stack>
  );
}

function Metric({
  accent,
  detail,
  label,
  value,
}: {
  accent: string;
  detail: string;
  label: string;
  value: number;
}) {
  return (
    <Surface sx={{ boxShadow: 'none', minHeight: 104 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>
        {label}
      </Typography>
      <Typography variant="h3" sx={{ mt: 0.5, color: accent }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {detail}
      </Typography>
    </Surface>
  );
}

function ListSurface({ empty, items, title }: { empty: string; items: string[]; title: string }) {
  return (
    <Surface>
      <Stack spacing={1}>
        <Typography variant="h4">{title}</Typography>
        {items.length ? (
          <Box component="ul" sx={{ m: 0, pl: 2.2 }}>
            {items.slice(0, 6).map((item, index) => (
              <Typography key={`${item}-${index}`} component="li" variant="body2" sx={{ mb: 0.7, lineHeight: 1.5 }}>
                {item}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {empty}
          </Typography>
        )}
      </Stack>
    </Surface>
  );
}

function UseCaseRow({ index, useCase }: { index: number; useCase: AiOpportunityUseCase }) {
  const tags = [
    useCase.priority ? formatLabel(useCase.priority) : 'Accepted',
    useCase.loomaiCapability || useCase.loomaiCapabilityCode || '',
    useCase.confidence ? `${Math.round(useCase.confidence * 100)}% confidence` : '',
  ].filter(Boolean);

  return (
    <Box sx={{ p: 1.35, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fff', minWidth: 0 }}>
      <Stack spacing={0.75} sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 950, lineHeight: 1.35 }}>
          {useCase.title || `Opportunity ${index + 1}`}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          {useCase.userValue || useCase.businessValue || useCase.workflow || 'Accepted LoomAI-linked opportunity.'}
        </Typography>
        <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap sx={{ minWidth: 0 }}>
          {tags.map((tag) => (
            <PastelChip key={tag} label={shortChipLabel(tag)} accent={appleColors.cyan} bg="#e4f9fd" />
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
