const fs = require("fs");
const path = require("path");
const { chromium } = require(
  path.join(process.cwd(), "frontend/node_modules/playwright"),
);

const frontend = process.env.PRODUS_FRONTEND_URL || "http://127.0.0.1:3000";
const apiUrl = process.env.PRODUS_API_URL || "http://127.0.0.1:8080/api";
const suffix =
  process.env.PRODUS_SCREENSHOT_SUFFIX || `workspace-owner-proof-${Date.now()}`;
const outputDir = __dirname;
const screenshots = [];

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${apiUrl}${endpoint}`, options);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `${endpoint} failed: ${response.status} ${text.slice(0, 1200)}`,
    );
  }
  return text ? JSON.parse(text) : null;
}

async function login() {
  return apiRequest("/mock/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "owner@produs.com", password: "owner123" }),
  });
}

async function authed(token, endpoint, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

function flattenRisks(summary) {
  return (summary?.groups || []).flatMap((group) => group.risks || []);
}

async function uploadProof(
  token,
  scopeType,
  scopeId,
  label,
  filename,
  payload,
) {
  const form = new FormData();
  form.append("scopeType", scopeType);
  form.append("scopeId", scopeId);
  form.append("label", label);
  form.append(
    "file",
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    filename,
  );
  return authed(token, "/attachments", {
    method: "POST",
    body: form,
  });
}

async function seedWorkspace(token) {
  await authed(token, "/mock/feed/platform-demo", { method: "POST" }).catch(
    () => null,
  );
  const modules = await authed(token, "/catalog/modules");
  const service =
    modules.find((module) => module.slug === "api-security-review") ||
    modules.find((module) => module.active && module.visible) ||
    modules[0];
  if (!service?.id) throw new Error("No catalog service module is available.");

  const stamp = new Date().toISOString();
  const product = await authed(token, "/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `Workspace owner proof ${stamp}`,
      summary:
        "Verification product for owner/proof/handoff workspace enhancements.",
      businessStage: "PROTOTYPE",
      techStack: "Next.js, Spring Boot",
      productUrl: "https://example.com/workspace-owner-proof",
      repositoryUrl: "https://github.com/example/workspace-owner-proof",
      riskProfile:
        "Verify named owners, contextual proof, and handoff readiness.",
    }),
  });

  await authed(token, "/scanner/imports/external", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: product.id,
      provider: "GENERIC_JSON",
      importMethod: "MANUAL_API_IMPORT",
      toolName: `Owner proof import ${Date.now()}`,
      format: "JSON",
      artifactFileName: "workspace-owner-proof-risk.json",
      artifactPayload: JSON.stringify({
        findings: [
          {
            id: `workspace-owner-proof-${Date.now()}`,
            title: "Billing webhook retry path lacks owner proof",
            description:
              "The billing webhook retry path needs explicit production ownership and proof before handoff.",
            severity: "high",
            component: "api/billing-webhooks",
          },
        ],
      }),
      externalReference: `workspace-owner-proof-${Date.now()}`,
      scopeNote:
        "Local verification import for workspace owner/proof/handoff enhancements.",
    }),
  });

  let risk = flattenRisks(
    await authed(token, `/scanner/products/${product.id}/risks/current`),
  ).find((item) => item.title.includes("Billing webhook retry path"));
  if (!risk?.id)
    throw new Error("Scanner import did not create the owner proof risk.");

  if (!risk.recommendedModule?.id || risk.recommendedModule.id !== service.id) {
    risk = await authed(token, `/scanner/risks/${risk.id}/service`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceModuleId: service.id,
        note: "Owner/proof verification maps this finding to the service lane that owns the fix.",
      }),
    });
  }

  const workspace = await authed(token, "/workspaces", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productProfileId: product.id,
      name: `Owner proof workspace ${stamp}`,
      status: "ACTIVE_DELIVERY",
    }),
  });

  const serviceAdd = await authed(
    token,
    `/workspaces/${workspace.id}/services`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceModuleId: service.id,
        required: true,
        rationale:
          "Added to verify named ownership and contextual service proof.",
        createMilestone: true,
        addMatchingFindings: true,
        selectedRiskThreadIds: [risk.id],
      }),
    },
  );

  const participant = await authed(
    token,
    `/workspaces/${workspace.id}/participants`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "team@produs.com",
        role: "TEAM_LEAD",
        active: true,
      }),
    },
  );

  const workspaceRisk = flattenRisks(
    await authed(token, `/workspaces/${workspace.id}/scanner/risks/current`),
  ).find((item) => item.id === risk.id);
  if (!workspaceRisk?.id || !workspaceRisk.currentFindingId) {
    throw new Error(
      "Workspace risk was not assigned with a current finding id.",
    );
  }

  const participants = await authed(
    token,
    `/workspaces/${workspace.id}/participants`,
  );
  const ownerParticipant =
    participants.find((item) => item.role === "OWNER") ||
    participants.find((item) => item.user?.email === "owner@produs.com");
  if (!ownerParticipant?.user?.id) {
    throw new Error(
      "Workspace owner participant was not available for service assignment.",
    );
  }

  const serviceOwner = await authed(
    token,
    `/workspaces/${workspace.id}/services/${serviceAdd.service.id}/owner`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerUserId: ownerParticipant.user.id,
        note: "Owner proof verification assigned this service from Work scope.",
      }),
    },
  );

  const findingOwner = await authed(
    token,
    `/workspaces/${workspace.id}/scanner/risks/${workspaceRisk.id}/owner`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerUserId: participant.user.id,
        note: "Owner proof verification assigned this finding from Fix and verify.",
      }),
    },
  );

  const serviceProof = await uploadProof(
    token,
    "SERVICE",
    serviceAdd.service.id,
    "Service owner proof",
    "service-owner-proof.json",
    {
      service: service.name,
      owner: serviceOwner.owner?.email,
      verifiedAt: stamp,
    },
  );
  const findingProof = await uploadProof(
    token,
    "FINDING",
    workspaceRisk.id,
    "Finding verification proof",
    "finding-verification-proof.json",
    {
      finding: workspaceRisk.title,
      owner: findingOwner.owner?.email,
      verifiedAt: stamp,
    },
  );

  const reviewDue = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    .toISOString()
    .slice(0, 10);
  await authed(
    token,
    `/scanner/findings/${workspaceRisk.currentFindingId}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "ACCEPTED_RISK",
        reason:
          "Owner accepted this residual risk after contextual service and finding proof were attached.",
        reviewDueOn: reviewDue,
      }),
    },
  );

  await authed(token, `/workspaces/${workspace.id}/chat/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      body: `Decision: ${service.name} owns the residual-risk handoff, with proof attached to the service and finding.`,
    }),
  });

  return {
    product,
    workspace,
    service: serviceAdd.service.serviceModule,
    servicePackage: serviceAdd.service,
    risk: workspaceRisk,
    ownerParticipant,
    participant,
    serviceOwner,
    findingOwner,
    serviceProof,
    findingProof,
    reviewDue,
  };
}

async function createPage(browser, session, viewport) {
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport,
  });
  await context.addInitScript(
    ({ token, user }) => {
      window.localStorage.setItem("mock_token", token);
      window.localStorage.setItem("mock_user", JSON.stringify(user));
    },
    { token: session.token, user: session.user },
  );
  return context.newPage();
}

async function expectText(page, label) {
  await page
    .getByText(label, { exact: false })
    .first()
    .waitFor({ timeout: 90000 });
}

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    bodyClientWidth: document.body.clientWidth,
  }));
  const maxOverflow = Math.max(
    overflow.scrollWidth - overflow.clientWidth,
    overflow.bodyScrollWidth - overflow.bodyClientWidth,
  );
  if (maxOverflow > 1) {
    throw new Error(`Mobile viewport has horizontal overflow: ${JSON.stringify(overflow)}`);
  }
}

async function capture(page, index, name, fullPage = false) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.scrollingElement?.scrollTo(0, 0);
  });
  await page.waitForTimeout(650);
  const file = path.join(outputDir, `${index}-${name}-${suffix}.png`);
  await page.screenshot({ path: file, fullPage });
  screenshots.push(file);
}

async function openWorkspaceView(page, subject, view, extra = "") {
  const viewParam = view ? `&workspaceView=${view}` : "";
  await page.goto(
    `${frontend}/products/${subject.product.id}?tab=workspaces&workspace=${subject.workspace.id}${viewParam}${extra}&verify=${Date.now()}`,
    { waitUntil: "domcontentloaded", timeout: 90000 },
  );
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const session = await login();
  const subject = await seedWorkspace(session.token);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await createPage(browser, session, {
      width: 1440,
      height: 980,
    });

    await openWorkspaceView(page, subject, "services");
    await expectText(page, "Work scope");
    await expectText(page, "Service owner");
    await expectText(page, session.user.email);
    await expectText(page, "Service proof");
    await expectText(page, "Service owner proof");
    await capture(page, 2030, "service-owner-proof", true);

    await openWorkspaceView(
      page,
      subject,
      "proof",
      "&workspaceProofView=findings",
    );
    await expectText(page, "Service-owned findings and checks");
    await expectText(page, "Finding owner");
    await expectText(page, subject.participant.user.email);
    await expectText(page, "Finding proof");
    await expectText(page, "Finding verification proof");
    await expectText(page, "Accepted risk");
    await capture(page, 2031, "finding-owner-proof", true);

    await openWorkspaceView(page, subject, "team");
    await expectText(page, "Ownership map");
    await expectText(page, "Service owners");
    await expectText(page, "Finding owners");
    await expectText(page, "have named owners");
    await expectText(page, "have explicit finding owners");
    await expectText(page, session.user.email);
    await capture(page, 2032, "ownership-map-assigned", true);

    await openWorkspaceView(page, subject, "handoff");
    await expectText(page, "Handoff ready for owner review");
    await expectText(page, "Continuity is ready to review");
    await expectText(
      page,
      "No unresolved selected finding is blocking handoff",
    );
    await expectText(page, "service and finding owners are named");
    await capture(page, 2033, "handoff-ready-owner-review", true);

    const mobile = await createPage(browser, session, {
      width: 390,
      height: 900,
    });

    await openWorkspaceView(mobile, subject, "services");
    await expectText(mobile, "Work scope");
    await expectText(mobile, "Service owner");
    await expectText(mobile, "Service owner proof");
    await assertNoHorizontalOverflow(mobile);
    await capture(mobile, 2034, "mobile-service-owner-proof", true);

    await openWorkspaceView(
      mobile,
      subject,
      "proof",
      "&workspaceProofView=findings",
    );
    await expectText(mobile, "Service-owned findings and checks");
    await expectText(mobile, "Finding owner");
    await expectText(mobile, "Finding verification proof");
    await assertNoHorizontalOverflow(mobile);
    await capture(mobile, 2035, "mobile-finding-owner-proof", true);

    await openWorkspaceView(mobile, subject, "team");
    await expectText(mobile, "Ownership map");
    await expectText(mobile, "Service owners");
    await expectText(mobile, "Finding owners");
    await assertNoHorizontalOverflow(mobile);
    await capture(mobile, 2036, "mobile-ownership-map-assigned", true);

    await openWorkspaceView(mobile, subject, "handoff");
    await expectText(mobile, "Handoff ready for owner review");
    await expectText(mobile, "service and finding owners are named");
    await assertNoHorizontalOverflow(mobile);
    await capture(mobile, 2037, "mobile-handoff-ready-owner-review", true);

    const report = {
      productId: subject.product.id,
      workspaceId: subject.workspace.id,
      packageModuleId: subject.servicePackage.id,
      serviceName: subject.service.name,
      riskId: subject.risk.id,
      riskTitle: subject.risk.title,
      serviceOwnerEmail: subject.serviceOwner.owner?.email,
      findingOwnerEmail: subject.findingOwner.owner?.email,
      serviceProofId: subject.serviceProof.id,
      findingProofId: subject.findingProof.id,
      reviewDue: subject.reviewDue,
      screenshots,
    };
    const reportPath = path.join(
      outputDir,
      `2030-workspace-owner-proof-${suffix}.json`,
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
