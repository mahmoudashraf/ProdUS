package com.produs.controller;

import com.produs.dto.PlatformDtos.AdminDashboardResponse;
import com.produs.dto.PlatformDtos.CurrentUserSummary;
import com.produs.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Admin management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class AdminController {

    @GetMapping("/dashboard")
    @Operation(summary = "Get admin dashboard", description = "Returns admin dashboard information")
    @ApiResponse(responseCode = "200", description = "Dashboard data retrieved successfully")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @ApiResponse(responseCode = "403", description = "Forbidden - Admin role required")
    public ResponseEntity<AdminDashboardResponse> getDashboard(
            @AuthenticationPrincipal User admin
    ) {
        return ResponseEntity.ok(new AdminDashboardResponse(
                "Admin dashboard",
                new CurrentUserSummary(admin.getId(), admin.getEmail(), admin.getRole().name())
        ));
    }
}
