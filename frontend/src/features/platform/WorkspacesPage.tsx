'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarMonthOutlined,
  ErrorOutlineOutlined,
  FactCheckOutlined,
  TaskAltOutlined,
} from '@mui/icons-material';
import { Alert, Box, Button, LinearProgress, Link, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdvancedForm } from '@/hooks/enterprise';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';
import FileUpload from '@/components/ui-component/FileUpload';
import { uploadService } from '@/services/uploadService';
import { getJson, postJson, putJson } from './api';
import {
  DotLabel,
  EmptyState,
  MetricTile,
  PageHeader,
  PastelChip,
  ProgressRing,
  QueryState,
  StatusChip,
  Surface,
  appleColors,
  formatLabel,
} from './PlatformComponents';
import {
  AttachmentScope,
  AttachmentDownloadUrl,
  Deliverable,
  DisputeCase,
  EvidenceAttachment,
  Milestone,
  PackageInstance,
  ProjectWorkspace,
  SupportRequest,
  SupportSubscription,
  Team,
  WorkspaceParticipant,
} from './types';

const participantRoles: WorkspaceParticipant['role'][] = ['COORDINATOR', 'TEAM_LEAD', 'SPECIALIST', 'ADVISOR', 'VIEWER'];
const disputeSeverities: DisputeCase['severity'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const disputeStatuses: DisputeCase['status'][] = ['OPEN', 'UNDER_REVIEW', 'OWNER_RESPONSE_NEEDED', 'TEAM_RESPONSE_NEEDED', 'RESOLVED', 'CANCELLED'];
const supportPriorities: SupportRequest['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const supportRequestStatuses: SupportRequest['status'][] = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'WAITING_ON_OWNER', 'RESOLVED', 'CANCELLED'];

interface WorkspacePayload {
  packageInstanceId: string;
  name: string;
  status: ProjectWorkspace['status'];
}

interface MilestonePayload {
  title: string;
  description: string;
  dueDate: string | null;
  status: Milestone['status'];
}

interface DeliverablePayload {
  title: string;
  evidence: string;
  status: Deliverable['status'];
}

interface WorkspaceParticipantPayload {
  email: string;
  role: WorkspaceParticipant['role'];
  active: boolean;
}

interface SupportSubscriptionPayload {
  teamId: string;
  planName: string;
  sla: string;
  monthlyAmountCents: number;
  currency: string;
  startsOn: string | null;
  renewsOn: string | null;
  status: SupportSubscription['status'];
}

interface SupportRequestPayload {
  supportSubscriptionId: string | null;
  teamId: string | null;
  title: string;
  description: string;
  priority: SupportRequest['priority'];
  status: SupportRequest['status'];
  dueOn: string | null;
}

interface SupportRequestStatusPayload {
  status: SupportRequest['status'];
  resolution: string;
}

interface DisputePayload {
  teamId: string | null;
  title: string;
  description: string;
  severity: DisputeCase['severity'];
  responseDueOn: string | null;
}

interface DisputeStatusPayload {
  status: DisputeCase['status'];
  resolution: string;
}

const initialWorkspaceValues: WorkspacePayload = {
  packageInstanceId: '',
  name: '',
  status: 'DRAFT_PACKAGE',
};

const initialMilestoneValues: MilestonePayload = {
  title: '',
  description: '',
  dueDate: null,
  status: 'PLANNED',
};

const initialDeliverableValues: DeliverablePayload = {
  title: '',
  evidence: '',
  status: 'PENDING',
};

const initialParticipantValues: WorkspaceParticipantPayload = {
  email: '',
  role: 'SPECIALIST',
  active: true,
};

const initialSupportValues: SupportSubscriptionPayload = {
  teamId: '',
  planName: '',
  sla: '',
  monthlyAmountCents: 0,
  currency: 'USD',
  startsOn: null,
  renewsOn: null,
  status: 'PROPOSED',
};

const initialSupportRequestValues: SupportRequestPayload = {
  supportSubscriptionId: null,
  teamId: null,
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'OPEN',
  dueOn: null,
};

const initialDisputeValues: DisputePayload = {
  teamId: null,
  title: '',
  description: '',
  severity: 'MEDIUM',
  responseDueOn: null,
};

const formatMoney = (amountCents: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format((amountCents || 0) / 100);

const attachmentKey = (scopeType: AttachmentScope, scopeId: string) => `${scopeType}:${scopeId}`;

const workspaceAccent = (status?: string) => {
  if (!status) return appleColors.purple;
  if (status.includes('BLOCK')) return appleColors.red;
  if (status.includes('REVIEW') || status.includes('NEGOTIATION') || status.includes('AWAITING')) return appleColors.amber;
  if (status.includes('ACTIVE') || status.includes('DELIVER') || status.includes('SUPPORT')) return appleColors.green;
  return appleColors.purple;
};

const formatFileSize = (sizeBytes: number) => {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
};

const uploadErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Attachment upload failed';
};

const AttachmentList = ({
  attachments,
  onOpenAttachment,
}: {
  attachments: EvidenceAttachment[];
  onOpenAttachment: (attachment: EvidenceAttachment) => void;
}) => (
  <Stack spacing={0.75} sx={{ mt: attachments.length ? 1 : 0 }}>
    {attachments.map((attachment) => (
      <Box
        key={attachment.id}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          px: 1.25,
          py: 1,
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75} justifyContent="space-between">
          <Box>
            <Link
              component="button"
              type="button"
              underline="hover"
              variant="body2"
              onClick={() => onOpenAttachment(attachment)}
              sx={{ cursor: 'pointer', textAlign: 'left' }}
            >
              {attachment.label || attachment.fileName}
            </Link>
            {attachment.label && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {attachment.fileName}
              </Typography>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {formatFileSize(attachment.sizeBytes)}
            {attachment.uploadedBy?.email ? ` · ${attachment.uploadedBy.email}` : ''}
          </Typography>
        </Stack>
      </Box>
    ))}
  </Stack>
);

export default function WorkspacesPage() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canInviteParticipants = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER, UserRole.TEAM_MANAGER]);
  const canManageSupport = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER, UserRole.TEAM_MANAGER]);
  const canManageDisputes = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER, UserRole.TEAM_MANAGER]);
  const canAttachEvidence = hasRole([UserRole.ADMIN, UserRole.PRODUCT_OWNER, UserRole.TEAM_MANAGER, UserRole.SPECIALIST]);
  const packages = useQuery({ queryKey: ['packages'], queryFn: () => getJson<PackageInstance[]>('/packages') });
  const workspaces = useQuery({ queryKey: ['workspaces'], queryFn: () => getJson<ProjectWorkspace[]>('/workspaces') });
  const teams = useQuery({ queryKey: ['teams'], queryFn: () => getJson<Team[]>('/teams') });
  const supportSubscriptions = useQuery({
    queryKey: ['commerce-support-subscriptions'],
    queryFn: () => getJson<SupportSubscription[]>('/commerce/support-subscriptions'),
  });
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [supportRequestStatusById, setSupportRequestStatusById] = useState<Record<string, SupportRequest['status']>>({});
  const [supportRequestResolutionById, setSupportRequestResolutionById] = useState<Record<string, string>>({});
  const [disputeStatusById, setDisputeStatusById] = useState<Record<string, DisputeCase['status']>>({});
  const [disputeResolutionById, setDisputeResolutionById] = useState<Record<string, string>>({});
  const [attachmentFilesByKey, setAttachmentFilesByKey] = useState<Record<string, File | null>>({});
  const [attachmentLabelsByKey, setAttachmentLabelsByKey] = useState<Record<string, string>>({});
  const [attachmentProgressByKey, setAttachmentProgressByKey] = useState<Record<string, number>>({});
  const [attachmentErrorsByKey, setAttachmentErrorsByKey] = useState<Record<string, string>>({});
  const [attachmentOpenError, setAttachmentOpenError] = useState('');
  const [uploadingAttachmentKey, setUploadingAttachmentKey] = useState('');

  const workspaceForm = useAdvancedForm<WorkspacePayload>({
    initialValues: initialWorkspaceValues,
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
  const participantForm = useAdvancedForm<WorkspaceParticipantPayload>({
    initialValues: initialParticipantValues,
    validationRules: {
      email: [
        { type: 'required', message: 'Participant email is required' },
        { type: 'email', message: 'Use a valid email address' },
      ],
    },
  });
  const supportForm = useAdvancedForm<SupportSubscriptionPayload>({
    initialValues: initialSupportValues,
    validationRules: {
      teamId: [{ type: 'required', message: 'Team is required' }],
      planName: [{ type: 'required', message: 'Plan name is required' }],
    },
  });
  const supportRequestForm = useAdvancedForm<SupportRequestPayload>({
    initialValues: initialSupportRequestValues,
    validationRules: {
      title: [{ type: 'required', message: 'Support request title is required' }],
      description: [{ type: 'required', message: 'Support request context is required' }],
    },
  });
  const disputeForm = useAdvancedForm<DisputePayload>({
    initialValues: initialDisputeValues,
    validationRules: {
      title: [{ type: 'required', message: 'Dispute title is required' }],
      description: [{ type: 'required', message: 'Dispute context is required' }],
    },
  });

  const createWorkspace = useMutation({
    mutationFn: () => postJson<ProjectWorkspace, WorkspacePayload>('/workspaces', workspaceForm.values),
    onSuccess: async (workspace) => {
      workspaceForm.resetForm();
      setSelectedWorkspaceId(workspace.id);
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const workspaceList = workspaces.data || [];
  const selectedWorkspace = useMemo(
    () => workspaceList.find((workspace) => workspace.id === selectedWorkspaceId) || workspaceList[0],
    [workspaceList, selectedWorkspaceId]
  );

  useEffect(() => {
    if (!selectedWorkspaceId && workspaceList[0]) {
      setSelectedWorkspaceId(workspaceList[0].id);
    }
  }, [selectedWorkspaceId, workspaceList]);

  const milestones = useQuery({
    queryKey: ['workspaces', selectedWorkspace?.id, 'milestones'],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<Milestone[]>(`/workspaces/${selectedWorkspace?.id}/milestones`),
  });

  const milestoneList = milestones.data || [];
  const selectedMilestone = useMemo(
    () => milestoneList.find((milestone) => milestone.id === selectedMilestoneId) || milestoneList[0],
    [milestoneList, selectedMilestoneId]
  );

  useEffect(() => {
    if (!selectedMilestoneId && milestoneList[0]) {
      setSelectedMilestoneId(milestoneList[0].id);
    }
  }, [selectedMilestoneId, milestoneList]);

  const deliverables = useQuery({
    queryKey: ['workspaces', 'milestones', selectedMilestone?.id, 'deliverables'],
    enabled: !!selectedMilestone?.id,
    queryFn: () => getJson<Deliverable[]>(`/workspaces/milestones/${selectedMilestone?.id}/deliverables`),
  });
  const participants = useQuery({
    queryKey: ['workspaces', selectedWorkspace?.id, 'participants'],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<WorkspaceParticipant[]>(`/workspaces/${selectedWorkspace?.id}/participants`),
  });
  const disputes = useQuery({
    queryKey: ['commerce-disputes', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<DisputeCase[]>(`/commerce/workspaces/${selectedWorkspace?.id}/disputes`),
  });
  const supportRequests = useQuery({
    queryKey: ['commerce-support-requests', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<SupportRequest[]>(`/commerce/workspaces/${selectedWorkspace?.id}/support-requests`),
  });
  const attachments = useQuery({
    queryKey: ['attachments', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
    queryFn: () => getJson<EvidenceAttachment[]>(`/attachments?workspaceId=${selectedWorkspace?.id}`),
  });
  const attachmentsByScope = useMemo(
    () =>
      (attachments.data || []).reduce<Record<string, EvidenceAttachment[]>>((grouped, attachment) => {
        const key = attachmentKey(attachment.scopeType, attachment.scopeId);
        grouped[key] = [...(grouped[key] || []), attachment];
        return grouped;
      }, {}),
    [attachments.data]
  );
  const selectedSupportSubscriptions = (supportSubscriptions.data || []).filter(
    (subscription) => subscription.workspace?.id === selectedWorkspace?.id
  );
  const activeSupportSubscriptions = selectedSupportSubscriptions.filter(
    (subscription) => subscription.status === 'ACTIVE' || subscription.status === 'PROPOSED'
  );

  const createMilestone = useMutation({
    mutationFn: () => postJson<Milestone, MilestonePayload>(`/workspaces/${selectedWorkspace?.id}/milestones`, milestoneForm.values),
    onSuccess: async (milestone) => {
      milestoneForm.resetForm();
      setSelectedMilestoneId(milestone.id);
      await queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspace?.id, 'milestones'] });
    },
  });

  const createDeliverable = useMutation({
    mutationFn: () => postJson<Deliverable, DeliverablePayload>(`/workspaces/milestones/${selectedMilestone?.id}/deliverables`, deliverableForm.values),
    onSuccess: async () => {
      deliverableForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['workspaces', 'milestones', selectedMilestone?.id, 'deliverables'] });
    },
  });
  const addParticipant = useMutation({
    mutationFn: () => postJson<WorkspaceParticipant, WorkspaceParticipantPayload>(`/workspaces/${selectedWorkspace?.id}/participants`, participantForm.values),
    onSuccess: async () => {
      participantForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['workspaces', selectedWorkspace?.id, 'participants'] });
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
  const createSupportSubscription = useMutation({
    mutationFn: () => postJson<SupportSubscription, SupportSubscriptionPayload>(`/commerce/workspaces/${selectedWorkspace?.id}/support-subscriptions`, supportForm.values),
    onSuccess: async () => {
      supportForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['commerce-support-subscriptions'] });
      await queryClient.invalidateQueries({ queryKey: ['notification-summary'] });
    },
  });
  const createSupportRequest = useMutation({
    mutationFn: () => postJson<SupportRequest, SupportRequestPayload>(`/commerce/workspaces/${selectedWorkspace?.id}/support-requests`, supportRequestForm.values),
    onSuccess: async () => {
      supportRequestForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['commerce-support-requests', selectedWorkspace?.id] });
      await queryClient.invalidateQueries({ queryKey: ['notification-summary'] });
    },
  });
  const updateSupportRequestStatus = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SupportRequestStatusPayload }) =>
      putJson<SupportRequest, SupportRequestStatusPayload>(`/commerce/support-requests/${id}/status`, payload),
    onSuccess: async (supportRequest) => {
      setSupportRequestStatusById((current) => ({ ...current, [supportRequest.id]: supportRequest.status }));
      setSupportRequestResolutionById((current) => ({ ...current, [supportRequest.id]: supportRequest.resolution || '' }));
      await queryClient.invalidateQueries({ queryKey: ['commerce-support-requests', selectedWorkspace?.id] });
      await queryClient.invalidateQueries({ queryKey: ['notification-summary'] });
    },
  });
  const createDispute = useMutation({
    mutationFn: () => postJson<DisputeCase, DisputePayload>(`/commerce/workspaces/${selectedWorkspace?.id}/disputes`, disputeForm.values),
    onSuccess: async () => {
      disputeForm.resetForm();
      await queryClient.invalidateQueries({ queryKey: ['commerce-disputes', selectedWorkspace?.id] });
      await queryClient.invalidateQueries({ queryKey: ['notification-summary'] });
    },
  });
  const updateDisputeStatus = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DisputeStatusPayload }) => putJson<DisputeCase, DisputeStatusPayload>(`/commerce/disputes/${id}/status`, payload),
    onSuccess: async (dispute) => {
      setDisputeStatusById((current) => ({ ...current, [dispute.id]: dispute.status }));
      setDisputeResolutionById((current) => ({ ...current, [dispute.id]: dispute.resolution || '' }));
      await queryClient.invalidateQueries({ queryKey: ['commerce-disputes', selectedWorkspace?.id] });
      await queryClient.invalidateQueries({ queryKey: ['notification-summary'] });
    },
  });
  const uploadAttachment = useMutation({
    mutationFn: (input: { key: string; scopeType: AttachmentScope; scopeId: string; file: File; label?: string | undefined }) => {
      setUploadingAttachmentKey(input.key);
      setAttachmentErrorsByKey((current) => ({ ...current, [input.key]: '' }));
      return uploadService.uploadEvidenceAttachment(
        {
          scopeType: input.scopeType,
          scopeId: input.scopeId,
          file: input.file,
          label: input.label,
        },
        (progress) => setAttachmentProgressByKey((current) => ({ ...current, [input.key]: progress }))
      );
    },
    onSuccess: async (_attachment, input) => {
      setAttachmentFilesByKey((current) => ({ ...current, [input.key]: null }));
      setAttachmentLabelsByKey((current) => ({ ...current, [input.key]: '' }));
      setAttachmentProgressByKey((current) => ({ ...current, [input.key]: 0 }));
      await queryClient.invalidateQueries({ queryKey: ['attachments', selectedWorkspace?.id] });
      await queryClient.invalidateQueries({ queryKey: ['notification-summary'] });
    },
    onError: (error, input) => {
      setAttachmentErrorsByKey((current) => ({ ...current, [input.key]: uploadErrorMessage(error) }));
    },
    onSettled: () => {
      setUploadingAttachmentKey('');
    },
  });

  const submit = workspaceForm.handleSubmit(() => {
    createWorkspace.mutate();
  });
  const submitMilestone = milestoneForm.handleSubmit(() => {
    if (selectedWorkspace?.id) {
      createMilestone.mutate();
    }
  });
  const submitDeliverable = deliverableForm.handleSubmit(() => {
    if (selectedMilestone?.id) {
      createDeliverable.mutate();
    }
  });
  const submitParticipant = participantForm.handleSubmit(() => {
    if (selectedWorkspace?.id) {
      addParticipant.mutate();
    }
  });
  const submitSupport = supportForm.handleSubmit(() => {
    if (selectedWorkspace?.id) {
      createSupportSubscription.mutate();
    }
  });
  const submitSupportRequest = supportRequestForm.handleSubmit(() => {
    if (selectedWorkspace?.id && (supportRequestForm.values.supportSubscriptionId || supportRequestForm.values.teamId)) {
      createSupportRequest.mutate();
    }
  });
  const submitSupportRequestStatus = (supportRequest: SupportRequest) => {
    updateSupportRequestStatus.mutate({
      id: supportRequest.id,
      payload: {
        status: supportRequestStatusById[supportRequest.id] || supportRequest.status,
        resolution: supportRequestResolutionById[supportRequest.id] || supportRequest.resolution || '',
      },
    });
  };
  const submitDispute = disputeForm.handleSubmit(() => {
    if (selectedWorkspace?.id) {
      createDispute.mutate();
    }
  });
  const submitDisputeStatus = (dispute: DisputeCase) => {
    updateDisputeStatus.mutate({
      id: dispute.id,
      payload: {
        status: disputeStatusById[dispute.id] || dispute.status,
        resolution: disputeResolutionById[dispute.id] || dispute.resolution || '',
      },
    });
  };
  const scopeAttachments = (scopeType: AttachmentScope, scopeId: string) =>
    attachmentsByScope[attachmentKey(scopeType, scopeId)] || [];
  const selectAttachmentFile = (scopeType: AttachmentScope, scopeId: string, file: File | null) => {
    const key = attachmentKey(scopeType, scopeId);
    setAttachmentFilesByKey((current) => ({ ...current, [key]: file }));
    setAttachmentErrorsByKey((current) => ({ ...current, [key]: '' }));
  };
  const submitAttachment = (scopeType: AttachmentScope, scopeId: string) => {
    const key = attachmentKey(scopeType, scopeId);
    const file = attachmentFilesByKey[key];
    if (!file) {
      setAttachmentErrorsByKey((current) => ({ ...current, [key]: 'Choose a file before uploading evidence.' }));
      return;
    }
    uploadAttachment.mutate({
      key,
      scopeType,
      scopeId,
      file,
      label: attachmentLabelsByKey[key] || undefined,
    });
  };
  const openAttachment = async (attachment: EvidenceAttachment) => {
    setAttachmentOpenError('');
    const popup = window.open('about:blank', '_blank');
    try {
      const response = await getJson<AttachmentDownloadUrl>(`/attachments/${attachment.id}/download-url`);
      if (popup) {
        popup.opener = null;
        popup.location.href = response.downloadUrl;
      } else {
        window.location.assign(response.downloadUrl);
      }
    } catch (error) {
      popup?.close();
      setAttachmentOpenError(uploadErrorMessage(error));
    }
  };
  const renderAttachmentControls = (scopeType: AttachmentScope, scopeId: string) => {
    const key = attachmentKey(scopeType, scopeId);
    const isUploading = uploadingAttachmentKey === key && uploadAttachment.isPending;
    const selectedFile = attachmentFilesByKey[key] || null;

    return (
      <Stack spacing={1} sx={{ mt: 1.25 }}>
        <AttachmentList attachments={scopeAttachments(scopeType, scopeId)} onOpenAttachment={openAttachment} />
        {canAttachEvidence && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: selectedFile ? 'minmax(220px, 1fr) 220px auto' : 'minmax(220px, 1fr)' },
              gap: 1,
              alignItems: 'start',
            }}
          >
            <FileUpload
              label="Attach evidence"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.csv,.json,.zip,.docx,.xlsx,.pptx"
              maxSize={10}
              selectedFile={selectedFile}
              loading={isUploading}
              error={attachmentErrorsByKey[key]}
              helperText={attachmentProgressByKey[key] ? `${attachmentProgressByKey[key]}% uploaded` : undefined}
              onFileSelect={(file) => selectAttachmentFile(scopeType, scopeId, file)}
              onClear={() => selectAttachmentFile(scopeType, scopeId, null)}
            />
            {selectedFile && (
              <>
                <TextField
                  size="small"
                  label="Evidence label"
                  value={attachmentLabelsByKey[key] || ''}
                  onChange={(event) => setAttachmentLabelsByKey((current) => ({ ...current, [key]: event.target.value }))}
                />
                <Button variant="contained" onClick={() => submitAttachment(scopeType, scopeId)} disabled={isUploading}>
                  Upload
                </Button>
              </>
            )}
          </Box>
        )}
      </Stack>
    );
  };
  const activeWorkspaceCount = workspaceList.filter((workspace) => workspace.status === 'ACTIVE_DELIVERY').length;
  const blockedWorkspaceCount = workspaceList.filter((workspace) => workspace.status === 'BLOCKED').length;
  const completedMilestones = milestoneList.filter((milestone) => milestone.status === 'ACCEPTED').length;
  const blockedSupportCount = (supportRequests.data || []).filter(
    (request) => request.priority === 'URGENT' || request.slaStatus === 'OVERDUE' || request.slaStatus === 'ESCALATED'
  ).length;
  const workspaceProgress = milestoneList.length
    ? Math.round((completedMilestones / milestoneList.length) * 100)
    : selectedWorkspace?.status === 'ACTIVE_DELIVERY'
      ? 58
      : 0;

  return (
    <>
      <PageHeader title="Active Deliveries" description="Track milestone progress, deadlines, blocked work, evidence, support, and handoff readiness across productization workspaces." />
      <QueryState
        isLoading={packages.isLoading || workspaces.isLoading || teams.isLoading || supportSubscriptions.isLoading || supportRequests.isLoading || disputes.isLoading || attachments.isLoading}
        error={packages.error || workspaces.error || teams.error || supportSubscriptions.error || supportRequests.error || milestones.error || deliverables.error || participants.error || disputes.error || attachments.error || createWorkspace.error || createMilestone.error || createDeliverable.error || addParticipant.error || createSupportSubscription.error || createSupportRequest.error || updateSupportRequestStatus.error || createDispute.error || updateDisputeStatus.error || uploadAttachment.error}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2.5 }}>
        <MetricTile label="Active projects" value={activeWorkspaceCount} detail={`${workspaceList.length} total workspaces`} accent={appleColors.cyan} icon={<FactCheckOutlined />} />
        <MetricTile label="On-track milestones" value={completedMilestones} detail={`${milestoneList.length} in selected workspace`} accent={appleColors.green} icon={<TaskAltOutlined />} />
        <MetricTile label="Blocked items" value={blockedWorkspaceCount + blockedSupportCount} detail="Workspace or SLA blockers" accent={appleColors.red} icon={<ErrorOutlineOutlined />} />
        <MetricTile label="Upcoming deadlines" value={milestoneList.filter((milestone) => milestone.dueDate).length} detail="Dated milestones" accent={appleColors.purple} icon={<CalendarMonthOutlined />} />
      </Box>
      {selectedWorkspace && (
        <Surface sx={{ mb: 2.5 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <ProgressRing value={workspaceProgress} size={82} color={workspaceAccent(selectedWorkspace.status)} label="progress" />
              <Box>
                <Typography variant="h3">{selectedWorkspace.name}</Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {selectedWorkspace.packageInstance?.name || 'Workspace service plan'} · {milestoneList.length} milestones · {deliverables.data?.length || 0} deliverables in focus
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <StatusChip label={selectedWorkspace.status} />
              {selectedMilestone && <PastelChip label={`Next: ${selectedMilestone.title}`} accent={workspaceAccent(selectedMilestone.status)} />}
              <DotLabel label={formatLabel(selectedWorkspace.status)} color={workspaceAccent(selectedWorkspace.status)} />
            </Stack>
          </Stack>
        </Surface>
      )}
      {attachmentOpenError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAttachmentOpenError('')}>
          {attachmentOpenError}
        </Alert>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '380px 1fr' }, gap: 2 }}>
        <Stack spacing={1.5}>
          <Surface>
            <Box component="form" onSubmit={submit}>
              <Stack spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Service plan"
                  value={workspaceForm.values.packageInstanceId}
                  onChange={(event) => workspaceForm.setValue('packageInstanceId', event.target.value)}
                >
                  {(packages.data || []).map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  label="Workspace name"
                  value={workspaceForm.values.name}
                  onChange={(event) => workspaceForm.setValue('name', event.target.value)}
                />
                <Button type="submit" variant="contained" disabled={!workspaceForm.values.packageInstanceId || createWorkspace.isPending}>
                  Open workspace
                </Button>
              </Stack>
            </Box>
          </Surface>
          {workspaceList.length ? (
            <Surface>
              <Stack spacing={1}>
                {workspaceList.map((workspace) => (
                  <Button
                    key={workspace.id}
                    variant={selectedWorkspace?.id === workspace.id ? 'contained' : 'outlined'}
                    color={selectedWorkspace?.id === workspace.id ? 'primary' : 'inherit'}
                    onClick={() => {
                      setSelectedWorkspaceId(workspace.id);
                      setSelectedMilestoneId('');
                    }}
                    sx={{
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      gap: 1.5,
                      overflow: 'hidden',
                      '& span:first-of-type': {
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      },
                      '& span:last-of-type': {
                        flex: '0 0 auto',
                        color: selectedWorkspace?.id === workspace.id ? 'inherit' : 'text.secondary',
                      },
                    }}
                  >
                    <span>{workspace.name}</span>
                    <span>{formatLabel(workspace.status)}</span>
                  </Button>
                ))}
              </Stack>
            </Surface>
          ) : (
            <EmptyState label="No workspaces have been opened yet." />
          )}
        </Stack>
        <Surface>
          {selectedWorkspace ? (
            <Stack spacing={2.5}>
              <Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                  <Typography variant="h3">{selectedWorkspace.name}</Typography>
                  <StatusChip label={selectedWorkspace.status} />
                </Stack>
              </Box>
              {(milestones.isFetching || deliverables.isFetching || supportRequests.isFetching || disputes.isFetching || attachments.isFetching) && <LinearProgress />}
              <Box>
                <Typography variant="h4">Workspace evidence</Typography>
                {renderAttachmentControls('WORKSPACE', selectedWorkspace.id)}
              </Box>
              <Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                  <Typography variant="h4">Participants</Typography>
                  {canInviteParticipants && (
                    <Box component="form" onSubmit={submitParticipant} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <TextField
                        size="small"
                        label="Email"
                        value={participantForm.values.email}
                        onChange={(event) => participantForm.setValue('email', event.target.value)}
                      />
                      <TextField
                        select
                        size="small"
                        label="Role"
                        value={participantForm.values.role}
                        onChange={(event) => participantForm.setValue('role', event.target.value as WorkspaceParticipant['role'])}
                        sx={{ minWidth: 170 }}
                      >
                        {participantRoles.map((role) => (
                          <MenuItem key={role} value={role}>
                            {role.replaceAll('_', ' ').toLowerCase()}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Button type="submit" variant="outlined" disabled={!participantForm.values.email || addParticipant.isPending}>
                        Add
                      </Button>
                    </Box>
                  )}
                </Stack>
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  {participants.data?.length ? (
                    participants.data.map((participant) => (
                      <Stack
                        key={participant.id}
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={1}
                        justifyContent="space-between"
                        sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}
                      >
                        <Typography variant="body2">{participant.user.email}</Typography>
                        <Typography variant="body2" color={participant.active ? 'text.secondary' : 'error.main'}>
                          {participant.active ? participant.role.replaceAll('_', ' ').toLowerCase() : 'inactive'}
                        </Typography>
                      </Stack>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Add delivery specialists, team leads, and advisors before execution starts.
                    </Typography>
                  )}
                </Stack>
              </Box>
              <Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                  <Typography variant="h4">Support</Typography>
                  {canManageSupport && (
                    <Box component="form" onSubmit={submitSupport} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <TextField
                        select
                        size="small"
                        label="Team"
                        value={supportForm.values.teamId}
                        onChange={(event) => supportForm.setValue('teamId', event.target.value)}
                        sx={{ minWidth: 180 }}
                      >
                        {(teams.data || []).map((team) => (
                          <MenuItem key={team.id} value={team.id}>
                            {team.name}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        size="small"
                        label="Plan"
                        value={supportForm.values.planName}
                        onChange={(event) => supportForm.setValue('planName', event.target.value)}
                      />
                      <TextField
                        size="small"
                        type="number"
                        label="Monthly cents"
                        value={supportForm.values.monthlyAmountCents}
                        onChange={(event) => supportForm.setValue('monthlyAmountCents', Number(event.target.value))}
                        sx={{ width: 150 }}
                      />
                      <Button type="submit" variant="outlined" disabled={!supportForm.values.teamId || !supportForm.values.planName || createSupportSubscription.isPending}>
                        Add
                      </Button>
                    </Box>
                  )}
                </Stack>
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  {selectedSupportSubscriptions.length ? (
                    selectedSupportSubscriptions.map((subscription) => (
                      <Stack
                        key={subscription.id}
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={1}
                        justifyContent="space-between"
                        sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}
                      >
                        <Box>
                          <Typography variant="body2">{subscription.planName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {subscription.team.name} · {formatMoney(subscription.monthlyAmountCents, subscription.currency)}
                          </Typography>
                        </Box>
                        <StatusChip label={subscription.status} />
                      </Stack>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Add a support subscription when the workspace moves into handoff or ongoing operations.
                    </Typography>
                  )}
                </Stack>
                <Box sx={{ mt: 2 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                    <Typography variant="h5">Support requests</Typography>
                    {canManageSupport && (
                      <Box component="form" onSubmit={submitSupportRequest} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <TextField
                          select
                          size="small"
                          label="Plan"
                          value={supportRequestForm.values.supportSubscriptionId || ''}
                          onChange={(event) => {
                            const subscription = activeSupportSubscriptions.find((item) => item.id === event.target.value);
                            supportRequestForm.setValue('supportSubscriptionId', event.target.value || null);
                            supportRequestForm.setValue('teamId', subscription?.team.id || supportRequestForm.values.teamId);
                          }}
                          sx={{ minWidth: 190 }}
                        >
                          <MenuItem value="">No plan</MenuItem>
                          {activeSupportSubscriptions.map((subscription) => (
                            <MenuItem key={subscription.id} value={subscription.id}>
                              {subscription.planName}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          select
                          size="small"
                          label="Team"
                          value={supportRequestForm.values.teamId || ''}
                          onChange={(event) => supportRequestForm.setValue('teamId', event.target.value || null)}
                          sx={{ minWidth: 180 }}
                        >
                          {(teams.data || []).map((team) => (
                            <MenuItem key={team.id} value={team.id}>
                              {team.name}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          size="small"
                          label="Request"
                          value={supportRequestForm.values.title}
                          onChange={(event) => supportRequestForm.setValue('title', event.target.value)}
                        />
                        <TextField
                          select
                          size="small"
                          label="Priority"
                          value={supportRequestForm.values.priority}
                          onChange={(event) => supportRequestForm.setValue('priority', event.target.value as SupportRequest['priority'])}
                          sx={{ minWidth: 130 }}
                        >
                          {supportPriorities.map((priority) => (
                            <MenuItem key={priority} value={priority}>
                              {priority.toLowerCase()}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          size="small"
                          type="date"
                          label="Due"
                          value={supportRequestForm.values.dueOn || ''}
                          onChange={(event) => supportRequestForm.setValue('dueOn', event.target.value || null)}
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          size="small"
                          label="Context"
                          value={supportRequestForm.values.description}
                          onChange={(event) => supportRequestForm.setValue('description', event.target.value)}
                          sx={{ minWidth: { xs: '100%', sm: 260 } }}
                        />
                        <Button
                          type="submit"
                          variant="outlined"
                          disabled={
                            !supportRequestForm.values.title ||
                            !supportRequestForm.values.description ||
                            (!supportRequestForm.values.supportSubscriptionId && !supportRequestForm.values.teamId) ||
                            createSupportRequest.isPending
                          }
                        >
                          Open
                        </Button>
                      </Box>
                    )}
                  </Stack>
                  <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                    {supportRequests.data?.length ? (
                      supportRequests.data.map((request) => (
                        <Box key={request.id} sx={{ borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                            <Box>
                              <Typography variant="subtitle1">{request.title}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {request.team.name} · {request.priority.toLowerCase()}
                                {request.dueOn ? ` · due ${request.dueOn}` : ''}
                                {request.escalationCount ? ` · escalations ${request.escalationCount}` : ''}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                              <StatusChip label={request.status} />
                              <StatusChip label={request.slaStatus} />
                            </Stack>
                          </Stack>
                          {request.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                              {request.description}
                            </Typography>
                          )}
                          {canManageSupport && (
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 1 }}>
                              <TextField
                                select
                                size="small"
                                label="Status"
                                value={supportRequestStatusById[request.id] || request.status}
                                onChange={(event) =>
                                  setSupportRequestStatusById((current) => ({ ...current, [request.id]: event.target.value as SupportRequest['status'] }))
                                }
                                sx={{ minWidth: 210 }}
                              >
                                {supportRequestStatuses.map((statusOption) => (
                                  <MenuItem key={statusOption} value={statusOption}>
                                    {statusOption.replaceAll('_', ' ').toLowerCase()}
                                  </MenuItem>
                                ))}
                              </TextField>
                              <TextField
                                size="small"
                                label="Resolution note"
                                value={supportRequestResolutionById[request.id] ?? request.resolution ?? ''}
                                onChange={(event) =>
                                  setSupportRequestResolutionById((current) => ({ ...current, [request.id]: event.target.value }))
                                }
                                sx={{ minWidth: { xs: '100%', md: 320 } }}
                              />
                              <Button variant="outlined" onClick={() => submitSupportRequestStatus(request)} disabled={updateSupportRequestStatus.isPending}>
                                Update
                              </Button>
                            </Stack>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No support requests are open for this workspace.
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Box>
              <Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                  <Typography variant="h4">Disputes</Typography>
                  {canManageDisputes && (
                    <Box component="form" onSubmit={submitDispute} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <TextField
                        select
                        size="small"
                        label="Team"
                        value={disputeForm.values.teamId || ''}
                        onChange={(event) => disputeForm.setValue('teamId', event.target.value || null)}
                        sx={{ minWidth: 180 }}
                      >
                        <MenuItem value="">Unassigned</MenuItem>
                        {(teams.data || []).map((team) => (
                          <MenuItem key={team.id} value={team.id}>
                            {team.name}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        size="small"
                        label="Title"
                        value={disputeForm.values.title}
                        onChange={(event) => disputeForm.setValue('title', event.target.value)}
                      />
                      <TextField
                        select
                        size="small"
                        label="Severity"
                        value={disputeForm.values.severity}
                        onChange={(event) => disputeForm.setValue('severity', event.target.value as DisputeCase['severity'])}
                        sx={{ minWidth: 140 }}
                      >
                        {disputeSeverities.map((severity) => (
                          <MenuItem key={severity} value={severity}>
                            {severity.toLowerCase()}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        size="small"
                        type="date"
                        label="Response due"
                        value={disputeForm.values.responseDueOn || ''}
                        onChange={(event) => disputeForm.setValue('responseDueOn', event.target.value || null)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        size="small"
                        label="Context"
                        value={disputeForm.values.description}
                        onChange={(event) => disputeForm.setValue('description', event.target.value)}
                        sx={{ minWidth: { xs: '100%', sm: 260 } }}
                      />
                      <Button type="submit" variant="outlined" disabled={!disputeForm.values.title || !disputeForm.values.description || createDispute.isPending}>
                        Open
                      </Button>
                    </Box>
                  )}
                </Stack>
                <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                  {disputes.data?.length ? (
                    disputes.data.map((dispute) => (
                      <Box key={dispute.id} sx={{ borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                          <Box>
                            <Typography variant="subtitle1">{dispute.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {dispute.team?.name || 'Unassigned'} · {dispute.severity.toLowerCase()}
                              {dispute.responseDueOn ? ` · due ${dispute.responseDueOn}` : ''}
                            </Typography>
                          </Box>
                          <StatusChip label={dispute.status} />
                        </Stack>
                        {dispute.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                            {dispute.description}
                          </Typography>
                        )}
                        {canManageDisputes && (
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mt: 1 }}>
                            <TextField
                              select
                              size="small"
                              label="Status"
                              value={disputeStatusById[dispute.id] || dispute.status}
                              onChange={(event) =>
                                setDisputeStatusById((current) => ({ ...current, [dispute.id]: event.target.value as DisputeCase['status'] }))
                              }
                              sx={{ minWidth: 210 }}
                            >
                              {disputeStatuses.map((statusOption) => (
                                <MenuItem key={statusOption} value={statusOption}>
                                  {statusOption.replaceAll('_', ' ').toLowerCase()}
                                </MenuItem>
                              ))}
                            </TextField>
                            <TextField
                              size="small"
                              label="Resolution note"
                              value={disputeResolutionById[dispute.id] ?? dispute.resolution ?? ''}
                              onChange={(event) =>
                                setDisputeResolutionById((current) => ({ ...current, [dispute.id]: event.target.value }))
                              }
                              sx={{ minWidth: { xs: '100%', md: 320 } }}
                            />
                            <Button
                              variant="outlined"
                              onClick={() => submitDisputeStatus(dispute)}
                              disabled={updateDisputeStatus.isPending}
                            >
                              Update
                            </Button>
                          </Stack>
                        )}
                        {renderAttachmentControls('DISPUTE', dispute.id)}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No disputes are open for this workspace.
                    </Typography>
                  )}
                </Stack>
              </Box>
              <Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                  <Typography variant="h4">Milestones</Typography>
                  <Box component="form" onSubmit={submitMilestone} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <TextField
                      size="small"
                      label="Milestone"
                      value={milestoneForm.values.title}
                      onChange={(event) => milestoneForm.setValue('title', event.target.value)}
                    />
                    <TextField
                      size="small"
                      type="date"
                      label="Due"
                      value={milestoneForm.values.dueDate || ''}
                      onChange={(event) => milestoneForm.setValue('dueDate', event.target.value || null)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <Button type="submit" variant="outlined" disabled={!milestoneForm.values.title || createMilestone.isPending}>
                      Add
                    </Button>
                  </Box>
                </Stack>
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  {milestoneList.length ? (
                    milestoneList.map((milestone) => (
                      <Box key={milestone.id} sx={{ borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
                        <Button
                          fullWidth
                          variant={selectedMilestone?.id === milestone.id ? 'contained' : 'text'}
                          onClick={() => setSelectedMilestoneId(milestone.id)}
                          sx={{
                            justifyContent: 'space-between',
                            textAlign: 'left',
                            gap: 1.5,
                            overflow: 'hidden',
                            '& span:first-of-type': {
                              minWidth: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            },
                            '& span:last-of-type': {
                              flex: '0 0 auto',
                              color: selectedMilestone?.id === milestone.id ? 'inherit' : 'text.secondary',
                            },
                          }}
                        >
                          <span>{milestone.title}</span>
                          <span>{formatLabel(milestone.status)}</span>
                        </Button>
                        {milestone.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                            {milestone.description}
                          </Typography>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No milestones yet.
                    </Typography>
                  )}
                </Stack>
              </Box>
              <Box>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                  <Typography variant="h4">Deliverables</Typography>
                  <Box component="form" onSubmit={submitDeliverable} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <TextField
                      size="small"
                      label="Deliverable"
                      value={deliverableForm.values.title}
                      onChange={(event) => deliverableForm.setValue('title', event.target.value)}
                    />
                    <Button type="submit" variant="outlined" disabled={!selectedMilestone?.id || !deliverableForm.values.title || createDeliverable.isPending}>
                      Add
                    </Button>
                  </Box>
                </Stack>
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  {deliverables.data?.length ? (
                    deliverables.data.map((deliverable) => (
                      <Box key={deliverable.id} sx={{ borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                          <Typography variant="subtitle1">{deliverable.title}</Typography>
                          <StatusChip label={deliverable.status} />
                        </Stack>
                        {deliverable.evidence && (
                          <Typography variant="body2" color="text.secondary">
                            {deliverable.evidence}
                          </Typography>
                        )}
                        {renderAttachmentControls('DELIVERABLE', deliverable.id)}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Select a milestone and add deliverables as evidence appears.
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Stack>
          ) : (
            <Typography color="text.secondary">Open a workspace to coordinate milestones and deliverables.</Typography>
          )}
        </Surface>
      </Box>
    </>
  );
}
