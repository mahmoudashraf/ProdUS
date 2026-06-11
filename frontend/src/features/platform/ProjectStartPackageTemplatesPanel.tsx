'use client';

import { AddTaskOutlined, FactCheckOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
} from './PlatformComponents';
import type { PackageTemplate } from './types';

interface ProjectStartPackageTemplatesPanelProps {
  templates: PackageTemplate[];
  selectedServiceIds: Set<string>;
  isApplyingTemplate: boolean;
  onApplyTemplate: (templateId: string) => void;
}

export default function ProjectStartPackageTemplatesPanel({
  templates,
  selectedServiceIds,
  isApplyingTemplate,
  onApplyTemplate,
}: ProjectStartPackageTemplatesPanelProps) {
  if (!templates.length) return null;

  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8f7ff 100%)' }}>
      <SectionTitle title="Plan templates" action={<FactCheckOutlined sx={{ color: appleColors.purple }} />} />
      <Typography color="text.secondary" sx={{ lineHeight: 1.65, mb: 2 }}>
        Apply a proven service plan when the product matches a common path. ProdUS keeps the dependency checks active after adding the services.
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
        {templates.slice(0, 4).map((template) => {
          const templateServiceIds = template.modules.map((module) => module.serviceModule.id);
          const templateApplied = templateServiceIds.length > 0 && templateServiceIds.every((id) => selectedServiceIds.has(id));

          return (
            <Box
              key={template.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: '#fff',
                p: 2,
              }}
            >
              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h4">{template.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
                      {template.outcomeSummary || template.description}
                    </Typography>
                  </Box>
                  <PastelChip label={template.targetProductStage || 'Managed'} accent={appleColors.purple} />
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <PastelChip label={`${template.modules.length} services`} accent={appleColors.cyan} bg="#e4f9fd" />
                  <PastelChip label={template.timelineRange || 'Scoped'} accent={appleColors.green} bg="#e7f8ee" />
                  <PastelChip label={template.budgetRange || 'Priced after scope'} accent={appleColors.amber} bg="#fff4dc" />
                </Stack>
                <Button
                  variant={templateApplied ? 'outlined' : 'contained'}
                  startIcon={<AddTaskOutlined />}
                  disabled={templateApplied || isApplyingTemplate}
                  onClick={() => onApplyTemplate(template.id)}
                  sx={{ minHeight: 42, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
                >
                  {templateApplied ? 'Plan applied' : 'Apply plan'}
                </Button>
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Surface>
  );
}
