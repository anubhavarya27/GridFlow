
package com.gridflow.backend.controller;

import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.dto.LoginRequest;
import com.gridflow.backend.dto.VerifyApprovalRequest;
import com.gridflow.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<ApiResponse<Void>> login(
            @Valid @RequestBody LoginRequest request) {

        authService.validateLoginRequest(request);

        return ResponseEntity.ok(
                ApiResponse.error(
                        "Login requires database-backed account verification."
                )
        );
    }

    @PostMapping("/verify-approval")
    public ResponseEntity<ApiResponse<?>> verifyApproval(
            @Valid @RequestBody VerifyApprovalRequest request) {

        String approvalToken =
                authService.validateApprovalRequest(request);

        return ResponseEntity.ok(
                ApiResponse.success(
                        Map.of("approvalToken", approvalToken)
                )
        );
    }
}
