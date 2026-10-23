
package com.gridflow.backend.service;

import com.gridflow.backend.config.JwtAuthenticationFilter.GridFlowPrincipal;
import com.gridflow.backend.dto.LoginRequest;
import com.gridflow.backend.dto.VerifyApprovalRequest;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Map;

@Service
public class AuthService {

    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;
    private final String approvalPasswordHash;

    public AuthService(
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbcTemplate,
            @Value("${gridflow.approval.password-hash}")
            String approvalPasswordHash) {
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
        this.approvalPasswordHash = approvalPasswordHash;
    }

    public Map<String, Object> validateLoginRequest(LoginRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Login request is required.");
        }

        String requestedUsername = request.username().trim();
        String requestedRole = request.role().trim().toUpperCase(Locale.ROOT);

        Map<String, Object> user;
        try {
            user = jdbcTemplate.queryForMap("""
                    SELECT user_id, username, password_hash, role, account_status
                    FROM app_user
                    WHERE LOWER(username) = LOWER(?)
                    """, requestedUsername);
        } catch (EmptyResultDataAccessException ex) {
            throw new InvalidCredentialsException();
        }

        String passwordHash = (String) user.get("password_hash");
        String actualRole =
                ((String) user.get("role")).toUpperCase(Locale.ROOT);
        String accountStatus =
                ((String) user.get("account_status")).toUpperCase(Locale.ROOT);

        if (!passwordEncoder.matches(request.password(), passwordHash)) {
            throw new InvalidCredentialsException();
        }

        if (!"ACTIVE".equals(accountStatus)) {
            throw new AccountNotActiveException();
        }

        if (!actualRole.equals(requestedRole)) {
            throw new InvalidCredentialsException();
        }

        long userId = ((Number) user.get("user_id")).longValue();
        String username = (String) user.get("username");
        String accessToken =
                jwtService.generateAccessToken(userId, username, actualRole);

        return Map.of(
                "accessToken", accessToken,
                "tokenType", "Bearer",
                "userId", userId,
                "username", username,
                "role", actualRole
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
                    "Administrator access is required.");
        }

        if (!(authentication.getPrincipal()
                instanceof GridFlowPrincipal principal)
                || principal.userId() == null
                || principal.userId() <= 0
                || !"ADMIN".equals(principal.role())) {
            throw new AccessDeniedException(
                    "A valid administrator identity is required.");
        }

        if (request == null
                || request.approvalPassword() == null
                || request.approvalPassword().isBlank()) {
            throw new IllegalArgumentException(
                    "Approval password is required.");
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

    /**
     * Requires a valid approval token issued to the currently authenticated
     * administrator and confirms that the administrator remains active.
     */
    public void validateBenchmarkApprovalToken(String token) {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (token == null || token.isBlank()
                || authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal()
                        instanceof GridFlowPrincipal principal)
                || principal.userId() == null
                || principal.userId() <= 0
                || !"ADMIN".equals(principal.role())
                || authentication.getAuthorities().stream()
                        .noneMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()))) {
            throw new AccessDeniedException(
                    "Administrator approval is required.");
        }

        Claims claims;
        try {
            claims = jwtService.validateApprovalToken(token);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new AccessDeniedException(
                    "Invalid or expired approval token.");
        }

        Object tokenUserId = claims.get("userId");
        if (!(tokenUserId instanceof Number id)
                || id.longValue() != principal.userId()) {
            throw new AccessDeniedException(
                    "Approval token does not match the current administrator.");
        }

        try {
            Map<String, Object> user = jdbcTemplate.queryForMap("""
                    SELECT role, account_status
                    FROM app_user
                    WHERE user_id = ?
                    """, principal.userId());

            if (!"ADMIN".equals(user.get("role"))
                    || !"ACTIVE".equals(user.get("account_status"))) {
                throw new AccessDeniedException(
                        "Administrator account is not active.");
            }
        } catch (EmptyResultDataAccessException ex) {
            throw new AccessDeniedException(
                    "Administrator account was not found.");
        }
    }

    public static class InvalidCredentialsException
            extends RuntimeException {
        public InvalidCredentialsException() {
            super("Invalid username, password, or role.");
        }
    }

    public static class AccountNotActiveException
            extends RuntimeException {
        public AccountNotActiveException() {
            super("This account is not active.");
        }
    }

    public static class InvalidApprovalPasswordException
            extends RuntimeException {
        public InvalidApprovalPasswordException() {
            super("Invalid approval password.");
        }
    }
}
