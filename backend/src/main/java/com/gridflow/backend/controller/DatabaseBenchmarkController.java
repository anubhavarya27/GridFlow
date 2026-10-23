
package com.gridflow.backend.controller;

import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.dto.database.BenchmarkRunRequest;
import com.gridflow.backend.service.AuthService;
import com.gridflow.backend.service.DatabaseBenchmarkService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/database/benchmarks")
public class DatabaseBenchmarkController {

    private final DatabaseBenchmarkService service;
    private final AuthService authService;

    public DatabaseBenchmarkController(
            DatabaseBenchmarkService service,
            AuthService authService) {
        this.service = service;
        this.authService = authService;
    }

    @PostMapping("/run")
    public ResponseEntity<ApiResponse<?>> run(
            @RequestHeader(
                    value = "X-Approval-Token",
                    required = false) String approvalToken,
            @RequestBody(required = false) BenchmarkRunRequest request) {
        try {
            authService.validateBenchmarkApprovalToken(approvalToken);

            return ResponseEntity.ok(
                    ApiResponse.success(service.run(request)));
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(ex.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<?>> history(
            @RequestParam(defaultValue = "20") int limit) {
        if (limit < 1 || limit > 100) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(
                            "limit must be between 1 and 100."));
        }

        return ResponseEntity.ok(
                ApiResponse.success(service.history(limit)));
    }
}
