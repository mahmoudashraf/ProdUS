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
  stableCode?: string;
  serviceLayer?: string;
  description?: string;
  ownerOutcome?: string;
  requiredInputs?: string;
  expectedDeliverables?: string;
  acceptanceCriteria?: string;
  timelineRange?: string;
  priceRange?: string;
  workflowSteps?: string;
  requiredEvidenceTypes?: string;
  suggestedTeamRoles?: string;
  aiAssistanceTags?: string;
  humanReviewRequired: boolean;
  visible: boolean;
  releaseStage?: string;
  maturityLevel?: string;
  sourceAliases?: string;
  sortOrder: number;
  active: boolean;
}

export interface ServiceDependency extends BaseRecord {
  sourceModule?: ServiceModule;
  dependsOnModule?: ServiceModule;
  reason?: string;
  message?: string;
  dependencyType:
    | 'HARD'
    | 'SOFT'
    | 'PARALLEL'
    | 'APPROVAL'
    | 'EVIDENCE'
    | 'ACCESS'
    | 'RISK'
    | 'COMMERCIAL';
  severity: 'INFO' | 'RECOMMENDED' | 'WARNING' | 'BLOCKER';
  ruleMetadata?: string;
  required: boolean;
}

export interface PackageTemplateModule extends BaseRecord {
  serviceModule: ServiceModule;
  sequenceOrder: number;
  required: boolean;
  phaseName?: string;
  rationale?: string;
}

export interface PackageTemplate extends BaseRecord {
  name: string;
  slug: string;
  description?: string;
  targetProductStage?: string;
  customerFit?: string;
  timelineRange?: string;
  budgetRange?: string;
  outcomeSummary?: string;
  aiReadinessNotes?: string;
  humanReviewRequired: boolean;
  active: boolean;
  sortOrder: number;
  modules: PackageTemplateModule[];
}

export interface CatalogRule extends BaseRecord {
  slug: string;
  ruleType: 'SERVICE_SELECTED' | 'GOAL_KEYWORD' | 'PRODUCT_STAGE' | 'RISK_SIGNAL' | 'ALWAYS';
  triggerKey?: string;
  sourceModule?: ServiceModule;
  recommendedModule: ServiceModule;
  severity: 'INFO' | 'RECOMMENDED' | 'WARNING' | 'BLOCKER';
  message?: string;
  ruleMetadata?: string;
  humanReviewRequired: boolean;
  active: boolean;
  sortOrder: number;
}

export interface CatalogTemplateDefinition extends BaseRecord {
  slug: string;
  templateType:
    | 'INTAKE'
    | 'DIAGNOSIS'
    | 'PACKAGE'
    | 'MILESTONE'
    | 'ACCEPTANCE_CRITERION'
    | 'EVIDENCE'
    | 'HANDOFF'
    | 'SUPPORT'
    | 'AI_CONTEXT';
  name: string;
  description?: string;
  requiredInputs?: string;
  content?: string;
  outputContract?: string;
  active: boolean;
  sortOrder: number;
}

export interface AICapabilityConfig extends BaseRecord {
  slug: string;
  name: string;
  capabilityType: string;
  description?: string;
  inputContract?: string;
  outputContract?: string;
  allowedSources?: string;
  forbiddenClaims?: string;
  humanReviewRequired: boolean;
  enabled: boolean;
  sortOrder: number;
}

export interface CatalogRuleItem {
  source: string;
  sourceModule?: ServiceModule;
  recommendedModule: ServiceModule;
  reason?: string;
  severity: 'INFO' | 'RECOMMENDED' | 'WARNING' | 'BLOCKER';
  required: boolean;
  alreadySelected: boolean;
}

export interface CatalogRuleEvaluation {
  selectedModules: ServiceModule[];
  recommendations: CatalogRuleItem[];
  blockerCount: number;
  warningCount: number;
  nextBestActions: string[];
  aiReady: boolean;
  aiExecuted: boolean;
}

export interface ProductProfile extends BaseRecord {
  name: string;
  summary?: string;
  businessStage: 'IDEA' | 'PROTOTYPE' | 'VALIDATED' | 'LIVE' | 'SCALING';
  techStack?: string;
  productUrl?: string;
  repositoryUrl?: string;
  riskProfile?: string;
  creationMode?: 'MANUAL' | 'AI_ASSISTED';
  createdByAi?: boolean;
  aiCreationSummary?: string;
  aiProviderRequestId?: string;
  aiSourceAttachmentCount?: number;
}

export interface ProductProjectAttachment extends BaseRecord {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  label?: string;
  aiShareRequested: boolean;
  aiAccessExpiresAt?: string;
}

export interface AiDocumentShare {
  documentId: string;
  attachmentId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  expiresAt?: string;
  contentStatus?: string;
}

export interface DocumentUsageEvidence {
  documentId?: string;
  fileName: string;
  status: 'USED' | 'NOT_USED' | string;
  accessMethod: 'TEMPORARY_URL' | 'NONE' | string;
  evidence: string[];
  reason?: string;
}

export interface ServiceModuleRecommendation {
  moduleCode: string;
  moduleName?: string;
  categorySlug?: string;
  priority?: 'MUST' | 'SHOULD' | 'COULD' | 'LATER' | string;
  sequence?: number;
  reason?: string;
  evidenceBasis?: string[];
  expectedOutcome?: string;
  confidence?: number;
  accepted?: boolean;
}

export interface MissingCatalogCoverage {
  need: string;
  reason?: string;
  suggestedCatalogAction?: string;
}

export interface ProductCreationIntent {
  id: string;
  status: 'ANALYZING' | 'READY_FOR_ACTION' | 'CREATED' | 'EXPIRED' | 'FAILED';
  expiresAt: string;
  consentToken?: string;
  idempotencyKey: string;
  analysisProviderRequestId?: string;
  productId?: string;
  aiSourceAttachmentCount: number;
}

export interface ProductCreationFields {
  productName: string;
  summary: string;
  projectDescription?: string;
  businessProblem?: string;
  targetUsers?: string;
  businessStage: ProductProfile['businessStage'];
  techStack?: string;
  productUrl?: string;
  repositoryUrl?: string;
  riskProfile?: string;
  aiCreationSummary?: string;
  coreCapabilities?: string[];
  businessOutcomes?: string[];
  readinessGoals?: string[];
  recommendedServices?: string[];
  recommendedServiceModules?: ServiceModuleRecommendation[];
  missingCatalogCoverage?: MissingCatalogCoverage[];
  scannerFocusAreas?: string[];
  suggestedNextSteps?: string[];
  sourceInsights?: string[];
  assumptions: string[];
  missingEvidence: string[];
  documentUsage: DocumentUsageEvidence[];
}

export type ProductAnalysisMode = 'FULL_WITH_AI_OPPORTUNITIES' | 'AI_OPPORTUNITIES';

export interface AiOpportunityUseCase {
  title: string;
  workflow?: string;
  userValue?: string;
  businessValue?: string;
  loomaiCapability?: string;
  integrationPattern?: string;
  priority?: string;
  confidence?: number;
  evidenceBasis?: string[];
  recommendedServiceModules?: ServiceModuleRecommendation[];
}

export interface AiOpportunityReport {
  status?: string;
  summary?: string;
  opportunityScore?: number;
  confidence?: number;
  strategicRationale?: string;
  useCases?: AiOpportunityUseCase[];
  recommendedServices?: string[];
  recommendedServiceModules?: ServiceModuleRecommendation[];
  scannerFocusAreas?: string[];
  suggestedNextSteps?: string[];
  sourceInsights?: string[];
  assumptions?: string[];
  missingEvidence?: string[];
  provider?: string;
  providerRequestId?: string;
  live?: boolean;
}

export interface LoomAIIntegrationOverview {
  summary?: string;
  recommendedStartingPoint?: string;
  capabilities?: string[];
  implementationSteps?: string[];
  ownerDecisions?: string[];
  risks?: string[];
  sourceInsights?: string[];
  recommendedServiceModules?: ServiceModuleRecommendation[];
  provider?: string;
  providerRequestId?: string;
  live?: boolean;
}

export interface AiAssistedProductAnalysisResponse {
  intent: ProductCreationIntent;
  analysis: ProductCreationFields;
  attachments: ProductProjectAttachment[];
  aiSharedDocuments: AiDocumentShare[];
  assistant: AssistantQueryResponse;
  aiApplied: boolean;
  fallbackReason?: string;
  analysisMode: ProductAnalysisMode;
  aiOpportunityReport?: AiOpportunityReport;
  loomaiIntegrationOverview?: LoomAIIntegrationOverview;
  blockUnprovenAiDocumentUsage: boolean;
  runtimeActionPayload: Record<string, unknown>;
}

export interface ProductCreationActionResponse {
  product: ProductProfile;
  intent: ProductCreationIntent;
  attachments: ProductProjectAttachment[];
  auditEventId?: string;
  idempotentReplay: boolean;
  projectIntelligenceId?: string;
  createdServiceRecommendations: number;
  createdScannerRecommendations: number;
  createdReadinessTasks: number;
  createdCartServiceItems?: number;
  createdScanSourceId?: string;
}

export interface ScanSource extends BaseRecord {
  productProfileId: string;
  workspaceId?: string;
  providerType: 'CI_UPLOAD' | 'GITHUB' | 'GITLAB' | 'RUNTIME_URL' | 'EXTERNAL_TOOL';
  displayName: string;
  externalReference?: string;
  externalInstallationId?: string;
  externalRepositoryFullName?: string;
  defaultBranch?: string;
  authorizationStatus: 'PENDING' | 'AUTHORIZED' | 'REVOKED' | 'FAILED';
  scopeNote?: string;
  createdByEmail: string;
}

export interface ToolRun extends BaseRecord {
  scanRunId: string;
  toolName: string;
  toolKey?: string;
  toolVersion?: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED' | 'SKIPPED';
  startedAt?: string;
  completedAt?: string;
  rawArtifactRef?: string;
  storageKey?: string;
  normalizedCount: number;
  errorSummary?: string;
  exitCode?: number;
  durationMs?: number;
  logExcerpt?: string;
}

export interface ScanRun extends BaseRecord {
  scanSourceId: string;
  productProfileId: string;
  workspaceId?: string;
  triggerType: 'MANUAL_UPLOAD' | 'CI_UPLOAD' | 'SCHEDULED' | 'HOSTED_SCAN' | 'EXTERNAL_IMPORT';
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
  depth:
    | 'CI_EVIDENCE'
    | 'SAFE_STATIC'
    | 'DEPENDENCY_CONTAINER'
    | 'RUNTIME_BASELINE'
    | 'DEEP_REVIEW';
  startedAt?: string;
  completedAt?: string;
  requestedByEmail: string;
  failureSummary?: string;
  cancelRequested: boolean;
  scanPlan?: string;
  branchRef?: string;
  runtimeTargetUrl?: string;
  containerImageRef?: string;
  comparisonBaseRunId?: string;
  toolRuns: ToolRun[];
}

export type ExternalImportProvider =
  | 'GITHUB_CODE_SCANNING'
  | 'GITHUB_DEPENDABOT'
  | 'GITHUB_SECRET_SCANNING'
  | 'GITLAB_SECURITY'
  | 'SNYK'
  | 'SONARQUBE'
  | 'SONARCLOUD'
  | 'SEMGREP_PLATFORM'
  | 'SARIF'
  | 'GENERIC_JSON';

export interface ScannerImportRun extends BaseRecord {
  productProfileId: string;
  workspaceId?: string;
  scanSourceId: string;
  scanRunId?: string;
  provider: ExternalImportProvider;
  importMethod: 'MANUAL_API_IMPORT' | 'CI_TEMPLATE' | 'WEBHOOK' | 'CONNECTOR_SYNC';
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  externalReference?: string;
  sourceRecordedAt?: string;
  startedAt?: string;
  completedAt?: string;
  importedCount: number;
  skippedCount: number;
  artifactRef?: string;
  storageKey?: string;
  errorSummary?: string;
  requestedByEmail: string;
  scanRun?: ScanRun;
}

export interface CiTemplateResponse {
  type: 'GITHUB_ACTIONS' | 'GITLAB_CI' | 'GENERIC_CURL';
  productId: string;
  workspaceId?: string;
  sourceId?: string;
  tokenEnvironmentVariable: string;
  apiBaseUrlExpression: string;
  template: string;
}

export interface NormalizedFinding extends BaseRecord {
  productProfileId: string;
  workspaceId?: string;
  scanRunId: string;
  toolRunId: string;
  fingerprint: string;
  sourceTool: string;
  sourceRuleId?: string;
  title: string;
  description: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status:
    | 'NEW'
    | 'OPEN'
    | 'RESOLVED'
    | 'REGRESSED'
    | 'ACCEPTED_RISK'
    | 'FALSE_POSITIVE'
    | 'INSUFFICIENT_EVIDENCE';
  affectedComponent?: string;
  evidenceItemId?: string;
  recommendedModule?: ServiceModule;
  confidenceBasis?: string;
  riskAcceptanceReason?: string;
  riskReviewDueOn?: string;
  reviewedByEmail?: string;
  reviewedAt?: string;
}

export interface ScannerEvidenceItem extends BaseRecord {
  productProfileId: string;
  workspaceId?: string;
  milestoneId?: string;
  findingId?: string;
  scanRunId?: string;
  toolRunId?: string;
  evidenceType:
    | 'SCAN_RESULT'
    | 'CI_RUN'
    | 'PULL_REQUEST'
    | 'COMMIT'
    | 'DEPLOYMENT_LOG'
    | 'SCREENSHOT'
    | 'URL_CHECK'
    | 'RUNBOOK'
    | 'MANUAL_NOTE';
  source: string;
  title: string;
  summary?: string;
  artifactRef?: string;
  storageKey?: string;
  redactionStatus: 'NONE' | 'REDACTED' | 'SENSITIVE_HIDDEN';
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  createdByEmail: string;
}

export interface ScannerSchedule extends BaseRecord {
  productProfileId: string;
  workspaceId?: string;
  scanSourceId: string;
  depth: ScanRun['depth'];
  toolKeys: string[];
  branchRef?: string;
  runtimeTargetUrl?: string;
  containerImageRef?: string;
  intervalDays: number;
  nextRunAt: string;
  lastRunAt?: string;
  lastScanRunId?: string;
  active: boolean;
  reason?: string;
  createdByEmail: string;
}

export interface ConnectorPermission {
  providerType: ScanSource['providerType'];
  label: string;
  purpose: string;
  permissions: string[];
  operatingNote: string;
  appConnectorPreferred: boolean;
}

export interface ScannerSummaryCounts {
  total: number;
  open: number;
  resolved: number;
  acceptedRisk: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface ProductScannerSummary {
  product: ProductProfile;
  readinessScore: number;
  counts: ScannerSummaryCounts;
  sources: ScanSource[];
  recentRuns: ScanRun[];
  findings: NormalizedFinding[];
  evidence: ScannerEvidenceItem[];
  imports: ScannerImportRun[];
  schedules: ScannerSchedule[];
}

export interface ScannerToolHealth {
  key: string;
  displayName: string;
  enabled: boolean;
  executable?: string;
  executableAvailable: boolean;
  targetType: string;
  requiresIac: boolean;
  timeoutSeconds: number;
}

export interface ScannerJobHealth extends BaseRecord {
  scanRunId?: string;
  productProfileId?: string;
  workspaceId?: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
  attemptCount: number;
  maxAttempts: number;
  nextRunAt?: string;
  lockedAt?: string;
  lockOwner?: string;
  startedAt?: string;
  completedAt?: string;
  failureSummary?: string;
  scanRun?: ScanRun;
}

export interface ScannerAdminHealth {
  workerEnabled: boolean;
  schedulerEnabled: boolean;
  queuedJobs: number;
  runningJobs: number;
  tools: ScannerToolHealth[];
  recentJobs: ScannerJobHealth[];
  recentImports: ScannerImportRun[];
}

export interface ScannerConnectorInstallation extends BaseRecord {
  providerType: ScanSource['providerType'];
  externalInstallationId: string;
  accountLogin?: string;
  accountType?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DISCONNECTED' | 'FAILED';
  connectedAt?: string;
  disconnectedAt?: string;
  lastWebhookAt?: string;
  lastWebhookEvent?: string;
  lastError?: string;
}

export interface ConnectorInstallUrlResponse {
  providerType: ScanSource['providerType'];
  providerEnabled: boolean;
  url: string;
  state: string;
  callbackUrl?: string;
  note: string;
}

export interface SignedArtifactResponse {
  entityId: string;
  entityType: string;
  storageKey: string;
  signedUrl: string;
  expiresInSeconds: number;
}

export interface EvidenceExportBundle extends BaseRecord {
  productProfileId: string;
  workspaceId?: string;
  status: 'REQUESTED' | 'COMPLETED' | 'FAILED';
  artifactRef?: string;
  storageKey?: string;
  signedUrl?: string;
  signedUrlExpiresInSeconds: number;
  findingCount: number;
  evidenceCount: number;
  toolRunCount: number;
  completedAt?: string;
  failureSummary?: string;
  requestedByEmail: string;
}

export interface RetentionCandidate {
  sourceType: string;
  sourceId?: string;
  storageKey: string;
}

export interface ScannerRetentionRun {
  dryRun: boolean;
  candidateCount: number;
  candidates: RetentionCandidate[];
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
  manager?: CurrentUserSummary;
  name: string;
  description?: string;
  headline?: string;
  bio?: string;
  profilePhotoUrl?: string;
  coverPhotoUrl?: string;
  websiteUrl?: string;
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

export interface ExpertProfile extends BaseRecord {
  user?: CurrentUserSummary;
  displayName: string;
  headline?: string;
  bio?: string;
  profilePhotoUrl?: string;
  coverPhotoUrl?: string;
  location?: string;
  timezone?: string;
  websiteUrl?: string;
  portfolioUrl?: string;
  skills?: string;
  preferredProjectSize?: string;
  availability: 'AVAILABLE' | 'LIMITED' | 'BUSY' | 'OFFLINE';
  soloMode: boolean;
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

export interface TeamInvitation extends BaseRecord {
  team?: Team;
  invitedBy?: CurrentUserSummary;
  email: string;
  role: TeamMember['role'];
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
}

export interface TeamJoinRequest extends BaseRecord {
  team?: Team;
  requester?: CurrentUserSummary;
  message?: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELLED';
  reviewedBy?: CurrentUserSummary;
  reviewNote?: string;
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

export interface ProductizationCartServiceItem extends BaseRecord {
  serviceModule: ServiceModule;
  sequenceOrder: number;
  notes?: string;
}

export interface ProductizationCartTalentItem extends BaseRecord {
  itemType: 'TEAM' | 'EXPERT';
  team?: Team;
  expertProfile?: ExpertProfile;
  notes?: string;
}

export interface ProductizationCart extends BaseRecord {
  owner?: CurrentUserSummary;
  productProfile?: ProductProfile;
  title: string;
  businessGoal?: string;
  status: 'DRAFT' | 'CONVERTED' | 'ARCHIVED';
  serviceItems: ProductizationCartServiceItem[];
  talentItems: ProductizationCartTalentItem[];
  convertedPackage?: PackageInstance;
  convertedWorkspace?: ProjectWorkspace;
  catalogEvaluation?: CatalogRuleEvaluation;
}

export interface ProductizationCartConvertResponse {
  cart: ProductizationCart;
  packageInstance: PackageInstance;
  workspace: ProjectWorkspace;
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
  eventType:
    | 'MILESTONE_ACCEPTED'
    | 'DELIVERABLE_REVIEW'
    | 'CONTRACT_COMPLETED'
    | 'SUPPORT_REVIEW'
    | 'WORKSPACE_REVIEW'
    | 'DISPUTE';
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
  status:
    | 'OPEN'
    | 'UNDER_REVIEW'
    | 'OWNER_RESPONSE_NEEDED'
    | 'TEAM_RESPONSE_NEEDED'
    | 'RESOLVED'
    | 'CANCELLED';
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
    | 'NETWORK_FORMATION_POST'
    | 'NETWORK_CHANNEL_POST'
    | 'NETWORK_CHANNEL_REPLY'
    | 'NETWORK_MESSAGE'
    | 'NETWORK_JOIN_REQUEST'
    | 'NETWORK_TEAM_INVITATION'
    | 'NETWORK_TRIAL'
    | 'NETWORK_PROFILE_UPDATED'
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
  providerName?: string;
  providerRequestId?: string;
  fallback?: boolean;
  fallbackReason?: string;
  confidence?: number;
  rationale?: string;
  outputJson?: string;
  humanFeedback?: string;
}

export interface LoomAIStatus {
  enabled: boolean;
  configured: boolean;
  environment: string;
  integrationMode?: string;
  authMode?: string;
  privateRuntimeMode?: boolean;
  privateRuntimeAuthConfigured?: boolean;
  assistantSessionConfigured: boolean;
  assistantQueryConfigured: boolean;
  assistantSuggestionsConfigured: boolean;
  authContextConfigured?: boolean;
  knowledgeSyncConfigured: boolean;
  allowedActions: string[];
  activeReadActions?: string[];
  confirmedActionCandidates?: string[];
}

export interface LoomAIKnowledgeSync {
  status: 'SYNCED' | 'SKIPPED' | 'FAILED';
  recordCount: number;
  providerRequestId?: string;
  totalOperations?: number;
  succeededOperations?: number;
  failedOperations?: number;
  errors?: Array<Record<string, unknown>>;
  fallbackReason?: string;
}

export interface AssistantContext {
  pageType: string;
  productId?: string | undefined;
  packageId?: string | undefined;
  workspaceId?: string | undefined;
  milestoneId?: string | undefined;
  findingId?: string | undefined;
  pageContext?: Record<string, unknown> | undefined;
}

export interface AssistantSuggestionsResponse {
  provider: string;
  mode: string;
  success?: boolean;
  suggestions: string[];
  fallbackReason?: string;
  providerRequestId?: string;
}

export interface AssistantQueryResponse {
  provider: string;
  mode: string;
  success: boolean;
  type?: string;
  answer?: string;
  safeSummary?: string;
  conversationId?: string;
  confidence?: number;
  sources?: Array<Record<string, unknown>>;
  documents?: Array<Record<string, unknown>>;
  attachments?: Array<Record<string, unknown>>;
  actions?: Array<Record<string, unknown>>;
  suggestions?: string[];
  ragResponse?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  documentUsage?: Array<Record<string, unknown>>;
  fallbackReason?: string;
  errorCode?: string;
  reason?: string;
  retryable?: boolean;
  providerRequestId?: string;
}

export interface AdminReadinessGate {
  key: string;
  area: string;
  status: 'PASS' | 'WARN' | 'BLOCKED';
  title: string;
  detail: string;
  remediation: string;
}

export interface AdminReadiness {
  overallStatus: 'PASS' | 'WARN' | 'BLOCKED';
  generatedAt: string;
  gates: AdminReadinessGate[];
}

export interface ProductFinding extends BaseRecord {
  title: string;
  description: string;
  affectedLayer?: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceBasis?: string;
  sourceSignal?: string;
  status: 'OPEN' | 'SERVICE_SELECTED' | 'ACCEPTED_RISK' | 'RESOLVED' | 'DISMISSED';
  recommendedModuleId?: string;
  recommendedModuleName?: string;
  recommendedModuleCode?: string;
}

export interface ProductDiagnosis extends BaseRecord {
  productId: string;
  productName: string;
  readinessScore: number;
  summary: string;
  accessSignals?: string;
  status: 'DRAFT' | 'READY' | 'FINDINGS_REVIEWED' | 'SERVICE_PLAN_CREATED' | 'ARCHIVED';
  aiReady: boolean;
  aiExecuted: boolean;
  findings: ProductFinding[];
}

export interface EvidenceRequirement extends BaseRecord {
  criterionId: string;
  evidenceType: string;
  description?: string;
  required: boolean;
  status: 'MISSING' | 'ATTACHED' | 'VERIFIED' | 'WAIVED';
  evidenceReference?: string;
}

export interface AutomatedCheck extends BaseRecord {
  workspaceId: string;
  milestoneId?: string;
  criterionId?: string;
  checkType: string;
  provider: string;
  externalRef?: string;
  status: 'PENDING' | 'PASSED' | 'WARNING' | 'FAILED';
  summary?: string;
  rawPayload?: string;
  observedAt?: string;
}

export interface ReviewDecision extends BaseRecord {
  milestoneId: string;
  criterionId?: string;
  reviewerEmail: string;
  decision: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' | 'COMMENT';
  note?: string;
}

export interface AcceptanceCriterion extends BaseRecord {
  milestoneId: string;
  packageModuleId?: string;
  serviceName?: string;
  title: string;
  description?: string;
  required: boolean;
  status: 'PENDING' | 'IN_REVIEW' | 'PASSED' | 'FAILED' | 'WAIVED';
  humanReviewRequired: boolean;
  evidenceRequirements: EvidenceRequirement[];
  automatedChecks: AutomatedCheck[];
  reviews: ReviewDecision[];
}

export interface HandoffDocument extends BaseRecord {
  workspaceId: string;
  title: string;
  runbook?: string;
  accessChecklist?: string;
  knownIssues?: string;
  supportScope?: string;
  status: 'DRAFT' | 'READY_FOR_OWNER' | 'ACCEPTED' | 'ARCHIVED';
}

export interface ProductHealthReview extends BaseRecord {
  workspaceId: string;
  periodStart?: string;
  periodEnd?: string;
  healthScore: number;
  summary: string;
  risks?: string;
  actions?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface IntegrationSignal extends BaseRecord {
  connectionId: string;
  workspaceId?: string;
  milestoneId?: string;
  criterionId?: string;
  signalType: string;
  status: 'INFO' | 'PASSED' | 'WARNING' | 'FAILED';
  summary?: string;
  evidencePayload?: string;
  recordedAt?: string;
}

export interface IntegrationConnection extends BaseRecord {
  workspaceId?: string;
  providerType:
    | 'GITHUB'
    | 'CI_CD'
    | 'DEPENDENCY_SCAN'
    | 'SECRETS_SCAN'
    | 'DEPLOYMENT'
    | 'MONITORING'
    | 'DATABASE'
    | 'ISSUE_TRACKER'
    | 'SUPPORT_TOOL'
    | 'OTHER';
  name: string;
  externalRef?: string;
  scopedAccessNote?: string;
  status: 'CONFIGURED' | 'ACTIVE' | 'NEEDS_ATTENTION' | 'DISCONNECTED';
  lastCheckedAt?: string;
  signals: IntegrationSignal[];
}

export interface WorkspaceGovernance {
  workspaceId: string;
  workspaceName: string;
  criteria: AcceptanceCriterion[];
  automatedChecks: AutomatedCheck[];
  handoffs: HandoffDocument[];
  healthReviews: ProductHealthReview[];
  integrations: IntegrationConnection[];
}

export interface AuditEvent extends BaseRecord {
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details?: string;
}
