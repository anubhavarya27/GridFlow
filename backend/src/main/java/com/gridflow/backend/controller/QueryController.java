package com.gridflow.backend.controller;

import com.gridflow.backend.config.JwtAuthenticationFilter.GridFlowPrincipal;
import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.dto.QueryRejection;
import com.gridflow.backend.dto.QuerySubmission;
import com.gridflow.backend.service.AuthService;
import com.gridflow.backend.service.QueryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class QueryController {
    private final QueryService queries;
    private final AuthService auth;

    public QueryController(QueryService queries, AuthService auth) {
        this.queries = queries;
        this.auth = auth;
    }

    @PostMapping("/query")
    public ResponseEntity<ApiResponse<?>> execute(
            @Valid @RequestBody QuerySubmission submission) {
        try {
            return ResponseEntity.ok(ApiResponse.success(
                    queries.executeOrSubmit(submission.query())));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
    }

    @GetMapping("/query/requests")
    public ApiResponse<List<Map<String, Object>>> requests() {
        return ApiResponse.success(queries.requests());
    }

    @GetMapping("/query/requests/{requestId}")
    public ResponseEntity<ApiResponse<?>> request(@PathVariable long requestId) {
        try {
            Map<String, Object> result = queries.request(requestId);
            return result == null
                    ? ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ApiResponse.error("Query request not found."))
                    : ResponseEntity.ok(ApiResponse.success(result));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(ex.getMessage()));
        }
    }

    @PostMapping("/query/requests/{requestId}/approve")
    public ResponseEntity<ApiResponse<?>> approve(
            @PathVariable long requestId,
            @RequestHeader(value = "X-Approval-Token", required = false) String token) {
        try {
            auth.validateBenchmarkApprovalToken(token);
            return ResponseEntity.ok(ApiResponse.success(
                    queries.approve(requestId, administratorId())));
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(ex.getMessage()));
        }
    }

    @PostMapping("/query/requests/{requestId}/reject")
    public ResponseEntity<ApiResponse<?>> reject(
            @PathVariable long requestId,
            @RequestHeader(value = "X-Approval-Token", required = false) String token,
            @Valid @RequestBody(required = false) QueryRejection rejection) {
        try {
            auth.validateBenchmarkApprovalToken(token);
            String reason = rejection == null ? null : rejection.rejectionReason();
            return ResponseEntity.ok(ApiResponse.success(
                    queries.reject(requestId, administratorId(), reason)));
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(ex.getMessage()));
        }
    }

    private long administratorId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof GridFlowPrincipal principal)
                || principal.userId() == null || !"ADMIN".equals(principal.role())) {
            throw new AccessDeniedException("Administrator access is required.");
        }
        return principal.userId();
    }
}
