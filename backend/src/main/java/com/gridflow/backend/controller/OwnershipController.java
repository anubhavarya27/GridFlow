
package com.gridflow.backend.controller;

import com.gridflow.backend.config.JwtAuthenticationFilter.GridFlowPrincipal;
import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.service.OwnershipService;
import com.gridflow.backend.security.CustomerScope;
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
        Integer customerId = CustomerScope.currentCustomerId();
        if (customerId != null) return ResponseEntity.ok(ApiResponse.success(
                ownershipService.getOwnershipsByCustomerId(customerId)));
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

        Integer customerScope = CustomerScope.currentCustomerId();
        if (customerScope != null && customerScope != customerId) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(
                            "You cannot access another customer's ownership records."
                    ));
        }

        List<Map<String, Object>> ownerships =
                ownershipService.getOwnershipsByCustomerId(customerId);

        return ResponseEntity.ok(ApiResponse.success(ownerships));
    }

}
