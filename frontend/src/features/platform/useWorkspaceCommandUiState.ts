'use client';

import { useState } from 'react';
import { useAdvancedForm } from '@/hooks/enterprise';
import type { WorkspaceCommandView } from './WorkspaceCommandJourneyNav';
import {
  type DeliverableFormValues as DeliverablePayload,
  type DisputeFormValues as DisputePayload,
  type MilestoneFormValues as MilestonePayload,
  type ParticipantFormValues as ParticipantPayload,
  type SupportRequestFormValues as SupportRequestPayload,
  type WorkspaceFormValues as WorkspacePayload,
  initialActiveWorkspaceValues,
  initialDeliverableValues,
  initialDisputeValues,
  initialMilestoneValues,
  initialParticipantValues,
  initialSupportRequestValues,
  initialWorkspaceScannerUploadValues,
} from './workspaceCommandTeamTypes';
import type {
  DisputeCase,
  IntegrationConnection,
  SupportRequest,
} from './types';

export function useWorkspaceCommandUiState() {
  const [supportStatusById, setSupportStatusById] = useState<Record<string, SupportRequest['status']>>({});
  const [supportResolutionById, setSupportResolutionById] = useState<Record<string, string>>({});
  const [disputeStatusById, setDisputeStatusById] = useState<Record<string, DisputeCase['status']>>({});
  const [disputeResolutionById, setDisputeResolutionById] = useState<Record<string, string>>({});
  const [governanceNotice, setGovernanceNotice] = useState('');
  const [integrationProvider, setIntegrationProvider] = useState<IntegrationConnection['providerType']>('GITHUB');
  const [workspaceView, setWorkspaceView] = useState<WorkspaceCommandView>('overview');
  const [scannerUploadForm, setScannerUploadForm] = useState(initialWorkspaceScannerUploadValues);

  const workspaceForm = useAdvancedForm<WorkspacePayload>({
    initialValues: initialActiveWorkspaceValues,
    validationRules: {
      packageInstanceId: [{ type: 'required', message: 'Service plan is required' }],
    },
  });
  const milestoneForm = useAdvancedForm<MilestonePayload>({
    initialValues: initialMilestoneValues,
    validationRules: {
      title: [{ type: 'required', message: 'Milestone title is required' }],
    },
  });
  const deliverableForm = useAdvancedForm<DeliverablePayload>({
    initialValues: initialDeliverableValues,
    validationRules: {
      title: [{ type: 'required', message: 'Deliverable title is required' }],
    },
  });
  const participantForm = useAdvancedForm<ParticipantPayload>({
    initialValues: initialParticipantValues,
    validationRules: {
      email: [
        { type: 'required', message: 'Participant email is required' },
        { type: 'email', message: 'Use a valid email address' },
      ],
    },
  });
  const supportForm = useAdvancedForm<SupportRequestPayload>({
    initialValues: initialSupportRequestValues,
    validationRules: {
      title: [{ type: 'required', message: 'Support title is required' }],
      description: [{ type: 'required', message: 'Support context is required' }],
    },
  });
  const disputeForm = useAdvancedForm<DisputePayload>({
    initialValues: initialDisputeValues,
    validationRules: {
      title: [{ type: 'required', message: 'Risk title is required' }],
      description: [{ type: 'required', message: 'Risk context is required' }],
    },
  });

  return {
    deliverableForm,
    disputeForm,
    disputeResolutionById,
    disputeStatusById,
    governanceNotice,
    integrationProvider,
    milestoneForm,
    participantForm,
    scannerUploadForm,
    setDisputeResolutionById,
    setDisputeStatusById,
    setGovernanceNotice,
    setIntegrationProvider,
    setScannerUploadForm,
    setSupportResolutionById,
    setSupportStatusById,
    setWorkspaceView,
    supportForm,
    supportResolutionById,
    supportStatusById,
    workspaceForm,
    workspaceView,
  };
}
