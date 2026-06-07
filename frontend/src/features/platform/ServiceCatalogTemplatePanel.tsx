'use client';

import NextLink from 'next/link';
import { AddTaskOutlined, FactCheckOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  EmptyState,
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
} from './PlatformComponents';
import type { PackageTemplate } from './types';

export default function PackageTemplatesPanel({
  packageTemplates,
  cartServiceIds,
  canUseProjectCart,
  isLoggedIn,
  cartHref,
  isApplyingTemplate,
  onApplyTemplate,
}: {
  packageTemplates: PackageTemplate[];
  cartServiceIds: Set<string>;
  canUseProjectCart: boolean;
  isLoggedIn: boolean;
  cartHref: string;
  isApplyingTemplate: boolean;
  onApplyTemplate: (templateId: string) => void;
}) {
  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8f7ff 100%)' }}>
      <SectionTitle title="Launch Templates" action={<FactCheckOutlined sx={{ color: appleColors.purple }} />} />
      {packageTemplates.length ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
            gap: 1.5,
          }}
        >
          {packageTemplates.slice(0, 6).map((template) => {
            const templateServiceIds = template.modules.map((module) => module.serviceModule.id);
            const templateApplied = templateServiceIds.length > 0 && templateServiceIds.every((id) => cartServiceIds.has(id));
            return (
              <Surface key={template.id} sx={{ boxShadow: 'none', background: '#fff', minHeight: 176 }}>
                <Stack spacing={1.25}>
                  <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h4">{template.name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
                        {template.description}
                      </Typography>
                    </Box>
                    <PastelChip label={template.targetProductStage || 'Managed'} accent={appleColors.purple} />
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <PastelChip label={template.timelineRange || 'Scoped'} accent={appleColors.cyan} bg="#e4f9fd" />
                    <PastelChip label={template.budgetRange || 'Priced after scope'} accent={appleColors.green} bg="#e7f8ee" />
                    <PastelChip label={`${template.modules.length} services`} accent={appleColors.amber} bg="#fff4dc" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                    {template.outcomeSummary}
                  </Typography>
                  <Button
                    {...(!canUseProjectCart ? { component: NextLink, href: cartHref } : {})}
                    variant={templateApplied ? 'outlined' : 'contained'}
                    startIcon={<AddTaskOutlined />}
                    disabled={canUseProjectCart && (templateApplied || isApplyingTemplate)}
                    onClick={(event) => {
                      if (!canUseProjectCart) return;
                      event.preventDefault();
                      onApplyTemplate(template.id);
                    }}
                    sx={{ minHeight: 40, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
                  >
                    {!isLoggedIn
                      ? 'Sign in to use template'
                      : canUseProjectCart
                        ? templateApplied
                          ? 'Template in plan'
                          : 'Use template'
                        : 'Open dashboard'}
                  </Button>
                </Stack>
              </Surface>
            );
          })}
        </Box>
      ) : (
        <EmptyState label="No launch templates are available yet." />
      )}
    </Surface>
  );
}
