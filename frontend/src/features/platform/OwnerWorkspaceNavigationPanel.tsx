'use client';

import { ChevronRightOutlined, KeyboardBackspaceOutlined } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import { Surface, appleColors } from './PlatformComponents';
import { WorkspaceTab, workspaceTabs } from './ownerWorkspaceModel';

export default function OwnerWorkspaceNavigationPanel({
  currentAreaLabel,
  currentDetailLabel,
  currentJourneyItems,
  productName,
  workspaceDetailOpen,
  workspaceTab,
  onAreaChange,
  onAreaHub,
  onDetailChange,
}: {
  currentAreaLabel: string;
  currentDetailLabel: string;
  currentJourneyItems: JourneyStepItem<string>[];
  productName?: string | undefined;
  workspaceDetailOpen: boolean;
  workspaceTab: WorkspaceTab;
  onAreaChange: (tab: WorkspaceTab) => void;
  onAreaHub: (tab: WorkspaceTab) => void;
  onDetailChange: (value: string) => void;
}) {
  return (
    <>
      <ProductAreaNavigation
        workspaceTab={workspaceTab}
        onAreaChange={onAreaChange}
      />

      {productName && (
        workspaceDetailOpen ? (
          <WorkspaceBreadcrumbs
            items={[
              { label: 'Workspace', onClick: () => onAreaChange('overview') },
              { label: productName, onClick: () => onAreaChange('overview') },
              { label: currentAreaLabel, onClick: () => onAreaHub(workspaceTab) },
              { label: currentDetailLabel },
            ]}
            backLabel={`${currentAreaLabel} hub`}
            onBack={() => onAreaHub(workspaceTab)}
          />
        ) : (
          <OwnerWorkspaceJourneyNav
            label={`${currentAreaLabel} hub`}
            value={null}
            items={currentJourneyItems}
            onChange={onDetailChange}
          />
        )
      )}
    </>
  );
}

function ProductAreaNavigation({
  workspaceTab,
  onAreaChange,
}: {
  workspaceTab: WorkspaceTab;
  onAreaChange: (tab: WorkspaceTab) => void;
}) {
  return (
    <Surface
      sx={{
        p: { xs: 1, md: 1 },
        boxShadow: 'none',
        display: 'block',
        zIndex: 2,
        overflow: 'hidden',
      }}
    >
      <Stack spacing={0.75}>
        <Typography variant="caption" sx={{ color: appleColors.muted, fontWeight: 900 }}>
          Product navigation
        </Typography>
        <Box
          aria-label="Product area navigation"
          component="nav"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(6, minmax(0, 1fr))' },
            gap: 0.75,
            minWidth: 0,
          }}
        >
          {workspaceTabs.map((tab) => {
            const selected = workspaceTab === tab.value;
            const isProductHome = tab.value === 'overview';
            const showBackIcon = isProductHome && workspaceTab !== 'overview';
            return (
              <Button
                key={tab.value}
                aria-current={selected ? 'page' : undefined}
                data-testid={`owner-workspace-area-${tab.value}`}
                variant="outlined"
                onClick={() => onAreaChange(tab.value)}
                startIcon={showBackIcon ? <KeyboardBackspaceOutlined /> : undefined}
                endIcon={!selected && !showBackIcon ? <ChevronRightOutlined /> : undefined}
                sx={{
                  minHeight: 44,
                  justifyContent: 'space-between',
                  borderRadius: 1,
                  px: 1,
                  color: selected ? appleColors.ink : appleColors.muted,
                  bgcolor: selected ? '#f8fafc' : '#fff',
                  borderColor: selected ? appleColors.ink : appleColors.line,
                  fontWeight: selected ? 950 : 850,
                  textTransform: 'none',
                  whiteSpace: 'normal',
                  textAlign: 'left',
                  '& .MuiButton-startIcon': { mr: 0.5 },
                  '& .MuiButton-endIcon': { ml: 0.5 },
                  '&:hover': {
                    bgcolor: selected ? '#f8fafc' : '#fbfdff',
                    borderColor: selected ? appleColors.ink : appleColors.blue,
                  },
                }}
              >
                {tab.label}
              </Button>
            );
          })}
        </Box>
      </Stack>
    </Surface>
  );
}
