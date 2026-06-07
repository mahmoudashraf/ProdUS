'use client';

import {
  CheckCircleOutlineOutlined,
  PsychologyAltOutlined,
  ShieldOutlined,
} from '@mui/icons-material';
import { Stack, Typography } from '@mui/material';
import {
  SectionTitle,
  Surface,
  appleColors,
} from './PlatformComponents';

const nextSteps = [
  'ProdUS turns the intake into a product profile you can review before creating it.',
  'The analysis highlights blockers, missing proof, and service paths in owner language.',
  'Accepted services can become the starting plan for delivery.',
  'You can edit the product normally after creation.',
];

const privateDocumentNotes = [
  'Only selected files are shared with AI for this analysis.',
  'Private document access is short-lived and mediated by the backend.',
  'Document usage is shown in the review so unused proof does not become invisible.',
];

export default function ProductOnboardingSideGuidePanel() {
  return (
    <Stack spacing={2.5}>
      <Surface>
        <SectionTitle
          title="What Happens Next"
          action={<PsychologyAltOutlined sx={{ color: appleColors.purple }} />}
        />
        <Stack spacing={1.5}>
          {nextSteps.map(item => (
            <Stack key={item} direction="row" spacing={1.2} alignItems="flex-start">
              <CheckCircleOutlineOutlined sx={{ color: appleColors.green, fontSize: 20, mt: 0.2 }} />
              <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {item}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Surface>

      <Surface sx={{ background: 'linear-gradient(135deg, #ffffff, #f8fbff)' }}>
        <SectionTitle
          title="Private Proof"
          action={<ShieldOutlined sx={{ color: appleColors.cyan }} />}
        />
        <Stack spacing={1.3}>
          {privateDocumentNotes.map(item => (
            <Typography key={item} color="text.secondary" sx={{ lineHeight: 1.65 }}>
              {item}
            </Typography>
          ))}
        </Stack>
      </Surface>
    </Stack>
  );
}
