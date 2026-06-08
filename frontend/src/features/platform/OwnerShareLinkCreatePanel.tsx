'use client';

import {
  AddLinkOutlined,
  LockOutlined,
  PublicOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  PastelChip,
  SectionTitle,
  Surface,
  appleColors,
} from './PlatformComponents';
import type {
  ProductProfile,
  ProductShareAudience,
  ProductShareSection,
} from './types';
import type { ShareAudienceOption, ShareExpiryMode, ShareSectionOption } from './ownerWorkspaceShareOptions';

interface OwnerShareLinkCreatePanelProps {
  audience: ProductShareAudience;
  audienceOptions: readonly ShareAudienceOption[];
  customExpiryDate: string;
  expiryMode: ShareExpiryMode;
  expiryOptions: ReadonlyArray<{ value: ShareExpiryMode; label: string }>;
  isCreating: boolean;
  ownerNote: string;
  product: ProductProfile;
  sectionOptions: readonly ShareSectionOption[];
  selectedSections: Set<ProductShareSection>;
  title: string;
  viewerActionLabel: string;
  viewerActionUrl: string;
  onAudienceChange: (audience: ProductShareAudience) => void;
  onCreateLink: () => void;
  onCustomExpiryDateChange: (value: string) => void;
  onExpiryModeChange: (mode: ShareExpiryMode) => void;
  onOwnerNoteChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onToggleSection: (section: ProductShareSection, checked: boolean) => void;
  onViewerActionLabelChange: (value: string) => void;
  onViewerActionUrlChange: (value: string) => void;
}

export default function OwnerShareLinkCreatePanel({
  audience,
  audienceOptions,
  customExpiryDate,
  expiryMode,
  expiryOptions,
  isCreating,
  ownerNote,
  product,
  sectionOptions,
  selectedSections,
  title,
  viewerActionLabel,
  viewerActionUrl,
  onAudienceChange,
  onCreateLink,
  onCustomExpiryDateChange,
  onExpiryModeChange,
  onOwnerNoteChange,
  onTitleChange,
  onToggleSection,
  onViewerActionLabelChange,
  onViewerActionUrlChange,
}: OwnerShareLinkCreatePanelProps) {
  const selectedAudience = audienceOptions.find((option) => option.value === audience);

  return (
    <Surface>
      <SectionTitle title="Create Share Link" action={<AddLinkOutlined sx={{ color: appleColors.purple }} />} />
      <Stack spacing={1.5}>
        <TextField
          label="Link title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={`${product.name} product summary`}
          fullWidth
        />
        <TextField
          select
          label="Who should this link be for?"
          value={audience}
          onChange={(event) => onAudienceChange(event.target.value as ProductShareAudience)}
          fullWidth
        >
          {audienceOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.25 }}>
          <TextField
            select
            label="Expiry"
            value={expiryMode}
            onChange={(event) => onExpiryModeChange(event.target.value as ShareExpiryMode)}
            fullWidth
          >
            {expiryOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Custom expiry date"
            type="date"
            value={customExpiryDate}
            disabled={expiryMode !== 'custom'}
            onChange={(event) => onCustomExpiryDateChange(event.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Box>
        <TextField
          label="Owner note"
          value={ownerNote}
          onChange={(event) => onOwnerNoteChange(event.target.value)}
          placeholder="Optional context for the person opening this link"
          multiline
          minRows={3}
          fullWidth
        />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.75fr 1.25fr' }, gap: 1.25 }}>
          <TextField
            label="Viewer action label"
            value={viewerActionLabel}
            onChange={(event) => onViewerActionLabelChange(event.target.value)}
            placeholder="Request access"
            fullWidth
          />
          <TextField
            label="Viewer action URL"
            value={viewerActionUrl}
            onChange={(event) => onViewerActionUrlChange(event.target.value)}
            placeholder="https://calendly.com/... or mailto:owner@example.com"
            fullWidth
          />
        </Box>
        {selectedAudience && (
          <Box sx={{ p: 1.25, border: '1px solid', borderColor: appleColors.line, borderRadius: 1, bgcolor: '#fbfdff' }}>
            <Typography sx={{ fontWeight: 950 }}>{selectedAudience.label}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.5 }}>
              {selectedAudience.detail}
            </Typography>
          </Box>
        )}
        <FormGroup>
          {sectionOptions.map((section) => (
            <Box key={section.value} sx={{ borderTop: '1px solid', borderColor: appleColors.line, py: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedSections.has(section.value)}
                    disabled={section.value === 'PRODUCT_SUMMARY'}
                    onChange={(event) => onToggleSection(section.value, event.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography sx={{ fontWeight: 900 }}>{section.label}</Typography>
                      {section.sensitive && <PastelChip label="summary only" accent={appleColors.amber} bg="#fff4dc" />}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.45 }}>
                      {section.detail}
                    </Typography>
                  </Box>
                }
              />
            </Box>
          ))}
        </FormGroup>
        <Alert severity="info" icon={<LockOutlined />} sx={{ borderRadius: 1 }}>
          Share links never expose detailed findings or evidence artifacts. This version shares safe summaries only.
        </Alert>
        <Button
          variant="contained"
          startIcon={<PublicOutlined />}
          disabled={isCreating}
          onClick={onCreateLink}
          sx={{ minHeight: 44 }}
        >
          {isCreating ? 'Creating...' : audience === 'INTERNAL_ONLY' ? 'Create internal link' : 'Create share link'}
        </Button>
      </Stack>
    </Surface>
  );
}
