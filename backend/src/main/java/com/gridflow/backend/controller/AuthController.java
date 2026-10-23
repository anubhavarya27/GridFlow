package com.gridflow.backend.controller;

import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.dto.LoginRequest;
import com.gridflow.backend.dto.VerifyApprovalRequest;
import com.gridflow.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<?>> login(
            @Valid @RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(
                    ApiResponse.success(
                            authService.validateLoginRequest(request)
                    )
            );
        } catch (AuthService.InvalidCredentialsException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(ex.getMessage()));
        } catch (AuthService.AccountNotActiveException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(ex.getMessage()));
        }
    }

    @PostMapping("/verify-approval")
    public ResponseEntity<ApiResponse<?>> verifyApproval(
            @Valid @RequestBody VerifyApprovalRequest request) {
        try {
            String approvalToken = authService.validateApprovalRequest(request);
            return ResponseEntity.ok(
                    ApiResponse.success(Map.of("approvalToken", approvalToken))
            );
        } catch (AuthService.InvalidApprovalPasswordException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(ex.getMessage()));
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(ex.getMessage()));
        }
    }
}