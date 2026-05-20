package com.produs.service;

import com.produs.dto.UserDto;
import com.produs.entity.User;
import com.produs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.mock-auth", name = "enabled", havingValue = "true", matchIfMissing = false)
public class MockUserService {

    private final UserRepository userRepository;
    private final Environment environment;

    @Value("${app.mock-auth.allowed-profiles:dev,staging}")
    private String allowedProfiles;

    @Value("${app.mock-auth.allow-production-profile:false}")
    private boolean allowProductionProfile;
    
    // In-memory storage for mock users and sessions
    private final Map<String, User> mockUsers = new ConcurrentHashMap<>();
    private final Map<String, String> mockSessions = new ConcurrentHashMap<>(); // token -> userId
    private String currentMockUserId = null;

    // Mock user credentials
    private final Map<String, MockCredentials> mockCredentials = new ConcurrentHashMap<>();
    
    {
        mockCredentials.put("admin@produs.com", new MockCredentials("admin@produs.com", "admin123", User.UserRole.ADMIN));
        mockCredentials.put("owner@produs.com", new MockCredentials("owner@produs.com", "owner123", User.UserRole.PRODUCT_OWNER));
        mockCredentials.put("team@produs.com", new MockCredentials("team@produs.com", "team123", User.UserRole.TEAM_MANAGER));
        mockCredentials.put("specialist@produs.com", new MockCredentials("specialist@produs.com", "specialist123", User.UserRole.SPECIALIST));
        mockCredentials.put("advisor@produs.com", new MockCredentials("advisor@produs.com", "advisor123", User.UserRole.ADVISOR));
    }

    @PostConstruct
    public void initializeMockUsers() {
        log.warn("Mock authentication is enabled. This must only be used for local development or temporary staging validation.");
        
        // Create mock users - same as UsersFeedService for consistency
        createMockUser("mock-admin-001", "admin@produs.com", "Admin", "User", User.UserRole.ADMIN);
        createMockUser("mock-owner-001", "owner@produs.com", "Product", "Owner", User.UserRole.PRODUCT_OWNER);
        createMockUser("mock-team-001", "team@produs.com", "Team", "Manager", User.UserRole.TEAM_MANAGER);
        createMockUser("mock-specialist-001", "specialist@produs.com", "Service", "Specialist", User.UserRole.SPECIALIST);
        createMockUser("mock-advisor-001", "advisor@produs.com", "Platform", "Advisor", User.UserRole.ADVISOR);
        
        log.info("Initialized {} mock users", mockUsers.size());
    }


    private void createMockUser(String id, String email, String firstName, String lastName, User.UserRole role) {
        // Use deterministic UUID based on email to match database users
        UUID userId = UUID.nameUUIDFromBytes(("mock-user-" + email).getBytes());
        
        User user = User.builder()
                .id(userId)
                .email(email)
                .firstName(firstName)
                .lastName(lastName)
                .role(role)
                .supabaseId("mock-supabase-" + id)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        mockUsers.put(user.getId().toString(), user);
    }

    public List<UserDto> getAllMockUsers() {
        return mockUsers.values().stream()
                .map(this::convertToDto)
                .sorted(Comparator.comparing(UserDto::getEmail))
                .toList();
    }

    public List<MockCredentialSummary> getCredentialSummaries() {
        return mockCredentials.values().stream()
                .sorted(Comparator.comparing(credentials -> credentials.role.name()))
                .map(credentials -> new MockCredentialSummary(
                        credentials.email,
                        credentials.password,
                        credentials.role,
                        switch (credentials.role) {
                            case ADMIN -> "Platform admin";
                            case PRODUCT_OWNER -> "Product owner";
                            case TEAM_MANAGER -> "Team manager";
                            case SPECIALIST -> "Team specialist";
                            case ADVISOR -> "Advisor";
                        }
                ))
                .toList();
    }

    public List<UserDto> getMockUsersByRole(User.UserRole role) {
        return mockUsers.values().stream()
                .filter(user -> user.getRole() == role)
                .map(this::convertToDto)
                .sorted(Comparator.comparing(UserDto::getEmail))
                .toList();
    }

    public Map<String, Object> mockLogin(String email, String password) {
        assertRuntimeAllowed();
        MockCredentials credentials = mockCredentials.get(email);
        
        if (credentials == null || !credentials.password.equals(password)) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        // Find the mock user
        User user = mockUsers.values().stream()
                .filter(u -> u.getEmail().equals(email))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Mock user not found"));

        // Generate mock token
        String token = generateMockToken(user);
        ensureDatabaseUser(user);
        
        // Store session
        mockSessions.put(token, user.getId().toString());
        currentMockUserId = user.getId().toString();

        log.info("Mock login successful for user: {}", email);

        return Map.of(
            "user", convertToDto(user),
            "token", token,
            "message", "Mock login successful"
        );
    }

    public Map<String, Object> quickLogin(User.UserRole role) {
        assertRuntimeAllowed();
        User user = mockUsers.values().stream()
                .filter(u -> u.getRole() == role)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No mock user found with role: " + role));

        MockCredentials credentials = mockCredentials.get(user.getEmail());
        if (credentials == null) {
            throw new IllegalArgumentException("No credentials found for user: " + user.getEmail());
        }

        return mockLogin(user.getEmail(), credentials.password);
    }

    public void mockLogout() {
        if (currentMockUserId != null) {
            // Remove all sessions for current user
            mockSessions.entrySet().removeIf(entry -> entry.getValue().equals(currentMockUserId));
            currentMockUserId = null;
            log.info("Mock logout successful");
        }
    }

    public UserDto getCurrentMockUser() {
        // This method should not be used directly - use getCurrentMockUser(String token) instead
        throw new UnsupportedOperationException("Use getCurrentMockUser(String token) instead");
    }
    
    public UserDto getCurrentMockUser(String token) {
        String userId = mockSessions.get(token);
        if (userId == null) {
            throw new IllegalStateException("Invalid or expired mock token");
        }

        User user = mockUsers.get(userId);
        if (user == null) {
            throw new IllegalStateException("Mock user not found for token");
        }

        return convertToDto(user);
    }

    public User getAuthenticatedUser(String token) {
        UserDto userDto = getCurrentMockUser(token);
        return userRepository.findByEmail(userDto.getEmail())
                .orElseGet(() -> ensureDatabaseUser(getMockUserById(userDto.getId().toString())));
    }
    
    public User getMockUserById(String userId) {
        User user = mockUsers.get(userId);
        if (user == null) {
            throw new IllegalStateException("Mock user not found for ID: " + userId);
        }
        return user;
    }

    public boolean isMockAuthenticated() {
        return currentMockUserId != null && mockUsers.containsKey(currentMockUserId);
    }

    public boolean isRuntimeAllowed() {
        Set<String> activeProfiles = new HashSet<>(Arrays.asList(environment.getActiveProfiles()));
        if (activeProfiles.isEmpty()) {
            activeProfiles.add("default");
        }
        if (activeProfiles.contains("prod") && !allowProductionProfile) {
            return false;
        }

        Set<String> allowed = Arrays.stream(allowedProfiles.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(java.util.stream.Collectors.toSet());
        return allowed.contains("*") || activeProfiles.stream().anyMatch(allowed::contains);
    }

    public void assertRuntimeAllowed() {
        if (!isRuntimeAllowed()) {
            throw new IllegalStateException("Mock authentication is not allowed for the active runtime profile");
        }
    }

    public UserDto createMockUser(com.produs.controller.MockUserController.CreateMockUserRequest request) {
        assertRuntimeAllowed();
        // Validate role
        User.UserRole role;
        try {
            role = User.UserRole.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + request.getRole());
        }

        // Check if email already exists
        boolean emailExists = mockUsers.values().stream()
                .anyMatch(user -> user.getEmail().equals(request.getEmail()));
        
        if (emailExists) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        // Create new mock user
        String id = "mock-user-" + System.currentTimeMillis();
        User user = User.builder()
                .id(UUID.randomUUID())
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(role)
                .supabaseId("mock-supabase-" + id)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        mockUsers.put(id, user);

        // Add credentials
        mockCredentials.put(request.getEmail(), new MockCredentials(
            request.getEmail(), 
            request.getPassword(), 
            role
        ));

        log.info("Created mock user: {}", request.getEmail());
        return convertToDto(user);
    }

    public void deleteMockUser(String id) {
        assertRuntimeAllowed();
        User user = mockUsers.remove(id);
        if (user == null) {
            throw new IllegalArgumentException("Mock user not found: " + id);
        }

        // Remove credentials
        mockCredentials.remove(user.getEmail());

        // Remove sessions
        mockSessions.entrySet().removeIf(entry -> entry.getValue().equals(id));

        // Clear current user if it's the deleted user
        if (id.equals(currentMockUserId)) {
            currentMockUserId = null;
        }

        log.info("Deleted mock user: {}", user.getEmail());
    }

    public UserDto convertToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .supabaseId(user.getSupabaseId())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private String generateMockToken(User user) {
        // Simple mock token generation
        return "mock-token-" + user.getId().toString().replace("-", "") + "-" + System.currentTimeMillis();
    }

    private User ensureDatabaseUser(User mockUser) {
        return userRepository.findByEmail(mockUser.getEmail())
                .map(existing -> {
                    boolean changed = false;
                    if (existing.getRole() != mockUser.getRole()) {
                        existing.setRole(mockUser.getRole());
                        changed = true;
                    }
                    if (existing.getSupabaseId() == null || existing.getSupabaseId().isBlank()) {
                        existing.setSupabaseId(mockUser.getSupabaseId());
                        changed = true;
                    }
                    if (existing.getFirstName() == null || existing.getFirstName().isBlank()) {
                        existing.setFirstName(mockUser.getFirstName());
                        changed = true;
                    }
                    if (existing.getLastName() == null || existing.getLastName().isBlank()) {
                        existing.setLastName(mockUser.getLastName());
                        changed = true;
                    }
                    return changed ? userRepository.save(existing) : existing;
                })
                .orElseGet(() -> userRepository.save(User.builder()
                        .email(mockUser.getEmail())
                        .firstName(mockUser.getFirstName())
                        .lastName(mockUser.getLastName())
                        .role(mockUser.getRole())
                        .supabaseId(mockUser.getSupabaseId())
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build()));
    }

    // Helper class for credentials
    private static class MockCredentials {
        final String email;
        final String password;
        final User.UserRole role;

        MockCredentials(String email, String password, User.UserRole role) {
            this.email = email;
            this.password = password;
            this.role = role;
        }
    }

    public record MockCredentialSummary(
            String email,
            String password,
            User.UserRole role,
            String label
    ) {}

}
