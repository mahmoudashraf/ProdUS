package com.produs.platform;

import com.produs.product.ProductProjectAttachmentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.head;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "app.mock-auth.enabled=false",
        "loomai.enabled=false"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TemporaryAiDocumentAccessSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductProjectAttachmentService attachmentService;

    @Test
    void temporaryAiDocumentUrlAllowsProviderHeadAndGetWithoutUserAuthentication() throws Exception {
        byte[] bytes = "# test".getBytes(StandardCharsets.UTF_8);
        when(attachmentService.createAiAccessDocumentDownload(eq("pdoc_test")))
                .thenReturn(new ProductProjectAttachmentService.TemporaryAiDocumentDownload(
                        "brief.md",
                        "text/markdown",
                        bytes,
                        bytes.length
                ));

        mockMvc.perform(head("/api/product-attachments/ai-access/pdoc_test"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"));

        mockMvc.perform(get("/api/product-attachments/ai-access/pdoc_test"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().string("Content-Type", "text/markdown"));
    }
}
