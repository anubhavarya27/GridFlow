
package com.gridflow.backend.service;

import com.gridflow.backend.config.JwtAuthenticationFilter.GridFlowPrincipal;
import com.gridflow.backend.dto.LoginRequest;
import com.gridflow.backend.dto.VerifyApprovalRequest;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final String approvalPasswordHash;

    public AuthService(
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            @Value("${gridflow.approval.password-hash}")
            String approvalPasswordHash) {
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.approvalPasswordHash = approvalPasswordHash;
    }

    public void validateLoginRequest(LoginRequest request) {
        throw new UnsupportedOperationException(
                "Login requires database-backed account verification."
        );
    }

    public String validateApprovalRequest(VerifyApprovalRequest request) {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !authentication.getAuthorities().stream()
                        .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()))) {
            throw new AccessDeniedException(
                    "Administrator access is required."
            );
        }

        if (!(authentication.getPrincipal() instanceof GridFlowPrincipal principal)
                || principal.userId() == null
                || principal.userId() <= 0
                || !"ADMIN".equals(principal.role())) {
            throw new AccessDeniedException(
                    "A valid administrator identity is required."
            );
        }

        if (request == null
                || request.approvalPassword() == null
                || request.approvalPassword().isBlank()) {
            throw new IllegalArgumentException(
                    "Approval password is required."
            );
        }

        if (approvalPasswordHash == null
                || approvalPasswordHash.isBlank()
                || !passwordEncoder.matches(
                        request.approvalPassword(),
                        approvalPasswordHash)) {
            throw new InvalidApprovalPasswordException();
        }

        return jwtService.generateApprovalToken(principal.userId());
    }

    public static class InvalidApprovalPasswordException
            extends RuntimeException {
        public InvalidApprovalPasswordException() {
            super("Invalid approval password.");
        }
    }
}
