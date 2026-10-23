package com.gridflow.backend.controller;

import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.service.OwnershipService;
import org.springframework.http.ResponseEntity;
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
    public ApiResponse<List<Map<String, Object>>> getOwnerships() {
        return ApiResponse.success(ownershipService.getOwnerships());
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<?>> getOwnershipsByCustomerId(
            @PathVariable int customerId) {
        if (customerId <= 0) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Customer ID must be positive."));
        }

        return ResponseEntity.ok(
                ApiResponse.success(
                        ownershipService.getOwnershipsByCustomerId(customerId)));
    }
}