import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { PastelChip, appleColors } from './PlatformComponents';

export interface OwnerWorkspaceTimelineItem {
  label: string;
  status: string;
  detail: string;
  accent: string;
}

interface OwnerWorkspaceTimelineDialogProps {
  open: boolean;
  items: OwnerWorkspaceTimelineItem[];
  onClose: () => void;
}

export default function OwnerWorkspaceTimelineDialog({ open, items, onClose }: OwnerWorkspaceTimelineDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Product Timeline</DialogTitle>
      <DialogContent>
        <Stack spacing={1} sx={{ pt: 0.5 }}>
          {items.map((item, index) => (
            <Box key={item.label} sx={{ display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr)', gap: 1.25 }}>
              <Stack alignItems="center" spacing={0}>
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: `${item.accent}14`, color: item.accent, display: 'grid', placeItems: 'center', fontWeight: 950, fontSize: 12 }}>
                  {index + 1}
                </Box>
                {index < items.length - 1 && <Box sx={{ width: 1, minHeight: 40, bgcolor: appleColors.line }} />}
              </Stack>
              <Box sx={{ p: 1.25, borderRadius: 1, bgcolor: '#fff' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 950 }}>{item.label}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, overflowWrap: 'anywhere' }}>{item.detail}</Typography>
                  </Box>
                  <PastelChip label={item.status} accent={item.accent} bg={`${item.accent}12`} />
                </Stack>
              </Box>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
