package com.produs.platform;

import com.produs.catalog.CatalogCoreSeedService;
import com.produs.catalog.ServiceModule;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.entity.User;
import com.produs.packages.PackageInstance;
import com.produs.packages.PackageInstanceRepository;
import com.produs.packages.PackageModule;
import com.produs.packages.PackageModuleRepository;
import com.produs.product.ProductProfile;
import com.produs.product.ProductProfileRepository;
import com.produs.repository.UserRepository;
import com.produs.scanner.NormalizedFinding;
import com.produs.scanner.ScannerRiskThread;
import com.produs.scanner.ScannerRiskThreadRepository;
import com.produs.service.S3Service;
import com.produs.workspace.ProjectWorkspace;
import com.produs.workspace.ProjectWorkspaceRepository;
import com.produs.workspace.WorkspaceServiceFinding;
import com.produs.workspace.WorkspaceServiceFinding.WorkspaceServiceFindingStatus;
import com.produs.workspace.WorkspaceServiceFindingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WorkspaceServiceFindingsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductProfileRepository productRepository;

    @Autowired
    private ServiceModuleRepository serviceModuleRepository;

    @Autowired
    private PackageInstanceRepository packageRepository;

    @Autowired
    private PackageModuleRepository packageModuleRepository;

    @Autowired
    private ProjectWorkspaceRepository workspaceRepository;

    @Autowired
    private ScannerRiskThreadRepository riskThreadRepository;

    @Autowired
    private WorkspaceServiceFindingRepository workspaceServiceFindingRepository;

    @Autowired
    private CatalogCoreSeedService catalogCoreSeedService;

    @MockBean
    private S3Service s3Service;

    @BeforeEach
    void seedCatalog() {
        catalogCoreSeedService.seedCoreCatalog();
    }

    @Test
    void directWorkspaceAssignmentChoosesServiceBeforeIncludingUnmappedFinding() throws Exception {
        User owner = saveUser("service-owned-direct@produs.test");
        ProductProfile product = createProduct(owner, "Direct service-owned product");
        ServiceModule secrets = service("security.secrets_scan");
        ProjectWorkspace workspace = createWorkspace(owner, product, secrets);
        ScannerRiskThread risk = createRisk(product, null, "Unmapped secret finding");

        mockMvc.perform(post("/api/scanner/risks/{riskThreadId}/assign-workspace", risk.getId())
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "workspaceId": "%s",
                                  "serviceModuleId": "%s"
                                }
                                """.formatted(workspace.getId(), secrets.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workspaceId").value(workspace.getId().toString()))
                .andExpect(jsonPath("$.recommendedModule.stableCode").value("security.secrets_scan"))
                .andExpect(jsonPath("$.serviceMappingNote").value("Service selected before adding the finding to workspace work."));

        ScannerRiskThread savedRisk = riskThreadRepository.findById(risk.getId()).orElseThrow();
        assertThat(savedRisk.getRecommendedModule().getId()).isEqualTo(secrets.getId());
        assertThat(savedRisk.getWorkspace().getId()).isEqualTo(workspace.getId());
        WorkspaceServiceFinding scope = workspaceServiceFindingRepository
                .findByWorkspaceIdAndServiceModuleIdAndRiskThreadId(workspace.getId(), secrets.getId(), risk.getId())
                .orElseThrow();
        assertThat(scope.getStatus()).isEqualTo(WorkspaceServiceFindingStatus.INCLUDED);
    }

    @Test
    void serviceScopedFindingCannotBeIncludedUntilServiceIsInWorkspace() throws Exception {
        User owner = saveUser("service-owned-missing-service@produs.test");
        ProductProfile product = createProduct(owner, "Missing workspace service product");
        ServiceModule secrets = service("security.secrets_scan");
        ServiceModule apiReview = service("security.api_review");
        ProjectWorkspace workspace = createWorkspace(owner, product, secrets);
        ScannerRiskThread risk = createRisk(product, apiReview, "API review finding");

        mockMvc.perform(post("/api/workspaces/{workspaceId}/services/{serviceModuleId}/findings", workspace.getId(), apiReview.getId())
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "riskThreadIds": ["%s"],
                                  "includeExcluded": false
                                }
                                """.formatted(risk.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(containsString("Add API security review to this workspace")));

        assertThat(workspaceServiceFindingRepository
                .findByWorkspaceIdAndServiceModuleIdAndRiskThreadId(workspace.getId(), apiReview.getId(), risk.getId()))
                .isEmpty();
        assertThat(riskThreadRepository.findById(risk.getId()).orElseThrow().getWorkspace()).isNull();
    }

    @Test
    void addingServiceCanChooseServiceForExplicitUnmappedFinding() throws Exception {
        User owner = saveUser("service-owned-unmapped-add-service@produs.test");
        ProductProfile product = createProduct(owner, "Unmapped add-service product");
        ServiceModule secrets = service("security.secrets_scan");
        ServiceModule apiReview = service("security.api_review");
        ProjectWorkspace workspace = createWorkspace(owner, product, secrets);
        ScannerRiskThread risk = createRisk(product, null, "API endpoint needs ownership");

        mockMvc.perform(post("/api/workspaces/{workspaceId}/services", workspace.getId())
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "serviceModuleId": "%s",
                                  "selectedRiskThreadIds": ["%s"],
                                  "includeExcluded": false,
                                  "addMatchingFindings": true,
                                  "createMilestone": false
                                }
                                """.formatted(apiReview.getId(), risk.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.addedFindingCount").value(1))
                .andExpect(jsonPath("$.addedFindings[0].serviceName").value("API security review"));

        ScannerRiskThread savedRisk = riskThreadRepository.findById(risk.getId()).orElseThrow();
        assertThat(savedRisk.getRecommendedModule().getId()).isEqualTo(apiReview.getId());
        assertThat(savedRisk.getServiceMappingNote()).isEqualTo("Service selected before adding the finding to workspace work.");
        assertThat(savedRisk.getWorkspace().getId()).isEqualTo(workspace.getId());
        assertThat(packageModuleRepository
                .findByPackageInstanceIdAndServiceModuleId(workspace.getPackageInstance().getId(), apiReview.getId()))
                .isPresent();
        assertThat(workspaceServiceFindingRepository
                .findByWorkspaceIdAndServiceModuleIdAndRiskThreadId(workspace.getId(), apiReview.getId(), risk.getId())
                .orElseThrow()
                .getStatus()).isEqualTo(WorkspaceServiceFindingStatus.INCLUDED);
    }

    @Test
    void removingServiceExcludesFindingsAndReaddingRequiresExplicitConfirmation() throws Exception {
        User owner = saveUser("service-owned-readd@produs.test");
        ProductProfile product = createProduct(owner, "Re-add service-owned product");
        ServiceModule secrets = service("security.secrets_scan");
        ProjectWorkspace workspace = createWorkspace(owner, product, secrets);
        ScannerRiskThread risk = createRisk(product, secrets, "Secret needs rotation");

        includeFinding(owner, workspace, secrets, risk, false);

        PackageModule module = packageModuleRepository
                .findByPackageInstanceIdAndServiceModuleId(workspace.getPackageInstance().getId(), secrets.getId())
                .orElseThrow();
        mockMvc.perform(delete("/api/workspaces/{workspaceId}/services/{moduleId}", workspace.getId(), module.getId())
                        .with(auth(owner)))
                .andExpect(status().isOk());

        WorkspaceServiceFinding excluded = workspaceServiceFindingRepository
                .findByWorkspaceIdAndServiceModuleIdAndRiskThreadId(workspace.getId(), secrets.getId(), risk.getId())
                .orElseThrow();
        assertThat(excluded.getStatus()).isEqualTo(WorkspaceServiceFindingStatus.EXCLUDED);
        assertThat(riskThreadRepository.findById(risk.getId()).orElseThrow().getWorkspace()).isNull();

        mockMvc.perform(post("/api/workspaces/{workspaceId}/scanner/check-fixes", workspace.getId())
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "riskThreadIds": ["%s"],
                                  "mode": "RELEVANT_TO_FIXES",
                                  "authorizationConfirmed": true
                                }
                                """.formatted(risk.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Select at least one workspace risk to check"));

        mockMvc.perform(post("/api/workspaces/{workspaceId}/services", workspace.getId())
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "serviceModuleId": "%s",
                                  "selectedRiskThreadIds": ["%s"],
                                  "includeExcluded": false,
                                  "addMatchingFindings": true,
                                  "createMilestone": false
                                }
                                """.formatted(secrets.getId(), risk.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.addedFindingCount").value(0));

        assertThat(workspaceServiceFindingRepository
                .findByWorkspaceIdAndServiceModuleIdAndRiskThreadId(workspace.getId(), secrets.getId(), risk.getId())
                .orElseThrow()
                .getStatus()).isEqualTo(WorkspaceServiceFindingStatus.EXCLUDED);

        mockMvc.perform(post("/api/workspaces/{workspaceId}/services/{serviceModuleId}/findings", workspace.getId(), secrets.getId())
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "riskThreadIds": ["%s"],
                                  "includeExcluded": true,
                                  "note": "Owner confirmed this finding belongs in the workspace again."
                                }
                                """.formatted(risk.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.findingCount").value(1));

        ScannerRiskThread readdedRisk = riskThreadRepository.findById(risk.getId()).orElseThrow();
        assertThat(readdedRisk.getWorkspace().getId()).isEqualTo(workspace.getId());
        assertThat(workspaceServiceFindingRepository
                .findByWorkspaceIdAndServiceModuleIdAndRiskThreadId(workspace.getId(), secrets.getId(), risk.getId())
                .orElseThrow()
                .getStatus()).isEqualTo(WorkspaceServiceFindingStatus.INCLUDED);
    }

    @Test
    void changingFindingServiceRequiresWorkspaceServiceAndMovesIncludedScope() throws Exception {
        User owner = saveUser("service-owned-move@produs.test");
        ProductProfile product = createProduct(owner, "Move service-owned product");
        ServiceModule secrets = service("security.secrets_scan");
        ServiceModule apiReview = service("security.api_review");
        ProjectWorkspace workspace = createWorkspace(owner, product, secrets);
        ScannerRiskThread risk = createRisk(product, secrets, "Secret should move to API review");

        includeFinding(owner, workspace, secrets, risk, false);

        mockMvc.perform(patch("/api/scanner/risks/{riskThreadId}/service", risk.getId())
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "serviceModuleId": "%s",
                                  "note": "Needs API review now."
                                }
                                """.formatted(apiReview.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(containsString("Add API security review to this workspace before moving the finding")));

        assertThat(workspaceServiceFindingRepository
                .findByWorkspaceIdAndServiceModuleIdAndRiskThreadId(workspace.getId(), secrets.getId(), risk.getId())
                .orElseThrow()
                .getStatus()).isEqualTo(WorkspaceServiceFindingStatus.INCLUDED);

        addWorkspaceService(workspace, apiReview, 2);
        mockMvc.perform(patch("/api/scanner/risks/{riskThreadId}/service", risk.getId())
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "serviceModuleId": "%s",
                                  "note": "Needs API review now."
                                }
                                """.formatted(apiReview.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recommendedModule.stableCode").value("security.api_review"))
                .andExpect(jsonPath("$.workspaceId").value(workspace.getId().toString()));

        assertThat(workspaceServiceFindingRepository
                .findByWorkspaceIdAndServiceModuleIdAndRiskThreadId(workspace.getId(), secrets.getId(), risk.getId())
                .orElseThrow()
                .getStatus()).isEqualTo(WorkspaceServiceFindingStatus.EXCLUDED);
        assertThat(workspaceServiceFindingRepository
                .findByWorkspaceIdAndServiceModuleIdAndRiskThreadId(workspace.getId(), apiReview.getId(), risk.getId())
                .orElseThrow()
                .getStatus()).isEqualTo(WorkspaceServiceFindingStatus.INCLUDED);
    }

    private void includeFinding(User owner, ProjectWorkspace workspace, ServiceModule service, ScannerRiskThread risk, boolean includeExcluded) throws Exception {
        mockMvc.perform(post("/api/workspaces/{workspaceId}/services/{serviceModuleId}/findings", workspace.getId(), service.getId())
                        .with(auth(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "riskThreadIds": ["%s"],
                                  "includeExcluded": %s
                                }
                                """.formatted(risk.getId(), includeExcluded)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.findingCount").value(1));
    }

    private User saveUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setFirstName("Workspace");
        user.setLastName("Owner");
        user.setRole(User.UserRole.PRODUCT_OWNER);
        user.setSupabaseId(email);
        return userRepository.save(user);
    }

    private ProductProfile createProduct(User owner, String name) {
        ProductProfile product = new ProductProfile();
        product.setOwner(owner);
        product.setName(name);
        product.setSummary("A prototype product used to prove workspace finding ownership.");
        product.setBusinessStage(ProductProfile.BusinessStage.PROTOTYPE);
        product.setTechStack("Next.js, Spring Boot");
        product.setRiskProfile("Security launch blockers need clear service ownership.");
        return productRepository.save(product);
    }

    private ProjectWorkspace createWorkspace(User owner, ProductProfile product, ServiceModule firstService) {
        PackageInstance packageInstance = new PackageInstance();
        packageInstance.setOwner(owner);
        packageInstance.setProductProfile(product);
        packageInstance.setName(product.getName() + " workspace plan");
        packageInstance.setSummary("Workspace plan for service-owned findings.");
        packageInstance.setStatus(PackageInstance.PackageStatus.ACTIVE_DELIVERY);
        packageInstance = packageRepository.save(packageInstance);

        addWorkspaceService(packageInstance, firstService, 1);

        ProjectWorkspace workspace = new ProjectWorkspace();
        workspace.setOwner(owner);
        workspace.setPackageInstance(packageInstance);
        workspace.setName(product.getName() + " delivery workspace");
        workspace.setStatus(ProjectWorkspace.WorkspaceStatus.ACTIVE_DELIVERY);
        return workspaceRepository.save(workspace);
    }

    private PackageModule addWorkspaceService(ProjectWorkspace workspace, ServiceModule service, int sequence) {
        return addWorkspaceService(workspace.getPackageInstance(), service, sequence);
    }

    private PackageModule addWorkspaceService(PackageInstance packageInstance, ServiceModule service, int sequence) {
        PackageModule packageModule = new PackageModule();
        packageModule.setPackageInstance(packageInstance);
        packageModule.setServiceModule(service);
        packageModule.setSequenceOrder(sequence);
        packageModule.setRequired(true);
        packageModule.setRationale("Service owns matching workspace findings.");
        packageModule.setDeliverables(service.getExpectedDeliverables());
        packageModule.setAcceptanceCriteria(service.getAcceptanceCriteria());
        return packageModuleRepository.save(packageModule);
    }

    private ScannerRiskThread createRisk(ProductProfile product, ServiceModule service, String title) {
        ScannerRiskThread risk = new ScannerRiskThread();
        risk.setProductProfile(product);
        risk.setFingerprint(UUID.randomUUID().toString());
        risk.setTitle(title);
        risk.setDescription(title + " must be handled before launch.");
        risk.setSeverity(NormalizedFinding.FindingSeverity.HIGH);
        risk.setCurrentState(ScannerRiskThread.RiskState.NEW);
        risk.setRecommendedModule(service);
        risk.setScannerSuggestedModule(service);
        risk.setSourceTool("Semgrep");
        risk.setSourceRuleId("workspace-service-owned-test");
        risk.setAffectedComponent("src/security.ts");
        risk.setReadinessArea("Security");
        risk.setBusinessRisk("Could block a safe MVP launch.");
        risk.setEvidenceRequired("Show the fix and scanner proof.");
        return riskThreadRepository.save(risk);
    }

    private ServiceModule service(String stableCode) {
        return serviceModuleRepository.findByStableCode(stableCode).orElseThrow();
    }

    private RequestPostProcessor auth(User user) {
        return authentication(new UsernamePasswordAuthenticationToken(
                user,
                "n/a",
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        ));
    }
}
