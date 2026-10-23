package com.gridflow.backend.service;

import com.gridflow.backend.config.JwtAuthenticationFilter.GridFlowPrincipal;
import com.gridflow.backend.dto.VerifyApprovalRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTests {
    private JwtService jwtService;
    private PasswordEncoder passwordEncoder;
    private AuthService service;

    @BeforeEach
    void setUp() {
        jwtService = mock(JwtService.class);
        passwordEncoder = mock(PasswordEncoder.class);
        service = new AuthService(jwtService, passwordEncoder, "stored-hash");
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAsAdmin(Object principal) {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(
                principal, null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
            )
        );
    }

    @Test
    void validAdminAndPasswordGenerateApprovalToken() {
        authenticateAsAdmin(new GridFlowPrincipal(7L, "admin", "ADMIN"));
        when(passwordEncoder.matches("approval-secret", "stored-hash"))
            .thenReturn(true);
        when(jwtService.generateApprovalToken(7L)).thenReturn("approval-token");

        assertEquals("approval-token",
            service.validateApprovalRequest(
                new VerifyApprovalRequest("approval-secret")));

        verify(jwtService).generateApprovalToken(7L);
    }

    @Test
    void unauthenticatedRequestIsDenied() {
        SecurityContextHolder.clearContext();

        assertThrows(AccessDeniedException.class,
            () -> service.validateApprovalRequest(
                new VerifyApprovalRequest("approval-secret")));

        verifyNoInteractions(passwordEncoder, jwtService);
    }

    @Test
    void nonAdminAuthorityIsDenied() {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(
                new GridFlowPrincipal(7L, "user", "USER"),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
            )
        );

        assertThrows(AccessDeniedException.class,
            () -> service.validateApprovalRequest(
                new VerifyApprovalRequest("approval-secret")));

        verifyNoInteractions(passwordEncoder, jwtService);
    }

    @Test
    void invalidAdminIdentityIsDenied() {
        authenticateAsAdmin(new GridFlowPrincipal(0L, "admin", "ADMIN"));

        assertThrows(AccessDeniedException.class,
            () -> service.validateApprovalRequest(
                new VerifyApprovalRequest("approval-secret")));

        verifyNoInteractions(passwordEncoder, jwtService);
    }

    @Test
    void blankApprovalPasswordIsRejected() {
        authenticateAsAdmin(new GridFlowPrincipal(7L, "admin", "ADMIN"));

        assertThrows(IllegalArgumentException.class,
            () -> service.validateApprovalRequest(
                new VerifyApprovalRequest(" ")));

        verifyNoInteractions(passwordEncoder, jwtService);
    }

    @Test
    void incorrectApprovalPasswordIsRejected() {
        authenticateAsAdmin(new GridFlowPrincipal(7L, "admin", "ADMIN"));
        when(passwordEncoder.matches("wrong", "stored-hash"))
            .thenReturn(false);

        assertThrows(AuthService.InvalidApprovalPasswordException.class,
            () -> service.validateApprovalRequest(
                new VerifyApprovalRequest("wrong")));

        verifyNoInteractions(jwtService);
    }

    @Test
    void missingConfiguredPasswordHashIsRejected() {
        AuthService unconfiguredService =
            new AuthService(jwtService, passwordEncoder, " ");

        authenticateAsAdmin(new GridFlowPrincipal(7L, "admin", "ADMIN"));

        assertThrows(AuthService.InvalidApprovalPasswordException.class,
            () -> unconfiguredService.validateApprovalRequest(
                new VerifyApprovalRequest("approval-secret")));

        verifyNoInteractions(jwtService);
    }
}