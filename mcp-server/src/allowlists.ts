export type McpToolProfile = 'all' | 'loomai-productization';

export interface LoomAIToolDescriptor {
  name: string;
  category: 'catalog' | 'product' | 'package' | 'workspace' | 'scanner' | 'evidence' | 'milestone';
  mode: 'read' | 'mutation';
  confirmationRequired: boolean;
  roles: string[];
  targetEntityType: string;
  inclusionReason: string;
  excludedRelatedTools?: string[];
}

export const loomAIProductizationTools: LoomAIToolDescriptor[] = [
  {
    name: 'produs.catalog.search',
    category: 'catalog',
    mode: 'read',
    confirmationRequired: false,
    roles: ['OWNER', 'TEAM_MEMBER', 'ADMIN'],
    targetEntityType: 'SERVICE_CATALOG',
    inclusionReason: 'Catalog search is safe shared knowledge for service planning.'
  },
  {
    name: 'produs.product.list',
    category: 'product',
    mode: 'read',
    confirmationRequired: false,
    roles: ['OWNER', 'ADMIN'],
    targetEntityType: 'PRODUCT_PROFILE',
    inclusionReason: 'Product listing scopes assistant context to authorized owner/admin products.'
  },
  {
    name: 'produs.package.inspect',
    category: 'package',
    mode: 'read',
    confirmationRequired: false,
    roles: ['OWNER', 'ADMIN'],
    targetEntityType: 'PACKAGE_INSTANCE',
    inclusionReason: 'Package inspection is required for package governance and team-fit explanations.'
  },
  {
    name: 'produs.workspace.inspect',
    category: 'workspace',
    mode: 'read',
    confirmationRequired: false,
    roles: ['OWNER', 'TEAM_MEMBER', 'ADMIN'],
    targetEntityType: 'PROJECT_WORKSPACE',
    inclusionReason: 'Workspace inspection supports milestone, evidence, blocker, and handoff guidance.'
  },
  {
    name: 'produs.requirement.submit',
    category: 'product',
    mode: 'mutation',
    confirmationRequired: true,
    roles: ['OWNER', 'ADMIN'],
    targetEntityType: 'REQUIREMENT_INTAKE',
    inclusionReason: 'Owners may ask AI to draft a requirement, but backend validation and confirmation are required.'
  },
  {
    name: 'produs.package.build_from_requirement',
    category: 'package',
    mode: 'mutation',
    confirmationRequired: true,
    roles: ['OWNER', 'ADMIN'],
    targetEntityType: 'PACKAGE_INSTANCE',
    inclusionReason: 'Package creation remains deterministic and auditable after owner confirmation.'
  },
  {
    name: 'produs.team.shortlist',
    category: 'package',
    mode: 'mutation',
    confirmationRequired: true,
    roles: ['OWNER', 'ADMIN'],
    targetEntityType: 'TEAM_SHORTLIST',
    inclusionReason: 'Shortlisting supports package delivery decisions without allowing AI to create or manage teams.',
    excludedRelatedTools: ['produs.team.profile.update', 'produs.team.capability.add']
  },
  {
    name: 'produs.workspace.create',
    category: 'workspace',
    mode: 'mutation',
    confirmationRequired: true,
    roles: ['OWNER', 'ADMIN'],
    targetEntityType: 'PROJECT_WORKSPACE',
    inclusionReason: 'Workspace creation converts a confirmed package into the production delivery surface.'
  },
  {
    name: 'produs.deliverable.update',
    category: 'workspace',
    mode: 'mutation',
    confirmationRequired: true,
    roles: ['OWNER', 'TEAM_MEMBER', 'ADMIN'],
    targetEntityType: 'DELIVERABLE',
    inclusionReason: 'Deliverable evidence updates are core project workflow actions and remain backend-authorized.'
  },
  {
    name: 'produs.scan.start',
    category: 'scanner',
    mode: 'mutation',
    confirmationRequired: true,
    roles: ['OWNER', 'ADMIN'],
    targetEntityType: 'SCAN_RUN',
    inclusionReason: 'AI can propose a scan, but execution requires explicit confirmation and scanner authorization.'
  },
  {
    name: 'produs.scan.status',
    category: 'scanner',
    mode: 'read',
    confirmationRequired: false,
    roles: ['OWNER', 'TEAM_MEMBER', 'ADMIN'],
    targetEntityType: 'SCAN_RUN',
    inclusionReason: 'Scan status is needed to explain evidence freshness and outstanding scanner work.'
  },
  {
    name: 'produs.scan.cancel',
    category: 'scanner',
    mode: 'mutation',
    confirmationRequired: true,
    roles: ['OWNER', 'ADMIN'],
    targetEntityType: 'SCAN_RUN',
    inclusionReason: 'Cancellation is a governed scanner operation requiring explicit human confirmation.'
  },
  {
    name: 'produs.finding.inspect',
    category: 'scanner',
    mode: 'read',
    confirmationRequired: false,
    roles: ['OWNER', 'TEAM_MEMBER', 'ADMIN'],
    targetEntityType: 'NORMALIZED_FINDING',
    inclusionReason: 'Finding inspection powers evidence-grounded scanner explanations.'
  },
  {
    name: 'produs.finding.accept_risk',
    category: 'scanner',
    mode: 'mutation',
    confirmationRequired: true,
    roles: ['OWNER', 'ADMIN'],
    targetEntityType: 'NORMALIZED_FINDING',
    inclusionReason: 'Risk acceptance is allowed only through backend policy with reason and review date.'
  },
  {
    name: 'produs.evidence.list',
    category: 'evidence',
    mode: 'read',
    confirmationRequired: false,
    roles: ['OWNER', 'TEAM_MEMBER', 'ADMIN'],
    targetEntityType: 'SCANNER_EVIDENCE',
    inclusionReason: 'Evidence summaries are safe live context for product/project/scanner assistance.'
  },
  {
    name: 'produs.evidence.upload_ci_result',
    category: 'evidence',
    mode: 'mutation',
    confirmationRequired: true,
    roles: ['OWNER', 'TEAM_MEMBER', 'ADMIN'],
    targetEntityType: 'SCAN_RUN',
    inclusionReason: 'CI evidence upload is a real backend path for customer-owned scanner artifacts.'
  },
  {
    name: 'produs.milestone.review_evidence',
    category: 'milestone',
    mode: 'read',
    confirmationRequired: false,
    roles: ['OWNER', 'TEAM_MEMBER', 'ADMIN'],
    targetEntityType: 'MILESTONE',
    inclusionReason: 'Milestone review can explain evidence support without approving release decisions.'
  }
];

const loomAIProductizationToolNames = new Set(loomAIProductizationTools.map((tool) => tool.name));

export function isToolAllowedForProfile(profile: McpToolProfile, toolName: string): boolean {
  if (profile === 'all') {
    return true;
  }
  return loomAIProductizationToolNames.has(toolName);
}

export function normalizeToolProfile(value: string | undefined): McpToolProfile {
  return value === 'loomai-productization' ? 'loomai-productization' : 'all';
}
