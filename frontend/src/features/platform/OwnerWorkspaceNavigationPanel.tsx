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
          position: { xl: 'sticky' },
          top: { xl: 76 },
          zIndex: 2,
        }}
      >
        <Tabs
          value={workspaceTab}
          onChange={(_, value) => onAreaChange(value as WorkspaceTab)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 44,
            '& .MuiTab-root': {
              minHeight: 44,
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
