
package com.gridflow.backend.controller;

import com.gridflow.backend.config.JwtAuthenticationFilter.GridFlowPrincipal;
import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.service.OwnershipService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ownerships")
public class OwnershipController {

    private final OwnershipService ownershipService;

    public OwnershipController(OwnershipService ownershipService) {
        this.ownershipService = ownershipService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getOwnerships() {
        if (!isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(
                            "Administrator access is required to view all ownership records."
                    ));
        }

        return ResponseEntity.ok(
                ApiResponse.success(ownershipService.getOwnerships())
        );
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<?>> getOwnershipsByCustomerId(
            @PathVariable int customerId) {

        if (customerId <= 0) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Customer ID must be positive."));
        }

        if (!isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(
                            "Customer ownership access requires a verified user-to-customer mapping."
                    ));
        }

        List<Map<String, Object>> ownerships =
                ownershipService.getOwnershipsByCustomerId(customerId);

        return ResponseEntity.ok(ApiResponse.success(ownerships));
    }

    private boolean isAdmin() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        return authentication.getPrincipal() instanceof GridFlowPrincipal principal
                && "ADMIN".equals(principal.role())
                && authentication.getAuthorities().stream()
                        .anyMatch(authority ->
                                "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
