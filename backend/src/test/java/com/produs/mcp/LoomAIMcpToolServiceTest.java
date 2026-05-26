package com.produs.mcp;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.produs.catalog.PackageTemplateModuleRepository;
import com.produs.catalog.PackageTemplateRepository;
import com.produs.catalog.ServiceCategoryRepository;
import com.produs.catalog.ServiceDependencyRepository;
import com.produs.catalog.ServiceModuleRepository;
import com.produs.packages.PackageInstanceRepository;
import com.produs.packages.PackageModuleRepository;
import com.produs.product.AiAssistedProductCreationService;
import com.produs.product.ProductProfileRepository;
import com.produs.product.ProductProjectAttachmentService;
import com.produs.scanner.NormalizedFindingRepository;
import com.produs.scanner.ScanRunRepository;
import com.produs.scanner.ScannerEvidenceItemRepository;
import com.produs.workspace.DeliverableRepository;
import com.produs.workspace.MilestoneRepository;
import com.produs.workspace.ProjectWorkspaceRepository;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LoomAIMcpToolServiceTest {

    @Test
    void readsTemporaryProjectCreationDocumentText() {
        ProductProjectAttachmentService attachmentService = mock(ProductProjectAttachmentService.class);
        when(attachmentService.createAiAccessDocumentDownload("pdoc_test-token")).thenReturn(
                new ProductProjectAttachmentService.TemporaryAiDocumentDownload(
                        "PROJECT_OVERVIEW.md",
                        "text/markdown",
                        "# Orion Launch Auditor\nTech stack: Next.js and Spring Boot.".getBytes(StandardCharsets.UTF_8),
                        58
                )
        );

        LoomAIMcpToolService service = new LoomAIMcpToolService(
                mock(ServiceCategoryRepository.class),
                mock(ServiceModuleRepository.class),
                mock(ServiceDependencyRepository.class),
                mock(PackageTemplateRepository.class),
                mock(PackageTemplateModuleRepository.class),
                mock(ProductProfileRepository.class),
                mock(PackageInstanceRepository.class),
                mock(PackageModuleRepository.class),
                mock(ProjectWorkspaceRepository.class),
                mock(MilestoneRepository.class),
                mock(DeliverableRepository.class),
                mock(ScanRunRepository.class),
                mock(NormalizedFindingRepository.class),
                mock(ScannerEvidenceItemRepository.class),
                mock(AiAssistedProductCreationService.class),
                attachmentService,
                new ObjectMapper()
        );

        Map<String, Object> response = service.call(
                "produs.project_creation_document.read",
                Map.of("temporaryAccessUrl", "https://produs-api.example/api/product-attachments/ai-access/pdoc_test-token")
        );

        assertThat(response).containsEntry("status", "READ");
        assertThat(response).containsEntry("readableText", true);
        assertThat(response.get("contentText").toString()).contains("Orion Launch Auditor");
        assertThat(response.get("contentText").toString()).contains("Spring Boot");
        verify(attachmentService).createAiAccessDocumentDownload("pdoc_test-token");
    }
}
