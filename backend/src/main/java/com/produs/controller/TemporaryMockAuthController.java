package com.produs.controller;

import com.produs.dto.UserDto;
import com.produs.entity.User;
import com.produs.service.MockUserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mock/auth")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.mock-auth", name = "enabled", havingValue = "true", matchIfMissing = false)
@Profile("!dev")
public class TemporaryMockAuthController {

    private final MockUserService mockUserService;

    @Value("${app.mock-auth.expose-credentials:false}")
    private boolean exposeCredentials;

    @GetMapping("/credentials")
    public ResponseEntity<?> credentials() {
        ResponseEntity<Map<String, String>> blocked = blockedIfRuntimeDisabled();
        if (blocked != null) {
            return blocked;
        }
        if (!exposeCredentials) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "error", "Mock credential listing is disabled"
            ));
        }
        List<MockUserService.MockCredentialSummary> credentials = mockUserService.getCredentialSummaries();
        return ResponseEntity.ok(credentials);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        ResponseEntity<Map<String, String>> blocked = blockedIfRuntimeDisabled();
        if (blocked != null) {
            return blocked;
        }
        try {
            return ResponseEntity.ok(mockUserService.mockLogin(request.getEmail(), request.getPassword()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login-as/{role}")
    public ResponseEntity<?> loginAs(@PathVariable String role) {
        ResponseEntity<Map<String, String>> blocked = blockedIfRuntimeDisabled();
        if (blocked != null) {
            return blocked;
        }
        try {
            return ResponseEntity.ok(mockUserService.quickLogin(User.UserRole.valueOf(role.toUpperCase())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role: " + role));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        mockUserService.mockLogout();
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/current")
    public ResponseEntity<UserDto> current(HttpServletRequest request) {
        ResponseEntity<Map<String, String>> blocked = blockedIfRuntimeDisabled();
        if (blocked != null) {
            return ResponseEntity.status(blocked.getStatusCode()).build();
        }
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            return ResponseEntity.ok(mockUserService.getCurrentMockUser(authHeader.substring(7)));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(Map.of(
                "enabled", true,
                "runtimeAllowed", mockUserService.isRuntimeAllowed(),
                "authenticated", mockUserService.isMockAuthenticated()
        ));
    }

    private ResponseEntity<Map<String, String>> blockedIfRuntimeDisabled() {
        if (mockUserService.isRuntimeAllowed()) {
            return null;
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", "Mock authentication is not allowed for the active runtime profile"
        ));
    }

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}
