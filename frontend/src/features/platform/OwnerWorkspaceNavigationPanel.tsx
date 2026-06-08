'use client';

import { Tab, Tabs } from '@mui/material';
import { OwnerWorkspaceJourneyNav, WorkspaceBreadcrumbs, type JourneyStepItem } from './OwnerWorkspaceJourneyNav';
import { Surface } from './PlatformComponents';
import { WorkspaceTab, workspaceTabs } from './ownerWorkspaceModel';

export default function OwnerWorkspaceNavigationPanel({
  currentAreaLabel,
  currentDetailLabel,
  currentJourneyItems,
  currentJourneyValue,
  productName,
  workspaceDetailOpen,
  workspaceTab,
  onAreaChange,
  onDetailChange,
}: {
  currentAreaLabel: string;
  currentDetailLabel: string;
  currentJourneyItems: JourneyStepItem<string>[];
  currentJourneyValue: string;
  productName?: string | undefined;
  workspaceDetailOpen: boolean;
  workspaceTab: WorkspaceTab;
  onAreaChange: (tab: WorkspaceTab) => void;
  onDetailChange: (value: string) => void;
}) {
  return (
    <>
      <Surface
        sx={{
          p: { xs: 1, md: 1 },
          boxShadow: 'none',
          display: { xs: 'block', lg: 'none' },
          position: { xl: 'sticky' },
          top: { xl: 76 },
          zIndex: 2,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={workspaceTab}
          onChange={(_, value) => onAreaChange(value as WorkspaceTab)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            maxWidth: '100%',
            minHeight: 44,
            '& .MuiTabs-scroller': {
              overflowX: 'auto !important',
            },
            '& .MuiTabs-flexContainer': {
              width: { xs: '100%', sm: 'auto' },
            },
            '& .MuiTab-root': {
              flex: { xs: '1 1 0', sm: '0 0 auto' },
              fontSize: { xs: 12.5, sm: 14 },
              minWidth: { xs: 0, sm: 90 },
              minHeight: 44,
              px: { xs: 0.5, sm: 2 },
              textTransform: 'none',
              fontWeight: 850,
              letterSpacing: 0,
              borderRadius: 1,
            },
          }}
        >
          {workspaceTabs.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} />
          ))}
        </Tabs>
      </Surface>

      {productName && (
        workspaceDetailOpen ? (
          <WorkspaceBreadcrumbs
            items={[
              { label: 'Workspace', onClick: () => onAreaChange('overview') },
              { label: productName, onClick: () => onAreaChange('overview') },
              { label: currentAreaLabel, onClick: () => onAreaChange(workspaceTab) },
              { label: currentDetailLabel },
            ]}
            backLabel={`${currentAreaLabel} hub`}
            onBack={() => onAreaChange(workspaceTab)}
          />
        ) : (
          <OwnerWorkspaceJourneyNav
            label={`${currentAreaLabel} hub`}
            value={currentJourneyValue}
            items={currentJourneyItems}
            onChange={onDetailChange}
          />
        )
      )}
    </>
  );
}
