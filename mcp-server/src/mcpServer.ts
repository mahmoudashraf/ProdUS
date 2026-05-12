import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { hashInput } from './hash.js';
import { ProdusApi, ProdusApiError, type ApiResult, type RequestContext } from './produsApi.js';
import type { McpConfig } from './config.js';

type JsonRecord = Record<string, unknown>;
type ToolArgs = JsonRecord & {
  confirm?: boolean;
  reason?: string;
  idempotencyKey?: string;
};

const uuid = () => z.string().uuid();
const optionalUuid = () => z.string().uuid().optional();
const nullableUuid = () => z.string().uuid().nullish();

const confirmationShape = {
  confirm: z.boolean().describe('Must be true for any mutating ProdUS action.'),
  reason: z.string().min(3).describe('Human-readable reason for the action.'),
  idempotencyKey: z.string().min(8).optional().describe('Caller-generated key to make retries safer.')
};

export function createProdusMcpServer(config: McpConfig, context: RequestContext): McpServer {
  const api = new ProdusApi(config, context);
  const server = new McpServer(
    { name: 'produs-mcp-server', version: '0.1.0' },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
        logging: {}
      }
    }
  );

  registerResources(server, api);
  registerPrompts(server);
  registerTools(server, api);

  return server;
}

function registerResources(server: McpServer, api: ProdusApi): void {
  server.registerResource(
    'produs-catalog-categories',
    'produs://catalog/categories',
    {
      title: 'ProdUS service categories',
      description: 'Production service families available for package building.',
      mimeType: 'application/json'
    },
    async (uri) => jsonResource(uri.href, (await api.get('/catalog/categories')).data)
  );

  server.registerResource(
    'produs-catalog-modules',
    'produs://catalog/modules',
    {
      title: 'ProdUS service modules',
      description: 'Production-ready service descriptions, inputs, deliverables, acceptance criteria, timelines, and price ranges.',
      mimeType: 'application/json'
    },
    async (uri) => jsonResource(uri.href, (await api.get('/catalog/modules')).data)
  );

  server.registerResource(
    'produs-product',
    new ResourceTemplate('produs://products/{productId}', {
      list: async () => {
        const products = await api.optionalGet<Array<{ id: string; name: string; summary?: string }>>('/products');
        return {
          resources: (products || []).map((product) => ({
            uri: `produs://products/${product.id}`,
            name: product.name,
            description: product.summary || 'ProdUS product profile',
            mimeType: 'application/json'
          }))
        };
      }
    }),
    {
      title: 'ProdUS product profile',
      description: 'Owner product profile context.',
      mimeType: 'application/json'
    },
    async (uri, variables) => jsonResource(uri.href, (await api.get(`/products/${variables.productId}`)).data)
  );

  server.registerResource(
    'produs-package',
    new ResourceTemplate('produs://packages/{packageId}', {
      list: async () => {
        const packages = await api.optionalGet<Array<{ id: string; name: string; summary?: string }>>('/packages');
        return {
          resources: (packages || []).map((packageInstance) => ({
            uri: `produs://packages/${packageInstance.id}`,
            name: packageInstance.name,
            description: packageInstance.summary || 'ProdUS productization package',
            mimeType: 'application/json'
          }))
        };
      }
    }),
    {
      title: 'ProdUS package',
      description: 'Package summary, service sequence, rationale, team matches, and proposal context.',
      mimeType: 'application/json'
    },
    async (uri, variables) => jsonResource(uri.href, await inspectPackage(api, String(variables.packageId)))
  );

  server.registerResource(
    'produs-package-team-recommendations',
    new ResourceTemplate('produs://packages/{packageId}/team-recommendations', { list: undefined }),
    {
      title: 'ProdUS team recommendations',
      description: 'Matched teams and deterministic recommendation reasons for a package.',
      mimeType: 'application/json'
    },
    async (uri, variables) => jsonResource(uri.href, (await api.get(`/packages/${variables.packageId}/team-recommendations`)).data)
  );

  server.registerResource(
    'produs-workspace',
    new ResourceTemplate('produs://workspaces/{workspaceId}', {
      list: async () => {
        const workspaces = await api.optionalGet<Array<{ id: string; name: string }>>('/workspaces');
        return {
          resources: (workspaces || []).map((workspace) => ({
            uri: `produs://workspaces/${workspace.id}`,
            name: workspace.name,
            description: 'ProdUS delivery workspace',
            mimeType: 'application/json'
          }))
        };
      }
    }),
    {
      title: 'ProdUS workspace',
      description: 'Unified delivery state including milestones, deliverables, participants, support, disputes, and evidence.',
      mimeType: 'application/json'
    },
    async (uri, variables) => jsonResource(uri.href, await inspectWorkspace(api, String(variables.workspaceId)))
  );

  server.registerResource(
    'produs-notifications-summary',
    'produs://notifications/summary',
    {
      title: 'ProdUS notification summary',
      description: 'Current user action queue and latest notifications.',
      mimeType: 'application/json'
    },
    async (uri) => jsonResource(uri.href, (await api.get('/notifications/summary')).data)
  );

  server.registerResource(
    'produs-admin-operations',
    'produs://admin/operations',
    {
      title: 'ProdUS admin operations',
      description: 'Admin-only platform health and notification delivery configuration.',
      mimeType: 'application/json'
    },
    async (uri) => jsonResource(uri.href, await inspectAdminOperations(api))
  );
}

function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    'owner_productization_brief',
    {
      title: 'Owner productization brief',
      description: 'Prepare a productization diagnosis and next action for an owner.',
      argsSchema: {
        productId: z.string().optional(),
        productContext: z.string().optional()
      }
    },
    async ({ productId, productContext }) => promptResult(`Use ProdUS resources to produce a concise owner productization brief.

Product ID: ${productId || 'not provided'}
Context: ${productContext || 'Use available product/package resources.'}

Return: diagnosis, recommended lifecycle services, risks, evidence needed, and next safe backend action.`)
  );

  server.registerPrompt(
    'package_builder_review',
    {
      title: 'Package builder review',
      description: 'Review package composition, dependencies, milestones, and acceptance criteria.',
      argsSchema: {
        packageId: z.string()
      }
    },
    async ({ packageId }) => promptResult(`Review ProdUS package ${packageId}. Focus on missing service dependencies, sequencing risk, deliverables, acceptance criteria, and owner-facing next steps.`)
  );

  server.registerPrompt(
    'team_match_explainer',
    {
      title: 'Team match explainer',
      description: 'Explain package-team fit and comparison tradeoffs.',
      argsSchema: {
        packageId: z.string()
      }
    },
    async ({ packageId }) => promptResult(`Explain the team recommendations for package ${packageId}. Compare capability evidence, reputation, timeline, budget fit, and shortlist risks.`)
  );

  server.registerPrompt(
    'workspace_risk_review',
    {
      title: 'Workspace risk review',
      description: 'Summarize delivery blockers, support risk, and missing evidence.',
      argsSchema: {
        workspaceId: z.string()
      }
    },
    async ({ workspaceId }) => promptResult(`Review workspace ${workspaceId}. Return blocked milestones, missing evidence, support requests, dispute risk, and next actions by owner/team/admin.`)
  );

  server.registerPrompt(
    'support_response_draft',
    {
      title: 'Support response draft',
      description: 'Draft a support response and resolution checklist.',
      argsSchema: {
        supportRequestId: z.string()
      }
    },
    async ({ supportRequestId }) => promptResult(`Draft a professional response for support request ${supportRequestId}. Include owner/team handoff notes, resolution checklist, and evidence required before closure.`)
  );

  server.registerPrompt(
    'admin_platform_review',
    {
      title: 'Admin platform review',
      description: 'Review catalog, SLA, notifications, and security follow-ups.',
      argsSchema: {
        scope: z.string().optional()
      }
    },
    async ({ scope }) => promptResult(`Review ProdUS admin operations${scope ? ` for ${scope}` : ''}. Cover catalog hygiene, SLA escalation risk, notification delivery health, and production security/configuration follow-ups.`)
  );
}

function registerTools(server: McpServer, api: ProdusApi): void {
  server.registerTool(
    'produs.catalog.search',
    {
      title: 'Search ProdUS catalog',
      description: 'Read-only. Search service categories/modules and optionally include dependency edges. Roles: all authenticated users.',
      inputSchema: {
        query: z.string().optional(),
        categoryId: optionalUuid(),
        includeDependencies: z.boolean().default(false)
      },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
    },
    async (args) => readTool('produs.catalog.search', async () => {
      const modulesPath = args.categoryId ? `/catalog/modules?categoryId=${args.categoryId}` : '/catalog/modules';
      const [categories, modules, dependencies] = await Promise.all([
        api.get('/catalog/categories'),
        api.get(modulesPath),
        args.includeDependencies ? api.get('/catalog/dependencies') : Promise.resolve({ status: 200, data: [] })
      ]);
      return filterCatalog(args.query, categories.data, modules.data, dependencies.data);
    })
  );

  server.registerTool(
    'produs.product.list',
    {
      title: 'List ProdUS products',
      description: 'Read-only. Owner sees own product profiles; admin sees all. Roles: owner, admin.',
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
    },
    async () => readTool('produs.product.list', async () => (await api.get('/products')).data)
  );

  server.registerTool(
    'produs.package.inspect',
    {
      title: 'Inspect ProdUS package',
      description: 'Read-only. Inspect package modules, team recommendations, proposals when authorized, and shortlist state. Roles: package owner, admin.',
      inputSchema: {
        packageId: uuid()
      },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
    },
    async ({ packageId }) => readTool('produs.package.inspect', async () => inspectPackage(api, packageId))
  );

  server.registerTool(
    'produs.workspace.inspect',
    {
      title: 'Inspect ProdUS workspace',
      description: 'Read-only. Inspect workspace milestones, deliverables, participants, support requests, disputes, and evidence. Roles: workspace participants, owner, assigned team, admin.',
      inputSchema: {
        workspaceId: uuid()
      },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
    },
    async ({ workspaceId }) => readTool('produs.workspace.inspect', async () => inspectWorkspace(api, workspaceId))
  );

  server.registerTool(
    'produs.notifications.list',
    {
      title: 'List ProdUS notifications',
      description: 'Read-only. List current user notifications and summary. Roles: all authenticated users.',
      inputSchema: {
        status: z.enum(['UNREAD', 'READ', 'ARCHIVED']).optional(),
        includeSummary: z.boolean().default(true)
      },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
    },
    async (args) => readTool('produs.notifications.list', async () => {
      const query = args.status ? `?status=${args.status}` : '';
      const [notifications, summary] = await Promise.all([
        api.get(`/notifications${query}`),
        args.includeSummary ? api.get('/notifications/summary') : Promise.resolve({ status: 200, data: null })
      ]);
      return { notifications: notifications.data, summary: summary.data };
    })
  );

  server.registerTool(
    'produs.product.create',
    {
      title: 'Create ProdUS product',
      description: 'Mutating. Create an owner product profile. Roles: owner, admin.',
      inputSchema: {
        ...confirmationShape,
        name: z.string().min(1),
        summary: z.string().optional(),
        businessStage: z.enum(['IDEA', 'PROTOTYPE', 'VALIDATED', 'LIVE', 'SCALING']).optional(),
        techStack: z.string().optional(),
        productUrl: z.string().optional(),
        repositoryUrl: z.string().optional(),
        riskProfile: z.string().optional()
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async (args) => mutationTool(api, 'produs.product.create', args, { targetType: 'PRODUCT_PROFILE' }, (idempotencyKey) =>
      api.post('/products', omitControl(args), idempotencyKey)
    )
  );

  server.registerTool(
    'produs.requirement.submit',
    {
      title: 'Submit ProdUS requirement',
      description: 'Mutating. Submit productization intake for a product. Roles: owner, admin.',
      inputSchema: {
        ...confirmationShape,
        productProfileId: uuid(),
        requestedServiceModuleId: nullableUuid(),
        businessGoal: z.string().min(1),
        currentProblems: z.string().optional(),
        constraints: z.string().optional(),
        riskSignals: z.string().optional(),
        requirementBrief: z.string().optional(),
        status: z.enum(['DRAFT', 'SUBMITTED', 'PACKAGE_RECOMMENDED', 'CLOSED']).default('SUBMITTED')
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async (args) => mutationTool(api, 'produs.requirement.submit', args, { targetType: 'PRODUCT_PROFILE', targetId: args.productProfileId }, (idempotencyKey) =>
      api.post('/requirements', omitControl(args), idempotencyKey)
    )
  );

  server.registerTool(
    'produs.package.build_from_requirement',
    {
      title: 'Build ProdUS package from requirement',
      description: 'Mutating. Build deterministic package and recommendation audit from a submitted requirement. Roles: owner, admin.',
      inputSchema: {
        ...confirmationShape,
        requirementId: uuid()
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async (args) => mutationTool(api, 'produs.package.build_from_requirement', args, { targetType: 'REQUIREMENT_INTAKE', targetId: args.requirementId }, (idempotencyKey) =>
      api.post(`/packages/from-requirement/${args.requirementId}`, undefined, idempotencyKey)
    )
  );

  server.registerTool(
    'produs.team.shortlist',
    {
      title: 'Shortlist or compare team',
      description: 'Mutating. Persist team shortlist/compare state for a package. Roles: package owner, admin.',
      inputSchema: {
        ...confirmationShape,
        packageInstanceId: uuid(),
        teamId: uuid(),
        status: z.enum(['ACTIVE', 'COMPARED', 'REQUESTED_PROPOSAL', 'ARCHIVED']).default('ACTIVE'),
        notes: z.string().optional()
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async (args) => mutationTool(api, 'produs.team.shortlist', args, { targetType: 'PACKAGE_INSTANCE', targetId: args.packageInstanceId }, (idempotencyKey) =>
      api.post('/shortlists', omitControl(args), idempotencyKey)
    )
  );

  server.registerTool(
    'produs.proposal.accept',
    {
      title: 'Accept ProdUS proposal',
      description: 'Mutating. Owner accepts a team proposal. Roles: package owner, admin.',
      inputSchema: {
        ...confirmationShape,
        proposalId: uuid()
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async (args) => mutationTool(api, 'produs.proposal.accept', args, { targetType: 'QUOTE_PROPOSAL', targetId: args.proposalId }, (idempotencyKey) =>
      api.put(`/commerce/proposals/${args.proposalId}/status`, { status: 'OWNER_ACCEPTED' }, idempotencyKey)
    )
  );

  server.registerTool(
    'produs.workspace.create',
    {
      title: 'Create ProdUS workspace',
      description: 'Mutating. Open a delivery workspace from a package. Roles: package owner, admin.',
      inputSchema: {
        ...confirmationShape,
        packageInstanceId: uuid(),
        name: z.string().optional(),
        status: z.enum(['DRAFT_PACKAGE', 'AWAITING_TEAM_PROPOSAL', 'SCOPE_NEGOTIATION', 'ACTIVE_DELIVERY', 'BLOCKED', 'MILESTONE_REVIEW', 'DELIVERED', 'SUPPORT_HANDOFF', 'CLOSED']).optional()
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async (args) => mutationTool(api, 'produs.workspace.create', args, { targetType: 'PACKAGE_INSTANCE', targetId: args.packageInstanceId }, (idempotencyKey) =>
      api.post('/workspaces', omitControl(args), idempotencyKey)
    )
  );

  server.registerTool(
    'produs.support_request.create',
    {
      title: 'Create ProdUS support request',
      description: 'Mutating. Create a support request in a workspace. Roles: workspace support participants, owner, team, admin.',
      inputSchema: {
        ...confirmationShape,
        workspaceId: uuid(),
        supportSubscriptionId: nullableUuid(),
        teamId: nullableUuid(),
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
        status: z.enum(['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'WAITING_ON_OWNER', 'RESOLVED', 'CANCELLED']).optional(),
        dueOn: z.string().optional()
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async (args) => mutationTool(api, 'produs.support_request.create', args, { targetType: 'PROJECT_WORKSPACE', targetId: args.workspaceId }, (idempotencyKey) =>
      api.post(`/commerce/workspaces/${args.workspaceId}/support-requests`, omitControlAnd(args, ['workspaceId']), idempotencyKey)
    )
  );

  server.registerTool(
    'produs.team.profile.update',
    {
      title: 'Update ProdUS team profile',
      description: 'Mutating. Update team profile details. Roles: team manager, admin.',
      inputSchema: {
        ...confirmationShape,
        teamId: uuid(),
        name: z.string().min(1),
        description: z.string().optional(),
        timezone: z.string().optional(),
        capabilitiesSummary: z.string().optional(),
        typicalProjectSize: z.string().optional(),
        verificationStatus: z.enum(['APPLIED', 'VERIFIED', 'CERTIFIED', 'SPECIALIST', 'OPERATIONS_READY', 'SUSPENDED']).optional(),
        active: z.boolean().optional()
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async (args) => mutationTool(api, 'produs.team.profile.update', args, { targetType: 'TEAM', targetId: args.teamId }, (idempotencyKey) =>
      api.put(`/teams/${args.teamId}`, omitControlAnd(args, ['teamId']), idempotencyKey)
    )
  );

  server.registerTool(
    'produs.team.capability.add',
    {
      title: 'Add ProdUS team capability',
      description: 'Mutating. Add capability evidence to a team. Roles: team manager, admin.',
      inputSchema: {
        ...confirmationShape,
        teamId: uuid(),
        serviceCategoryId: uuid(),
        serviceModuleId: nullableUuid(),
        evidenceUrl: z.string().optional(),
        notes: z.string().optional()
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async (args) => mutationTool(api, 'produs.team.capability.add', args, { targetType: 'TEAM', targetId: args.teamId }, (idempotencyKey) =>
      api.post(`/teams/${args.teamId}/capabilities`, omitControlAnd(args, ['teamId']), idempotencyKey)
    )
  );

  server.registerTool(
    'produs.proposal.submit',
    {
      title: 'Submit ProdUS proposal',
      description: 'Mutating. Submit a team proposal against a package. Roles: team manager, admin.',
      inputSchema: {
        ...confirmationShape,
        packageId: uuid(),
        teamId: uuid(),
        title: z.string().min(1),
        scope: z.string().optional(),
        assumptions: z.string().optional(),
        timelineDays: z.number().int().positive().optional(),
        currency: z.string().default('USD'),
        fixedPriceCents: z.number().int().min(0).optional(),
        platformFeeCents: z.number().int().min(0).optional(),
        status: z.enum(['DRAFT', 'SUBMITTED', 'WITHDRAWN']).default('SUBMITTED')
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async (args) => mutationTool(api, 'produs.proposal.submit', args, { targetType: 'PACKAGE_INSTANCE', targetId: args.packageId }, (idempotencyKey) =>
      api.post(`/commerce/packages/${args.packageId}/proposals`, omitControlAnd(args, ['packageId']), idempotencyKey)
    )
  );

  server.registerTool(
    'produs.deliverable.update',
    {
      title: 'Update ProdUS deliverable',
      description: 'Mutating. Update deliverable status and evidence. Roles: workspace contributor/coordinator/admin.',
      inputSchema: {
        ...confirmationShape,
        deliverableId: uuid(),
        title: z.string().min(1),
        evidence: z.string().optional(),
        status: z.enum(['PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED']).optional()
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async (args) => mutationTool(api, 'produs.deliverable.update', args, { targetType: 'DELIVERABLE', targetId: args.deliverableId }, (idempotencyKey) =>
      api.put(`/workspaces/deliverables/${args.deliverableId}`, omitControlAnd(args, ['deliverableId']), idempotencyKey)
    )
  );

  server.registerTool(
    'produs.support_request.update_status',
    {
      title: 'Update support request status',
      description: 'Mutating. Update support request lifecycle state and resolution. Roles: support participant, admin.',
      inputSchema: {
        ...confirmationShape,
        supportRequestId: uuid(),
        status: z.enum(['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'WAITING_ON_OWNER', 'RESOLVED', 'CANCELLED']),
        resolution: z.string().optional()
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async (args) => mutationTool(api, 'produs.support_request.update_status', args, { targetType: 'SUPPORT_REQUEST', targetId: args.supportRequestId }, (idempotencyKey) =>
      api.put(`/commerce/support-requests/${args.supportRequestId}/status`, omitControlAnd(args, ['supportRequestId']), idempotencyKey)
    )
  );

  server.registerTool(
    'produs.dispute.update_status',
    {
      title: 'Update dispute status',
      description: 'Mutating. Update workspace dispute status and resolution. Roles: owner, assigned team manager, admin.',
      inputSchema: {
        ...confirmationShape,
        disputeId: uuid(),
        status: z.enum(['OPEN', 'UNDER_REVIEW', 'OWNER_RESPONSE_NEEDED', 'TEAM_RESPONSE_NEEDED', 'RESOLVED', 'CANCELLED']),
        resolution: z.string().optional()
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async (args) => mutationTool(api, 'produs.dispute.update_status', args, { targetType: 'DISPUTE_CASE', targetId: args.disputeId }, (idempotencyKey) =>
      api.put(`/commerce/disputes/${args.disputeId}/status`, omitControlAnd(args, ['disputeId']), idempotencyKey)
    )
  );

  server.registerTool(
    'produs.admin.catalog.create_category',
    {
      title: 'Create catalog category',
      description: 'Mutating admin operation. Create a service catalog category. Roles: admin.',
      inputSchema: {
        ...confirmationShape,
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        sortOrder: z.number().int().optional(),
        active: z.boolean().default(true)
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async (args) => mutationTool(api, 'produs.admin.catalog.create_category', args, { targetType: 'SERVICE_CATEGORY' }, (idempotencyKey) =>
      api.post('/admin/catalog/categories', omitControl(args), idempotencyKey)
    )
  );

  server.registerTool(
    'produs.admin.catalog.create_module',
    {
      title: 'Create catalog module',
      description: 'Mutating admin operation. Create a production service module. Roles: admin.',
      inputSchema: {
        ...confirmationShape,
        categoryId: uuid(),
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        requiredInputs: z.string().optional(),
        expectedDeliverables: z.string().optional(),
        acceptanceCriteria: z.string().optional(),
        timelineRange: z.string().optional(),
        priceRange: z.string().optional(),
        sortOrder: z.number().int().optional(),
        active: z.boolean().default(true)
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async (args) => mutationTool(api, 'produs.admin.catalog.create_module', args, { targetType: 'SERVICE_MODULE' }, (idempotencyKey) =>
      api.post('/admin/catalog/modules', omitControl(args), idempotencyKey)
    )
  );

  server.registerTool(
    'produs.admin.sla.run_scan',
    {
      title: 'Run support SLA scan',
      description: 'Mutating admin operation. Runs support SLA scan and may escalate requests/notifications. Roles: admin.',
      inputSchema: {
        ...confirmationShape
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async (args) => mutationTool(api, 'produs.admin.sla.run_scan', args, { targetType: 'SUPPORT_SLA' }, (idempotencyKey) =>
      api.post('/commerce/support-requests/sla/run', undefined, idempotencyKey)
    )
  );

  server.registerTool(
    'produs.admin.notifications.dispatch',
    {
      title: 'Dispatch notification deliveries',
      description: 'Mutating admin operation. Dispatches pending email/push notification deliveries. Roles: admin.',
      inputSchema: {
        ...confirmationShape
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async (args) => mutationTool(api, 'produs.admin.notifications.dispatch', args, { targetType: 'NOTIFICATION_DELIVERY' }, (idempotencyKey) =>
      api.post('/notifications/deliveries/dispatch', undefined, idempotencyKey)
    )
  );

  server.registerTool(
    'produs.admin.recommendations.review',
    {
      title: 'Review AI recommendation audit',
      description: 'Read-only. List AI recommendation audit records, optionally scoped to a source entity. Roles: admin or current-user records.',
      inputSchema: {
        sourceEntityType: z.string().optional(),
        sourceEntityId: z.string().optional()
      },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
    },
    async (args) => readTool('produs.admin.recommendations.review', async () => {
      const params = new URLSearchParams();
      if (args.sourceEntityType) params.set('sourceEntityType', args.sourceEntityType);
      if (args.sourceEntityId) params.set('sourceEntityId', args.sourceEntityId);
      const query = params.toString();
      return (await api.get(`/ai/recommendations${query ? `?${query}` : ''}`)).data;
    })
  );
}

async function inspectPackage(api: ProdusApi, packageId: string): Promise<JsonRecord> {
  const [packageInstance, modules, recommendations, proposals, shortlists] = await Promise.all([
    api.get(`/packages/${packageId}`),
    api.get(`/packages/${packageId}/modules`),
    api.get(`/packages/${packageId}/team-recommendations`),
    api.optionalGet(`/commerce/packages/${packageId}/proposals`),
    api.optionalGet(`/shortlists?packageId=${packageId}`)
  ]);
  return {
    package: packageInstance.data,
    modules: modules.data,
    teamRecommendations: recommendations.data,
    proposals,
    shortlists
  };
}

async function inspectWorkspace(api: ProdusApi, workspaceId: string): Promise<JsonRecord> {
  const [workspace, milestones, participants, supportRequests, disputes, attachments] = await Promise.all([
    api.get(`/workspaces/${workspaceId}`),
    api.get(`/workspaces/${workspaceId}/milestones`),
    api.optionalGet(`/workspaces/${workspaceId}/participants`),
    api.optionalGet(`/commerce/workspaces/${workspaceId}/support-requests`),
    api.optionalGet(`/commerce/workspaces/${workspaceId}/disputes`),
    api.optionalGet(`/attachments?workspaceId=${workspaceId}`)
  ]);
  const deliverables = await Promise.all(
    ((milestones.data as Array<{ id: string }>) || []).map(async (milestone) => ({
      milestoneId: milestone.id,
      deliverables: await api.optionalGet(`/workspaces/milestones/${milestone.id}/deliverables`)
    }))
  );
  return {
    workspace: workspace.data,
    milestones: milestones.data,
    deliverables,
    participants,
    supportRequests,
    disputes,
    attachments
  };
}

async function inspectAdminOperations(api: ProdusApi): Promise<JsonRecord> {
  const [dashboard, deliveryConfig, supportRequests, deliveries] = await Promise.all([
    api.get('/admin/dashboard'),
    api.optionalGet('/notifications/deliveries/config'),
    api.optionalGet('/commerce/support-requests'),
    api.optionalGet('/notifications/deliveries')
  ]);
  return {
    dashboard: dashboard.data,
    deliveryConfig,
    supportRequests,
    deliveries
  };
}

function filterCatalog(query: string | undefined, categories: unknown, modules: unknown, dependencies: unknown): JsonRecord {
  const normalized = query?.trim().toLowerCase();
  if (!normalized) {
    return { categories, modules, dependencies };
  }
  const matches = (value: unknown) => JSON.stringify(value).toLowerCase().includes(normalized);
  return {
    categories: Array.isArray(categories) ? categories.filter(matches) : categories,
    modules: Array.isArray(modules) ? modules.filter(matches) : modules,
    dependencies
  };
}

async function readTool(toolName: string, operation: () => Promise<unknown>): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  try {
    return jsonToolResult(await operation());
  } catch (error) {
    return toolError(`${toolName} failed: ${summarizeError(error)}`);
  }
}

async function mutationTool(
  api: ProdusApi,
  toolName: string,
  args: ToolArgs,
  target: { targetType?: string; targetId?: unknown },
  operation: (idempotencyKey?: string) => Promise<ApiResult<unknown>>
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  if (args.confirm !== true) {
    return toolError(`${toolName} requires confirm: true before it can change ProdUS state.`);
  }
  if (!args.reason || args.reason.trim().length < 3) {
    return toolError(`${toolName} requires a human-readable reason.`);
  }

  const inputHash = hashInput(args);
  try {
    const result = await operation(args.idempotencyKey);
    await api.audit({
      toolName,
      targetType: target.targetType,
      targetId: target.targetId === undefined ? undefined : String(target.targetId),
      inputHash,
      status: 'SUCCEEDED',
      backendStatus: result.status
    });
    return jsonToolResult(result.data);
  } catch (error) {
    const backendStatus = error instanceof ProdusApiError ? error.status : undefined;
    await api.audit({
      toolName,
      targetType: target.targetType,
      targetId: target.targetId === undefined ? undefined : String(target.targetId),
      inputHash,
      status: backendStatus === 403 ? 'FORBIDDEN' : 'FAILED',
      backendStatus,
      errorSummary: summarizeError(error)
    });
    return toolError(`${toolName} failed: ${summarizeError(error)}`);
  }
}

function omitControl<T extends JsonRecord>(args: T): JsonRecord {
  return omitControlAnd(args, []);
}

function omitControlAnd<T extends JsonRecord>(args: T, extraKeys: string[]): JsonRecord {
  const omitted = new Set(['confirm', 'reason', 'idempotencyKey', ...extraKeys]);
  return Object.entries(args).reduce<JsonRecord>((result, [key, value]) => {
    if (!omitted.has(key) && value !== undefined) {
      result[key] = value;
    }
    return result;
  }, {});
}

function jsonToolResult(data: unknown): { content: Array<{ type: 'text'; text: string }> } {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
  };
}

function toolError(text: string): { content: Array<{ type: 'text'; text: string }>; isError: true } {
  return {
    isError: true,
    content: [{ type: 'text', text }]
  };
}

function jsonResource(uri: string, data: unknown): { contents: Array<{ uri: string; mimeType: string; text: string }> } {
  return {
    contents: [
      {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2)
      }
    ]
  };
}

function promptResult(text: string): { messages: Array<{ role: 'user'; content: { type: 'text'; text: string } }> } {
  return {
    messages: [
      {
        role: 'user',
        content: { type: 'text', text }
      }
    ]
  };
}

function summarizeError(error: unknown): string {
  if (error instanceof ProdusApiError) {
    return `Backend HTTP ${error.status}: ${truncate(typeof error.body === 'string' ? error.body : JSON.stringify(error.body))}`;
  }
  if (error instanceof Error) {
    return truncate(error.message);
  }
  return truncate(String(error));
}

function truncate(value: string, maxLength = 800): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}
