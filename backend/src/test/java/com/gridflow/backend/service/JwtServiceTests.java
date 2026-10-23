
package com.gridflow.backend.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.security.SecureRandom;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTests {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        byte[] secret = new byte[32];
        new SecureRandom().nextBytes(secret);

        jwtService = new JwtService(
                Base64.getEncoder().encodeToString(secret),
                3_600_000L,
                300_000L
        );
    }

    @Test
    void accessTokenContainsExpectedIdentityAndRole() {
        String token = jwtService.generateAccessToken(7L, "admin", "ADMIN");

        Claims claims = jwtService.validateAccessToken(token);

        assertEquals("admin", claims.getSubject());
        assertEquals(7, ((Number) claims.get("userId")).longValue());
        assertEquals("ADMIN", claims.get("role"));
        assertEquals("access", claims.get("tokenType"));
    }

    @Test
    void approvalTokenHasExpectedScope() {
        String token = jwtService.generateApprovalToken(7L);

        Claims claims = jwtService.validateApprovalToken(token);

        assertEquals("7", claims.getSubject());
        assertEquals("ADMIN", claims.get("role"));
        assertEquals("approval", claims.get("tokenType"));
        assertEquals("query:approve", claims.get("scope"));
    }

    @Test
    void accessTokenCannotBeUsedAsApprovalToken() {
        String token = jwtService.generateAccessToken(7L, "admin", "ADMIN");

        assertThrows(
                JwtException.class,
                () -> jwtService.validateApprovalToken(token)
        );
    }

    @Test
    void approvalTokenCannotBeUsedAsAccessToken() {
        String token = jwtService.generateApprovalToken(7L);

        assertThrows(
                JwtException.class,
                () -> jwtService.validateAccessToken(token)
        );
    }

    @Test
    void tamperedTokenIsRejected() {
        String token = jwtService.generateAccessToken(7L, "admin", "ADMIN");
        String tamperedToken = token + "tampered";

        assertThrows(
                JwtException.class,
                () -> jwtService.validateAccessToken(tamperedToken)
        );
    }
}
