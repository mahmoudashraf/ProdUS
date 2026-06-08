package com.produs.repo;

import com.produs.entity.User;
import com.produs.product.ProductProfile;
import com.produs.product.ProductProfileRepository;
import com.produs.scanner.NormalizedFinding;
import com.produs.scanner.NormalizedFindingRepository;
import com.produs.scanner.ScanRun;
import com.produs.scanner.ScanRunRepository;
import com.produs.scanner.ScanSource;
import com.produs.scanner.ScanSourceRepository;
import com.produs.workspace.ProjectWorkspaceRepository;
import com.produs.workspace.WorkspaceParticipantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RepoSignalServiceTest {

    private RepoSignalRepository repoSignalRepository;
    private ProductProfileRepository productRepository;
    private ScanSourceRepository scanSourceRepository;
    private ScanRunRepository scanRunRepository;
    private NormalizedFindingRepository findingRepository;
    private RepoSignalService service;

    @BeforeEach
    void setUp() {
        repoSignalRepository = mock(RepoSignalRepository.class);
        productRepository = mock(ProductProfileRepository.class);
        ProjectWorkspaceRepository workspaceRepository = mock(ProjectWorkspaceRepository.class);
        WorkspaceParticipantRepository participantRepository = mock(WorkspaceParticipantRepository.class);
        scanSourceRepository = mock(ScanSourceRepository.class);
        scanRunRepository = mock(ScanRunRepository.class);
        findingRepository = mock(NormalizedFindingRepository.class);
        service = new RepoSignalService(
                repoSignalRepository,
                productRepository,
                workspaceRepository,
                participantRepository,
                scanSourceRepository,
                scanRunRepository,
                findingRepository
        );
    }

    @Test
    void refreshProductSignalsBuildsRepoStackScannerAndUnknownFacts() {
        User owner = user(User.UserRole.PRODUCT_OWNER);
        ProductProfile product = product(owner);
        product.setRepositoryUrl("https://github.com/mahmoudashraf/ProdUS");
        product.setProductUrl("https://produs.example.com");
        product.setTechStack("Spring Boot, PostgreSQL, Next.js, Supabase Auth");

        ScanSource source = new ScanSource();
        source.setProductProfile(product);
        source.setProviderType(ScanSource.ProviderType.GITHUB);
        source.setDisplayName("ProdUS GitHub");
        source.setExternalRepositoryFullName("mahmoudashraf/ProdUS");
        source.setExternalReference("https://github.com/mahmoudashraf/ProdUS");
        source.setDefaultBranch("main");
        source.setAuthorizationStatus(ScanSource.AuthorizationStatus.AUTHORIZED);
        source.setScopeNote("Repository README and docs are authorized for product proof.");

        ScanRun run = new ScanRun();
        run.setProductProfile(product);
        run.setScanSource(source);
        run.setDepth(ScanRun.ScanDepth.SAFE_STATIC);
        run.setStatus(ScanRun.RunStatus.COMPLETED);
        run.setTriggerType(ScanRun.TriggerType.HOSTED_SCAN);
        run.setCompletedAt(LocalDateTime.now());
        run.setBranchRef("main");
        run.setRuntimeTargetUrl("https://produs.example.com");
        run.setScanPlan("Safe static scan of repository README and Docker deployment evidence.");

        NormalizedFinding finding = new NormalizedFinding();
        finding.setProductProfile(product);
        finding.setScanRun(run);
        finding.setSourceTool("CodeQL");
        finding.setSourceRuleId("secret-detected");
        finding.setTitle("Database URL exposed in sample env");
        finding.setDescription("Sensitive configuration appears in a repository sample.");
        finding.setSeverity(NormalizedFinding.FindingSeverity.CRITICAL);
        finding.setStatus(NormalizedFinding.FindingStatus.OPEN);
        finding.setFindingCategory("security");
        finding.setReadinessArea("security");
        finding.setBusinessRisk("Prototype may leak credentials before production launch.");

        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
        when(scanSourceRepository.findByProductProfileIdOrderByCreatedAtDesc(product.getId())).thenReturn(List.of(source));
        when(scanRunRepository.findByProductProfileIdOrderByCreatedAtDesc(product.getId())).thenReturn(List.of(run));
        when(findingRepository.findByProductProfileIdOrderBySeverityDescCreatedAtDesc(product.getId())).thenReturn(List.of(finding));
        when(repoSignalRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        RepoSignalService.RepoSignalSummaryResponse response = service.refreshProductSignals(owner, product.getId());

        assertThat(response.sourceStatus()).isEqualTo("AUTHORIZED_SOURCE");
        assertThat(response.signals()).extracting(RepoSignalService.RepoSignalResponse::signalType)
                .contains(
                        RepoSignal.SignalType.REPOSITORY_SOURCE,
                        RepoSignal.SignalType.SOURCE_AUTHORIZATION,
                        RepoSignal.SignalType.FRAMEWORK,
                        RepoSignal.SignalType.DATABASE,
                        RepoSignal.SignalType.DOCUMENTATION,
                        RepoSignal.SignalType.SCANNER_STATUS,
                        RepoSignal.SignalType.SECURITY,
                        RepoSignal.SignalType.SCANNER_FINDING
                );
        assertThat(response.signals())
                .filteredOn(signal -> signal.signalType() == RepoSignal.SignalType.DOCUMENTATION)
                .extracting(RepoSignalService.RepoSignalResponse::signalValue)
                .contains("Documentation evidence");
        assertThat(response.detectedStack()).extracting(RepoSignalService.RepoSignalResponse::signalValue)
                .contains("Spring Boot", "Next.js", "PostgreSQL", "Supabase");
        assertThat(response.unknowns()).extracting(RepoSignalService.RepoSignalResponse::signalValue)
                .contains("CI/CD proof is unknown", "Test coverage proof is unknown");
        assertThat(response.aiContextFacts()).containsKeys("repository", "detectedStack", "scannerFacts", "unknowns", "nextActions");
    }

    @Test
    void refreshProductSignalsRequiresProductOwnerOrAdmin() {
        User owner = user(User.UserRole.PRODUCT_OWNER);
        User otherOwner = user(User.UserRole.PRODUCT_OWNER);
        ProductProfile product = product(owner);
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> service.refreshProductSignals(otherOwner, product.getId()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Repo signals cannot be refreshed");
    }

    private User user(User.UserRole role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(UUID.randomUUID() + "@produs.test");
        user.setRole(role);
        return user;
    }

    private ProductProfile product(User owner) {
        ProductProfile product = new ProductProfile();
        product.setId(UUID.randomUUID());
        product.setOwner(owner);
        product.setName("ProdUS");
        product.setSummary("Prototype-to-product workspace");
        product.setBusinessStage(ProductProfile.BusinessStage.PROTOTYPE);
        return product;
    }
}
