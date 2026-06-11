'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
import { PastelChip, StatusChip, appleColors } from './PlatformComponents';
import type { ProductDiagnosis, ServiceModule } from './types';

type DiagnosisFinding = ProductDiagnosis['findings'][number];

interface OwnerProductDiagnosisFindingCardProps {
  finding: DiagnosisFinding;
  isAddingService: boolean;
  recommendedModule?: ServiceModule | undefined;
  serviceInPlan: boolean;
  onChooseService: (module: ServiceModule) => void;
}

export default function OwnerProductDiagnosisFindingCard({
  finding,
  isAddingService,
  recommendedModule,
  serviceInPlan,
  onChooseService,
}: OwnerProductDiagnosisFindingCardProps) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 1.25,
        bgcolor: '#fff',
        minWidth: 0,
      }}
    >
      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 900, overflowWrap: 'anywhere' }}>
            {finding.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
            {finding.businessRisk || finding.description}
          </Typography>
        </Box>
        <StatusChip
          label={finding.severity}
          color={finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? 'error' : 'warning'}
        />
      </Stack>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
        <PastelChip label={finding.confidenceLevel} accent={appleColors.cyan} bg="#e4f9fd" />
        {finding.readinessArea && (
          <PastelChip label={finding.readinessArea} accent={appleColors.green} bg="#e7f8ee" />
        )}
        {finding.recommendedModuleName && (
          <PastelChip label={finding.recommendedModuleName} accent={appleColors.purple} />
        )}
      </Stack>
      {(finding.ownerDecision || finding.evidenceRequired) && (
        <Box
          sx={{
            mt: 1,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 1,
          }}
        >
          {finding.ownerDecision && (
            <ProofNote title="Owner decision" body={finding.ownerDecision} borderColor="#dbeafe" bg="#fbfdff" />
          )}
          {finding.evidenceRequired && (
            <ProofNote title="Proof needed" body={finding.evidenceRequired} borderColor="#dcfce7" bg="#fbfffd" />
          )}
        </Box>
      )}
      {recommendedModule && (
        <Button
          variant={serviceInPlan ? 'outlined' : 'contained'}
          size="small"
          disabled={serviceInPlan || isAddingService}
          onClick={() => onChooseService(recommendedModule)}
          sx={{ mt: 1.25, minHeight: 36, whiteSpace: 'normal' }}
        >
          {serviceInPlan ? 'Service already in plan' : 'Choose service for plan'}
        </Button>
      )}
    </Box>
  );
}

function ProofNote({
  bg,
  body,
  borderColor,
  title,
}: {
  bg: string;
  body: string;
  borderColor: string;
  title: string;
}) {
  return (
    <Box
      sx={{
        p: 1,
        borderRadius: 1,
        border: '1px solid',
        borderColor,
        bgcolor: bg,
        minWidth: 0,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.45 }}>
        {body}
      </Typography>
    </Box>
  );
}
