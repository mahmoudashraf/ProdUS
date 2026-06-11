'use client';

import {
  AutoAwesomeOutlined,
  CheckCircleOutlineOutlined,
  RuleOutlined,
} from '@mui/icons-material';
import type { ReactNode } from 'react';
import {
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import { PastelChip, Surface, appleColors, formatLabel } from './PlatformComponents';
import {
  collectAiServiceRecommendations,
  selectableNextSteps,
  selectableScannerFocus,
  serviceRecommendationKey,
  useCaseKey,
} from './ownerProductAiOpportunityModel';
import type { AiOpportunitySelectionState } from './ownerProductAiOpportunityModel';
import type { AiAssistedProductAnalysisResponse } from './types';

interface OwnerProductAiOpportunitySelectionSectionsProps {
  analysis: AiAssistedProductAnalysisResponse;
  selection: AiOpportunitySelectionState;
  onSelectionChange: (selection: AiOpportunitySelectionState) => void;
}

const toggleValue = (values: string[], value: string, checked: boolean) =>
  checked ? [...new Set([...values, value])] : values.filter(item => item !== value);

const shortChipLabel = (item: string) =>
  item.length > 44 ? `${item.slice(0, 41).trim()}...` : item;

export default function OwnerProductAiOpportunitySelectionSections({
  analysis,
  selection,
  onSelectionChange,
}: OwnerProductAiOpportunitySelectionSectionsProps) {
  const report = analysis.aiOpportunityReport;
  const useCases = report?.live ? (report.useCases ?? []) : [];
  const serviceRecommendations = collectAiServiceRecommendations(analysis);
  const scannerFocus = selectableScannerFocus(analysis);
  const nextSteps = selectableNextSteps(analysis);

  return (
    <>
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
            detail:
              useCase.userValue ||
              useCase.businessValue ||
              useCase.workflow ||
              'Product-specific opportunity.',
            meta: [
              useCase.priority ? formatLabel(useCase.priority) : 'Suggested',
              useCase.loomaiCapability || useCase.loomaiCapabilityCode || '',
              useCase.confidence ? `${Math.round(useCase.confidence * 100)}% confidence` : '',
            ].filter(Boolean),
            onChange: checked =>
              onSelectionChange({
                ...selection,
                useCaseKeys: toggleValue(selection.useCaseKeys, key, checked),
              }),
          };
        })}
      />

      <SelectableSection
        icon={<CheckCircleOutlineOutlined sx={{ color: appleColors.green }} />}
        title="Services to update"
        empty="No matching services were returned."
        items={serviceRecommendations.map(recommendation => {
          const key = serviceRecommendationKey(recommendation);
          return {
            key,
            checked: selection.serviceModuleKeys.includes(key),
            title: recommendation.moduleName || recommendation.moduleCode,
            detail:
              recommendation.reason ||
              recommendation.expectedOutcome ||
              'Suggested product service.',
            meta: [
              recommendation.priority ? formatLabel(recommendation.priority) : 'Suggested',
              recommendation.categorySlug ? formatLabel(recommendation.categorySlug) : '',
              recommendation.confidence
                ? `${Math.round(recommendation.confidence * 100)}% confidence`
                : '',
            ].filter(Boolean),
            onChange: checked =>
              onSelectionChange({
                ...selection,
                serviceModuleKeys: toggleValue(selection.serviceModuleKeys, key, checked),
              }),
          };
        })}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        <SelectableTextList
          title="Checks to watch"
          icon={<RuleOutlined sx={{ color: appleColors.amber }} />}
          items={scannerFocus}
          selected={selection.scannerFocus}
          empty="No launch check focus areas were returned."
          onChange={(value, checked) =>
            onSelectionChange({
              ...selection,
              scannerFocus: toggleValue(selection.scannerFocus, value, checked),
            })
          }
        />
        <SelectableTextList
          title="Next steps"
          icon={<CheckCircleOutlineOutlined sx={{ color: appleColors.cyan }} />}
          items={nextSteps}
          selected={selection.nextSteps}
          empty="No next steps were returned."
          onChange={(value, checked) =>
            onSelectionChange({
              ...selection,
              nextSteps: toggleValue(selection.nextSteps, value, checked),
            })
          }
        />
      </Box>
    </>
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
            {items.map(item => (
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
                  control={
                    <Checkbox
                      checked={item.checked}
                      onChange={event => item.onChange(event.target.checked)}
                    />
                  }
                  label={
                    <Stack spacing={0.45}>
                      <Typography variant="body2" sx={{ fontWeight: 950, lineHeight: 1.35 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                        {item.detail}
                      </Typography>
                      <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                        {item.meta.slice(0, 3).map(value => (
                          <PastelChip
                            key={value}
                            label={shortChipLabel(value)}
                            accent={appleColors.purple}
                            bg="#f1efff"
                          />
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
            {items.map(item => (
              <FormControlLabel
                key={item}
                control={
                  <Checkbox
                    checked={selected.includes(item)}
                    onChange={event => onChange(item, event.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.45 }}>
                    {item}
                  </Typography>
                }
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
