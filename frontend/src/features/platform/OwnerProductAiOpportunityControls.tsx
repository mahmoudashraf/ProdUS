'use client';

import {
  AutoAwesomeOutlined,
  AttachFileOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { PastelChip, Surface, appleColors } from './PlatformComponents';

interface OwnerProductAiOpportunityControlsProps {
  files: File[];
  isRunning: boolean;
  ownerNote: string;
  sharedFileIndexes: ReadonlySet<number>;
  onFilesChange: (files: File[]) => void;
  onOwnerNoteChange: (value: string) => void;
  onRun: () => void;
  onToggleSharedFile: (index: number, checked: boolean) => void;
}

export default function OwnerProductAiOpportunityControls({
  files,
  isRunning,
  ownerNote,
  sharedFileIndexes,
  onFilesChange,
  onOwnerNoteChange,
  onRun,
  onToggleSharedFile,
}: OwnerProductAiOpportunityControlsProps) {
  return (
    <Surface sx={{ background: 'linear-gradient(135deg, #ffffff 0%, #f6fbff 100%)' }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'flex-start' }}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h3">Run AI opportunity scan</Typography>
              <PastelChip label="LoomAI" accent={appleColors.purple} bg="#f1efff" />
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 760, lineHeight: 1.6 }}>
              Refresh product-specific AI ideas, then approve only the opportunities, services, and next steps that should update this product.
            </Typography>
          </Box>
          <Button
            data-testid="run-ai-opportunity-scan"
            variant="contained"
            startIcon={<AutoAwesomeOutlined />}
            onClick={onRun}
            disabled={isRunning}
            sx={{ minHeight: 44, whiteSpace: 'normal' }}
          >
            {isRunning ? 'Scanning...' : 'Run scan'}
          </Button>
        </Stack>

        <TextField
          label="What changed?"
          value={ownerNote}
          onChange={(event) => onOwnerNoteChange(event.target.value)}
          minRows={3}
          multiline
          placeholder="Example: focus on customer-support automation, explain the LoomAI integration path, and use the latest pitch deck."
          fullWidth
        />

        <Stack spacing={1}>
          <Button
            component="label"
            variant="outlined"
            startIcon={<AttachFileOutlined />}
            sx={{ minHeight: 42, alignSelf: 'flex-start', whiteSpace: 'normal' }}
          >
            Add files
            <Box
              component="input"
              type="file"
              multiple
              sx={{ display: 'none' }}
              onChange={(event) => {
                onFilesChange(Array.from(event.target.files ?? []));
                event.target.value = '';
              }}
            />
          </Button>

          {files.length > 0 && (
            <Box sx={{ display: 'grid', gap: 1 }}>
              {files.map((file, index) => (
                <Box
                  key={`${file.name}-${file.size}-${index}`}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) auto' },
                    gap: 1,
                    alignItems: 'center',
                    p: 1.25,
                    border: '1px solid',
                    borderColor: appleColors.line,
                    borderRadius: 1,
                    bgcolor: '#fff',
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 900, overflowWrap: 'anywhere' }}>
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Math.max(1, Math.round(file.size / 1024))} KB
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={sharedFileIndexes.has(index)}
                        onChange={(event) => onToggleSharedFile(index, event.target.checked)}
                      />
                    }
                    label="Share with AI"
                    sx={{ m: 0 }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Stack>
      </Stack>
    </Surface>
  );
}
