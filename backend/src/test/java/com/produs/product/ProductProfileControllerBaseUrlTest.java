package com.produs.product;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class ProductProfileControllerBaseUrlTest {

    private final ProductProfileController controller = new ProductProfileController(null, null);

    @Test
    void apiBaseUrlUsesConfiguredPublicUrlWhenAvailable() {
        ReflectionTestUtils.setField(controller, "publicApiBaseUrl", "https://produs-api.example.com/");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setScheme("http");
        request.setServerName("backend");
        request.setServerPort(8080);

        assertThat(controller.apiBaseUrl(request)).isEqualTo("https://produs-api.example.com");
    }

    @Test
    void apiBaseUrlForcesHttpsForPublicForwardedHost() {
        ReflectionTestUtils.setField(controller, "publicApiBaseUrl", "");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-Proto", "http");
        request.addHeader("X-Forwarded-Host", "produs-api-staging.46.224.145.148.sslip.io");
        request.setScheme("http");
        request.setServerName("backend");
        request.setServerPort(8080);

        assertThat(controller.apiBaseUrl(request))
                .isEqualTo("https://produs-api-staging.46.224.145.148.sslip.io");
    }

    @Test
    void apiBaseUrlKeepsHttpForLocalDevelopment() {
        ReflectionTestUtils.setField(controller, "publicApiBaseUrl", "");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setScheme("http");
        request.setServerName("localhost");
        request.setServerPort(8080);

        assertThat(controller.apiBaseUrl(request)).isEqualTo("http://localhost:8080");
    }
}
