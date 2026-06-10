'use client';

import {
  AutoAwesomeOutlined,
  CheckCircleOutlineOutlined,
  CloudDoneOutlined,
  ArrowForwardOutlined,
  PsychologyOutlined,
  RuleOutlined,
} from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import { collectAiServiceRecommendations, selectableNextSteps, selectableScannerFocus } from './ownerProductAiOpportunityModel';
import type { ReactNode } from 'react';
import type {
  AiAssistedProductAnalysisResponse,
  ProductAiOpportunityContextResponse,
  ProductProfile,
} from './types';

interface OwnerProductAiOpportunityHomeProps {
  context: ProductAiOpportunityContextResponse | undefined;
  latestAnalysis: AiAssistedProductAnalysisResponse | null;
  onRefresh: () => void;
  onViewLoomAi: () => void;
  product: ProductProfile;
  selectedItemCount: number;
}

const dateLabel = (value?: string) => {
  if (!value) return 'Not accepted yet';
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value));
};

const listOrFallback = (items: string[] | undefined, fallback: string) =>
  items && items.length ? items : [fallback];

const shortChipLabel = (item: string) =>
  item.length > 44 ? `${item.slice(0, 41).trim()}...` : item;

export default function OwnerProductAiOpportunityHome({
  context,
  latestAnalysis,
  onRefresh,
  onViewLoomAi,
  product,
  selectedItemCount,
}: OwnerProductAiOpportunityHomeProps) {
  const acceptedUseCases = context?.aiOpportunityReport?.useCases ?? [];
  const acceptedServices = context?.recommendedServiceModules ?? [];
  const acceptedScannerFocus = context?.scannerFocusAreas ?? [];
  const acceptedNextSteps = context?.suggestedNextSteps ?? [];
  const hasContext = !!context?.hasAcceptedContext;
  const newUseCases = latestAnalysis?.aiOpportunityReport?.useCases ?? [];
  const newServices = latestAnalysis ? collectAiServiceRecommendations(latestAnalysis) : [];
  const newScannerFocus = latestAnalysis ? selectableScannerFocus(latestAnalysis) : [];
  const newNextSteps = latestAnalysis ? selectableNextSteps(latestAnalysis) : [];
  const loomAiCapabilities = context?.loomaiIntegrationOverview?.capabilities?.length
    ? context.loomaiIntegrationOverview.capabilities
    : acceptedUseCases
      .map((useCase) => useCase.loomaiCapability || useCase.loomaiCapabilityCode)
      .filter(Boolean) as string[];
  const loomAiDecisions = context?.loomaiIntegrationOverview?.ownerDecisions?.length
    ? context.loomaiIntegrationOverview.ownerDecisions
    : acceptedNextSteps;

  return (
    <Stack spacing={2}>
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f6fbff 100%)' }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ lg: 'flex-start' }}>
          <Stack spacing={1.75} sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <PsychologyOutlined sx={{ color: appleColors.purple }} />
              <Typography variant="h3">AI opportunities home</Typography>
              <PastelChip
                label={hasContext ? 'Accepted context' : 'Needs first acceptance'}
                accent={hasContext ? appleColors.green : appleColors.amber}
                bg={hasContext ? '#e7f8ee' : '#fff4dc'}
              />
            </Stack>
            <Typography color="text.secondary" sx={{ maxWidth: 860, lineHeight: 1.65 }}>
              {hasContext
                ? context?.aiCreationSummary || context?.aiOpportunityReport?.summary || product.aiCreationSummary || 'These are the AI opportunities currently saved for this product.'
                : 'No AI opportunity context has been accepted for this product yet. Refresh analysis, review the result, then accept only what should shape the product plan.'}
            </Typography>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row', lg: 'column' }} spacing={1} sx={{ minWidth: { lg: 220 } }}>
            <Button variant="contained" startIcon={<AutoAwesomeOutlined />} onClick={onRefresh} sx={{ minHeight: 44, whiteSpace: 'normal' }}>
              Refresh analysis
            </Button>
            <Button variant="outlined" endIcon={<ArrowForwardOutlined />} onClick={onViewLoomAi} sx={{ minHeight: 44, whiteSpace: 'normal' }}>
              LoomAI integration
            </Button>
          </Stack>
        </Stack>
        <Box sx={{ mt: 1.75 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 1 }}>
            <HomeMetric icon={<AutoAwesomeOutlined />} label="Accepted opportunities" value={acceptedUseCases.length} detail={hasContext ? 'Saved to this product' : 'Waiting for owner approval'} accent={appleColors.purple} />
            <HomeMetric icon={<CheckCircleOutlineOutlined />} label="Services shaped" value={acceptedServices.length} detail="Catalog-backed modules" accent={appleColors.green} />
            <HomeMetric icon={<RuleOutlined />} label="Scanner focus" value={acceptedScannerFocus.length} detail="Areas AI says to watch" accent={appleColors.amber} />
            <HomeMetric icon={<CloudDoneOutlined />} label="AI files used" value={context?.aiSourceAttachmentCount ?? product.aiSourceAttachmentCount ?? 0} detail={dateLabel(context?.ownerApprovedAt)} accent={appleColors.cyan} />
          </Box>
        </Box>
      </Surface>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.15fr) minmax(320px, 0.85fr)' }, gap: 2 }}>
        <Surface>
          <Stack spacing={1.5}>
            <SectionHeading title="Current accepted opportunities" subtitle={hasContext ? 'What the product is already using from AI analysis.' : 'Nothing accepted yet.'} />
            {hasContext && acceptedUseCases.length ? (
              <Box sx={{ display: 'grid', gap: 1 }}>
                {acceptedUseCases.slice(0, 4).map((useCase, index) => (
                  <HomeListItem
                    key={`${useCase.title || 'opportunity'}-${index}`}
                    title={useCase.title || `Opportunity ${index + 1}`}
                    detail={useCase.userValue || useCase.businessValue || useCase.workflow || 'Saved product-specific AI opportunity.'}
                    meta={[
                      useCase.priority ? formatLabel(useCase.priority) : 'Saved',
                      useCase.loomaiCapability || useCase.loomaiCapabilityCode || '',
                    ].filter(Boolean)}
                  />
                ))}
              </Box>
            ) : (
              <Box sx={{ p: 1.5, border: '1px dashed', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#f8fafc' }}>
                <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  After the owner accepts an AI opportunity result, the saved opportunities will appear here.
                </Typography>
              </Box>
            )}
          </Stack>
        </Surface>

        <Surface>
          <Stack spacing={1.5}>
            <SectionHeading title="LoomAI integration" subtitle={context?.loomaiIntegrationOverview?.recommendedStartingPoint || 'Recommended fit, decisions, and delivery path.'} />
            <CompactList
              title="Capabilities"
              items={listOrFallback(loomAiCapabilities, 'No accepted LoomAI capabilities yet.')}
            />
            <CompactList
              title="Owner decisions"
              items={listOrFallback(loomAiDecisions, 'Accept an analysis result to see the owner decisions.')}
            />
          </Stack>
        </Surface>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
        <Surface>
          <Stack spacing={1.5}>
            <SectionHeading title="Services and scanner focus" subtitle="How the accepted AI context affects the work plan." />
            <CompactList
              title="Services"
              items={acceptedServices.length
                ? acceptedServices.slice(0, 5).map((service) => service.moduleName || service.moduleCode)
                : ['No AI-shaped services accepted yet.']}
            />
            <CompactList
              title="Scanner focus"
              items={acceptedScannerFocus.length ? acceptedScannerFocus : ['No AI scanner focus accepted yet.']}
            />
          </Stack>
        </Surface>

        <Surface>
          <Stack spacing={1.5}>
            <SectionHeading title="Next owner steps" subtitle="The accepted path this product should follow next." />
            <CompactList
              title="Do next"
              items={acceptedNextSteps.length ? acceptedNextSteps : ['Accept a refresh result to create AI-backed next steps.']}
            />
          </Stack>
        </Surface>
      </Box>

      <Surface sx={{ borderColor: latestAnalysis ? `${appleColors.purple}55` : appleColors.line, background: latestAnalysis ? '#fbfaff' : '#fff' }}>
        <Stack spacing={1.25}>
          <SectionHeading
            title={latestAnalysis ? 'New scan result waiting' : 'Refresh workspace'}
            subtitle={latestAnalysis
              ? 'Open the refresh view to review and accept only the items that should update this product.'
              : 'Use the refresh view when the repo, pitch, customer insight, or LoomAI integration idea changes.'}
          />
          {latestAnalysis ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, minmax(0, 1fr))' }, gap: 1 }}>
              <HomeMetric icon={<AutoAwesomeOutlined />} label="New opportunities" value={newUseCases.length} detail="Found in latest refresh" accent={appleColors.purple} />
              <HomeMetric icon={<CheckCircleOutlineOutlined />} label="New services" value={newServices.length} detail="Suggested modules" accent={appleColors.green} />
              <HomeMetric icon={<RuleOutlined />} label="New focus areas" value={newScannerFocus.length} detail={`${newNextSteps.length} next steps`} accent={appleColors.amber} />
              <HomeMetric icon={<CloudDoneOutlined />} label="Selected to save" value={selectedItemCount} detail="Owner-approved changes" accent={appleColors.cyan} />
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
              No new refresh result is waiting. Open refresh analysis when you want a new proposal.
            </Typography>
          )}
          <Button variant="outlined" endIcon={<ArrowForwardOutlined />} onClick={onRefresh} sx={{ alignSelf: 'flex-start', minHeight: 40 }}>
            Open refresh analysis
          </Button>
        </Stack>
      </Surface>
    </Stack>
  );
}

function HomeMetric({
  accent,
  detail,
  icon,
  label,
  value,
}: {
  accent: string;
  detail: string;
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Box sx={{ p: 1.4, border: '1px solid', borderColor: `${accent}2f`, borderRadius: 1, bgcolor: '#fff', minHeight: 112 }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ color: accent, display: 'grid', placeItems: 'center' }}>{icon}</Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>
            {label}
          </Typography>
        </Stack>
        <Typography variant="h3" sx={{ color: accent }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {detail}
        </Typography>
      </Stack>
    </Box>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Box>
      <Typography variant="h4">{title}</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
        {subtitle}
      </Typography>
    </Box>
  );
}

function HomeListItem({ detail, meta, title }: { detail: string; meta: string[]; title: string }) {
  return (
    <Box sx={{ p: 1.35, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fff', minWidth: 0 }}>
      <Stack spacing={0.75} sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 950, overflowWrap: 'anywhere' }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          {detail}
        </Typography>
        {meta.length > 0 && (
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ minWidth: 0 }}>
            {meta.map((item) => (
              <PastelChip key={item} label={shortChipLabel(item)} accent={appleColors.purple} bg="#f1efff" />
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

function CompactList({ items, title }: { items: string[]; title: string }) {
  return (
    <Stack spacing={0.75}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>
        {title}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.2 }}>
        {items.slice(0, 6).map((item, index) => (
          <Typography key={`${item}-${index}`} component="li" variant="body2" sx={{ mb: 0.65, lineHeight: 1.5 }}>
            {item}
          </Typography>
        ))}
      </Box>
    </Stack>
  );
}
