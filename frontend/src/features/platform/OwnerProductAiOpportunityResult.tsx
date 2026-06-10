'use client';

import {
  AutoAwesomeOutlined,
  CheckCircleOutlineOutlined,
  PsychologyOutlined,
  RuleOutlined,
} from '@mui/icons-material';
import type { ReactNode } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import {
  DotLabel,
  EmptyState,
  PastelChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import {
  collectAiServiceRecommendations,
  selectableNextSteps,
  selectableScannerFocus,
  serviceRecommendationKey,
  useCaseKey,
  type AiOpportunitySelectionState,
} from './ownerProductAiOpportunityModel';
import type { AiAssistedProductAnalysisResponse } from './types';

interface OwnerProductAiOpportunityResultProps {
  analysis: AiAssistedProductAnalysisResponse | null;
  focus: 'opportunities' | 'refresh' | 'loomai';
  selection: AiOpportunitySelectionState;
  onSelectAll: () => void;
  onSelectionChange: (selection: AiOpportunitySelectionState) => void;
}

const toggleValue = (values: string[], value: string, checked: boolean) =>
  checked ? [...new Set([...values, value])] : values.filter((item) => item !== value);

const shortChipLabel = (item: string) =>
  item.length > 44 ? `${item.slice(0, 41).trim()}...` : item;

export default function OwnerProductAiOpportunityResult({
  analysis,
  focus,
  selection,
  onSelectAll,
  onSelectionChange,
}: OwnerProductAiOpportunityResultProps) {
  if (!analysis) {
    return (
      <EmptyState label="Refresh analysis to review product-specific ideas, LoomAI fit, service modules, scanner focus, and next owner steps." />
    );
  }

  const report = analysis.aiOpportunityReport;
  const overview = analysis.loomaiIntegrationOverview;
  const useCases = report?.useCases ?? [];
  const serviceRecommendations = collectAiServiceRecommendations(analysis);
  const scannerFocus = selectableScannerFocus(analysis);
  const nextSteps = selectableNextSteps(analysis);
  const selectedCount =
    selection.useCaseKeys.length
    + selection.serviceModuleKeys.length
    + selection.scannerFocus.length
    + selection.nextSteps.length;

  return (
    <Stack spacing={2}>
      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #fbfaff 100%)' }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ md: 'flex-start' }}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="h3">
                  {focus === 'loomai' ? 'LoomAI integration path' : 'AI opportunities found'}
                </Typography>
                <PastelChip
                  label={analysis.aiApplied ? 'Live analysis' : 'Prepared'}
                  accent={analysis.aiApplied ? appleColors.green : appleColors.amber}
                  bg={analysis.aiApplied ? '#e7f8ee' : '#fff4dc'}
                />
              </Stack>
              <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 780, lineHeight: 1.6 }}>
                {focus === 'loomai'
                  ? overview?.summary || report?.summary || 'Review the recommended LoomAI starting point and the product changes it supports.'
                  : report?.summary || overview?.summary || 'Review the opportunities and choose what should update this product.'}
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="outlined" onClick={onSelectAll} sx={{ minHeight: 40, whiteSpace: 'normal' }}>
                Select all
              </Button>
              <Button
                variant="text"
                onClick={() => onSelectionChange({ useCaseKeys: [], serviceModuleKeys: [], scannerFocus: [], nextSteps: [] })}
                sx={{ minHeight: 40, whiteSpace: 'normal' }}
              >
                Clear
              </Button>
            </Stack>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1 }}>
            <SummaryTile label="Selected" value={selectedCount} detail="items to save" accent={appleColors.purple} />
            <SummaryTile label="Use cases" value={selection.useCaseKeys.length} detail={`${useCases.length} found`} accent={appleColors.cyan} />
            <SummaryTile label="Services" value={selection.serviceModuleKeys.length} detail={`${serviceRecommendations.length} suggested`} accent={appleColors.green} />
            <SummaryTile label="Files shared" value={analysis.aiSharedDocuments.length} detail="AI context files" accent={appleColors.amber} />
          </Box>
        </Stack>
      </Surface>

      {focus === 'loomai' && overview && (
        <Surface>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <PsychologyOutlined sx={{ color: appleColors.cyan }} />
              <Typography variant="h4">Recommended LoomAI start</Typography>
              <DotLabel label={overview.live ? 'LoomAI live' : 'Prepared'} color={overview.live ? appleColors.green : appleColors.amber} />
            </Stack>
            {overview.recommendedStartingPoint && (
              <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: '#f5fcff', border: '1px solid #d9f3f8' }}>
                <Typography variant="body2" sx={{ fontWeight: 950, lineHeight: 1.45 }}>
                  {overview.recommendedStartingPoint}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
              <SimpleList title="Capabilities" items={overview.capabilities ?? []} />
              <SimpleList title="Implementation steps" items={overview.implementationSteps ?? []} />
              <SimpleList title="Owner decisions" items={overview.ownerDecisions ?? []} />
            </Box>
          </Stack>
        </Surface>
      )}

      <SelectableSection
        icon={<AutoAwesomeOutlined sx={{ color: appleColors.purple }} />}
        title="Opportunities"
        empty="No AI opportunities were returned."
        items={useCases.map((useCase, index) => {
          const key = useCaseKey(useCase, index);
          return {
            key,
            checked: selection.useCaseKeys.includes(key),
            title: useCase.title || `Opportunity ${index + 1}`,
            detail: useCase.userValue || useCase.businessValue || useCase.workflow || 'Product-specific opportunity.',
            meta: [
              useCase.priority ? formatLabel(useCase.priority) : 'Suggested',
              useCase.loomaiCapability || useCase.loomaiCapabilityCode || '',
              useCase.confidence ? `${Math.round(useCase.confidence * 100)}% confidence` : '',
            ].filter(Boolean),
            onChange: (checked) => onSelectionChange({
              ...selection,
              useCaseKeys: toggleValue(selection.useCaseKeys, key, checked),
            }),
          };
        })}
      />

      <SelectableSection
        icon={<CheckCircleOutlineOutlined sx={{ color: appleColors.green }} />}
        title="Services to update"
        empty="No catalog-backed service modules were returned."
        items={serviceRecommendations.map((recommendation) => {
          const key = serviceRecommendationKey(recommendation);
          return {
            key,
            checked: selection.serviceModuleKeys.includes(key),
            title: recommendation.moduleName || recommendation.moduleCode,
            detail: recommendation.reason || recommendation.expectedOutcome || 'Suggested product service.',
            meta: [
              recommendation.priority ? formatLabel(recommendation.priority) : 'Suggested',
              recommendation.categorySlug ? formatLabel(recommendation.categorySlug) : '',
              recommendation.confidence ? `${Math.round(recommendation.confidence * 100)}% confidence` : '',
            ].filter(Boolean),
            onChange: (checked) => onSelectionChange({
              ...selection,
              serviceModuleKeys: toggleValue(selection.serviceModuleKeys, key, checked),
            }),
          };
        })}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
        <SelectableTextList
          title="Scanner focus"
          icon={<RuleOutlined sx={{ color: appleColors.amber }} />}
          items={scannerFocus}
          selected={selection.scannerFocus}
          empty="No scanner focus areas were returned."
          onChange={(value, checked) => onSelectionChange({
            ...selection,
            scannerFocus: toggleValue(selection.scannerFocus, value, checked),
          })}
        />
        <SelectableTextList
          title="Next steps"
          icon={<CheckCircleOutlineOutlined sx={{ color: appleColors.cyan }} />}
          items={nextSteps}
          selected={selection.nextSteps}
          empty="No next steps were returned."
          onChange={(value, checked) => onSelectionChange({
            ...selection,
            nextSteps: toggleValue(selection.nextSteps, value, checked),
          })}
        />
      </Box>
    </Stack>
  );
}

function SummaryTile({ label, value, detail, accent }: { label: string; value: number; detail: string; accent: string }) {
  return (
    <Box sx={{ p: 1.25, borderRadius: 1, bgcolor: '#fff', border: '1px solid', borderColor: `${accent}28`, minHeight: 88 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h3" sx={{ color: accent, mt: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {detail}
      </Typography>
    </Box>
  );
}

function SelectableSection({
  empty,
  icon,
  items,
  title,
}: {
  empty: string;
  icon: ReactNode;
  items: Array<{
    key: string;
    checked: boolean;
    title: string;
    detail: string;
    meta: string[];
    onChange: (checked: boolean) => void;
  }>;
  title: string;
}) {
  return (
    <Surface>
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} alignItems="center">
          {icon}
          <Typography variant="h4">{title}</Typography>
        </Stack>
        {items.length ? (
          <Box sx={{ display: 'grid', gap: 1 }}>
            {items.map((item) => (
              <Box
                key={item.key}
                sx={{
                  p: 1.35,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: item.checked ? appleColors.purple : appleColors.line,
                  bgcolor: item.checked ? '#fbfaff' : '#fff',
                }}
              >
                <FormControlLabel
                  control={<Checkbox checked={item.checked} onChange={(event) => item.onChange(event.target.checked)} />}
                  label={
                    <Stack spacing={0.45}>
                      <Typography variant="body2" sx={{ fontWeight: 950, lineHeight: 1.35 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                        {item.detail}
                      </Typography>
                      <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                        {item.meta.slice(0, 3).map((value) => (
                          <PastelChip key={value} label={shortChipLabel(value)} accent={appleColors.purple} bg="#f1efff" />
                        ))}
                      </Stack>
                    </Stack>
                  }
                  sx={{ alignItems: 'flex-start', m: 0, gap: 0.5 }}
                />
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            {empty}
          </Typography>
        )}
      </Stack>
    </Surface>
  );
}

function SelectableTextList({
  empty,
  icon,
  items,
  onChange,
  selected,
  title,
}: {
  empty: string;
  icon: ReactNode;
  items: string[];
  onChange: (value: string, checked: boolean) => void;
  selected: string[];
  title: string;
}) {
  return (
    <Surface>
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} alignItems="center">
          {icon}
          <Typography variant="h4">{title}</Typography>
        </Stack>
        {items.length ? (
          <Stack divider={<Divider flexItem />} spacing={0.5}>
            {items.map((item) => (
              <FormControlLabel
                key={item}
                control={<Checkbox checked={selected.includes(item)} onChange={(event) => onChange(item, event.target.checked)} />}
                label={<Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.45 }}>{item}</Typography>}
                sx={{ alignItems: 'flex-start', m: 0 }}
              />
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            {empty}
          </Typography>
        )}
      </Stack>
    </Surface>
  );
}

function SimpleList({ title, items }: { title: string; items: string[] }) {
  return (
    <Box sx={{ p: 1.25, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fff' }}>
      <Typography variant="body2" sx={{ fontWeight: 950 }}>
        {title}
      </Typography>
      <Stack spacing={0.75} sx={{ mt: 1 }}>
        {items.slice(0, 5).map((item) => (
          <Typography key={item} variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            {item}
          </Typography>
        ))}
        {!items.length && (
          <Typography variant="caption" color="text.secondary">
            Not returned.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
