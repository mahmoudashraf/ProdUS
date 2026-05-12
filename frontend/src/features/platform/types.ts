export interface BaseRecord {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CurrentUserSummary {
  id: string;
  email: string;
  role: 'ADMIN' | 'PRODUCT_OWNER' | 'TEAM_MANAGER' | 'SPECIALIST' | 'ADVISOR';
}

export interface ServiceCategory extends BaseRecord {
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  active: boolean;
}

export interface ServiceModule extends BaseRecord {
  category?: ServiceCategory;
  name: string;
  slug: string;
  description?: string;
  requiredInputs?: string;
  expectedDeliverables?: string;
  acceptanceCriteria?: string;
  timelineRange?: string;
  priceRange?: string;
  sortOrder: number;
  active: boolean;
}

export interface ProductProfile extends BaseRecord {
  name: string;
  summary?: string;
  businessStage: 'IDEA' | 'PROTOTYPE' | 'VALIDATED' | 'LIVE' | 'SCALING';
  techStack?: string;
  productUrl?: string;
  repositoryUrl?: string;
  riskProfile?: string;
}

export interface RequirementIntake extends BaseRecord {
  productProfile?: ProductProfile;
  requestedServiceModule?: ServiceModule;
  businessGoal: string;
  currentProblems?: string;
  constraints?: string;
  riskSignals?: string;
  requirementBrief?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'PACKAGE_RECOMMENDED' | 'CLOSED';
}

export interface PackageInstance extends BaseRecord {
  productProfile?: ProductProfile;
  requirementIntake?: RequirementIntake;
  name: string;
  summary?: string;
  status:
    | 'DRAFT'
    | 'AWAITING_TEAM'
    | 'SCOPE_NEGOTIATION'
    | 'ACTIVE_DELIVERY'
    | 'MILESTONE_REVIEW'
    | 'DELIVERED'
    | 'SUPPORT_HANDOFF'
    | 'CLOSED';
}

export interface PackageModule extends BaseRecord {
  packageInstance?: PackageInstance;
  serviceModule: ServiceModule;
  sequenceOrder: number;
  required: boolean;
  rationale?: string;
  deliverables?: string;
  acceptanceCriteria?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'REVIEW' | 'ACCEPTED' | 'BLOCKED';
}

export interface Team extends BaseRecord {
  name: string;
  description?: string;
  timezone?: string;
  capabilitiesSummary?: string;
  typicalProjectSize?: string;
  verificationStatus:
    | 'APPLIED'
    | 'VERIFIED'
    | 'CERTIFIED'
    | 'SPECIALIST'
    | 'OPERATIONS_READY'
    | 'SUSPENDED';
  active: boolean;
}

export interface TeamCapability extends BaseRecord {
  team?: Team;
  serviceCategory: ServiceCategory;
  serviceModule?: ServiceModule;
  evidenceUrl?: string;
  notes?: string;
}

export interface TeamMember extends BaseRecord {
  team?: Team;
  user: CurrentUserSummary;
  role: 'LEAD' | 'DELIVERY_MANAGER' | 'SPECIALIST' | 'ADVISOR' | 'QUALITY_REVIEWER';
  active: boolean;
}

export interface TeamRecommendation {
  team: Team;
  score: number;
  reasons: string[];
}

export interface TeamShortlist extends BaseRecord {
  owner?: CurrentUserSummary;
  packageInstance?: PackageInstance;
  team: Team;
  status: 'ACTIVE' | 'COMPARED' | 'REQUESTED_PROPOSAL' | 'ARCHIVED';
  notes?: string;
}

export interface ProjectWorkspace extends BaseRecord {
  packageInstance?: PackageInstance;
  name: string;
  status:
    | 'DRAFT_PACKAGE'
    | 'AWAITING_TEAM_PROPOSAL'
    | 'SCOPE_NEGOTIATION'
    | 'ACTIVE_DELIVERY'
    | 'BLOCKED'
    | 'MILESTONE_REVIEW'
    | 'DELIVERED'
    | 'SUPPORT_HANDOFF'
    | 'CLOSED';
}

export interface WorkspaceParticipant extends BaseRecord {
  workspace?: ProjectWorkspace;
  user: CurrentUserSummary;
  addedBy?: CurrentUserSummary;
  role: 'OWNER' | 'COORDINATOR' | 'TEAM_LEAD' | 'SPECIALIST' | 'ADVISOR' | 'VIEWER';
  active: boolean;
}

export interface Milestone extends BaseRecord {
  workspace?: ProjectWorkspace;
  title: string;
  description?: string;
  dueDate?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'ACCEPTED' | 'BLOCKED';
}

export interface Deliverable extends BaseRecord {
  milestone?: Milestone;
  title: string;
  evidence?: string;
  status: 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
}

export interface QuoteProposal extends BaseRecord {
  packageInstance?: PackageInstance;
  team: Team;
  submittedBy?: CurrentUserSummary;
  title: string;
  scope?: string;
  assumptions?: string;
  timelineDays: number;
  currency: string;
  fixedPriceCents: number;
  platformFeeCents: number;
  status: 'DRAFT' | 'SUBMITTED' | 'OWNER_ACCEPTED' | 'OWNER_REJECTED' | 'WITHDRAWN' | 'EXPIRED';
}

export interface ContractAgreement extends BaseRecord {
  proposal?: QuoteProposal;
  workspace?: ProjectWorkspace;
  owner?: CurrentUserSummary;
  team: Team;
  title: string;
  terms?: string;
  effectiveOn?: string;
  signedAt?: string;
  status: 'DRAFT' | 'SENT' | 'SIGNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

export interface InvoiceRecord extends BaseRecord {
  contractAgreement?: ContractAgreement;
  owner?: CurrentUserSummary;
  issuedBy?: CurrentUserSummary;
  invoiceNumber: string;
  description?: string;
  amountCents: number;
  currency: string;
  dueDate?: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID' | 'OVERDUE';
}

export interface SupportSubscription extends BaseRecord {
  workspace?: ProjectWorkspace;
  owner?: CurrentUserSummary;
  team: Team;
  createdBy?: CurrentUserSummary;
  planName: string;
  sla?: string;
  monthlyAmountCents: number;
  currency: string;
  startsOn?: string;
  renewsOn?: string;
  status: 'PROPOSED' | 'ACTIVE' | 'PAUSED' | 'CANCELLED';
}

export interface SupportRequest extends BaseRecord {
  workspace?: ProjectWorkspace;
  supportSubscription?: SupportSubscription;
  team: Team;
  owner?: CurrentUserSummary;
  openedBy?: CurrentUserSummary;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'WAITING_ON_OWNER' | 'RESOLVED' | 'CANCELLED';
  slaStatus: 'ON_TRACK' | 'DUE_SOON' | 'OVERDUE' | 'ESCALATED' | 'RESOLVED';
  dueOn?: string;
  resolvedAt?: string;
  escalatedAt?: string;
  lastSlaCheckAt?: string;
  escalationCount: number;
  resolution?: string;
}

export interface TeamReputationEvent extends BaseRecord {
  team?: Team;
  workspace?: ProjectWorkspace;
  createdBy?: CurrentUserSummary;
  eventType: 'MILESTONE_ACCEPTED' | 'DELIVERABLE_REVIEW' | 'CONTRACT_COMPLETED' | 'SUPPORT_REVIEW' | 'WORKSPACE_REVIEW' | 'DISPUTE';
  rating: number;
  verified: boolean;
  notes?: string;
}

export interface PaymentWebhookEvent extends BaseRecord {
  invoice?: InvoiceRecord;
  provider: string;
  eventId: string;
  eventType: string;
  signatureValid: boolean;
  processed: boolean;
  processedAt?: string;
  errorMessage?: string;
}

export interface SignatureWebhookEvent extends BaseRecord {
  contractAgreement?: ContractAgreement;
  provider: string;
  eventId: string;
  eventType: string;
  signatureValid: boolean;
  processed: boolean;
  processedAt?: string;
  errorMessage?: string;
}

export interface DisputeCase extends BaseRecord {
  workspace?: ProjectWorkspace;
  team?: Team;
  openedBy?: CurrentUserSummary;
  title: string;
  description?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'UNDER_REVIEW' | 'OWNER_RESPONSE_NEEDED' | 'TEAM_RESPONSE_NEEDED' | 'RESOLVED' | 'CANCELLED';
  responseDueOn?: string;
  resolution?: string;
}

export type AttachmentScope = 'WORKSPACE' | 'DELIVERABLE' | 'DISPUTE';

export interface EvidenceAttachment extends BaseRecord {
  workspace?: ProjectWorkspace;
  deliverable?: Deliverable;
  dispute?: DisputeCase;
  uploadedBy?: CurrentUserSummary;
  scopeType: AttachmentScope;
  scopeId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  label?: string;
}

export interface AttachmentDownloadUrl {
  downloadUrl: string;
  expiresInSeconds: number;
}

export interface PlatformNotification extends BaseRecord {
  actor?: CurrentUserSummary;
  workspace?: ProjectWorkspace;
  type:
    | 'PROPOSAL_SUBMITTED'
    | 'PROPOSAL_STATUS_CHANGED'
    | 'CONTRACT_CREATED'
    | 'CONTRACT_STATUS_CHANGED'
    | 'CONTRACT_SIGNED'
    | 'INVOICE_ISSUED'
    | 'INVOICE_STATUS_CHANGED'
    | 'INVOICE_PAID'
    | 'SUPPORT_SUBSCRIPTION_CREATED'
    | 'SUPPORT_SUBSCRIPTION_STATUS_CHANGED'
    | 'SUPPORT_REQUEST_OPENED'
    | 'SUPPORT_REQUEST_UPDATED'
    | 'SUPPORT_REQUEST_SLA_DUE_SOON'
    | 'SUPPORT_REQUEST_SLA_ESCALATED'
    | 'DISPUTE_OPENED'
    | 'DISPUTE_UPDATED'
    | 'EVIDENCE_ATTACHED'
    | 'SYSTEM';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  title: string;
  body?: string;
  actionUrl?: string;
  sourceType: string;
  sourceId: string;
  readAt?: string;
  expiresAt?: string;
}

export interface NotificationSummary {
  unreadCount: number;
  latest: PlatformNotification[];
}

export interface NotificationDelivery extends BaseRecord {
  notificationId: string;
  notificationType: PlatformNotification['type'];
  notificationTitle: string;
  recipient?: CurrentUserSummary;
  channel: 'EMAIL' | 'PUSH';
  status: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
  destination: string;
  provider?: string;
  providerMessageId?: string;
  attemptCount: number;
  nextAttemptAt?: string;
  deliveredAt?: string;
  lastError?: string;
}

export interface NotificationDeliveryRun {
  scannedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
}

export interface NotificationDeliveryConfig {
  enabled: boolean;
  schedulerEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  emailProvider: string;
  pushProvider: string;
  emailProviderConfigured: boolean;
  pushProviderConfigured: boolean;
  batchSize: number;
  maxAttempts: number;
  retryDelaySeconds: number;
  webhookTimeoutMs: number;
}

export interface SupportSlaRun {
  scannedCount: number;
  dueSoonCount: number;
  escalatedCount: number;
  updatedCount: number;
}

export interface AIRecommendation extends BaseRecord {
  recommendationType: string;
  sourceEntityType?: string;
  sourceEntityId?: string;
  promptVersion?: string;
  confidence?: number;
  rationale?: string;
  outputJson?: string;
  humanFeedback?: string;
}
