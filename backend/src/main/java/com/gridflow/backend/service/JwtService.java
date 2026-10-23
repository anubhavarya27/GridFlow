
package com.gridflow.backend.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long accessExpirationMs;
    private final long approvalExpirationMs;

    public JwtService(
            @Value("${gridflow.jwt.secret}") String secret,
            @Value("${gridflow.jwt.access-expiration-ms}") long accessExpirationMs,
            @Value("${gridflow.jwt.approval-expiration-ms}") long approvalExpirationMs) {

        byte[] keyBytes = Decoders.BASE64.decode(secret);

        if (keyBytes.length < 32) {
            throw new IllegalArgumentException(
                    "JWT signing secret must contain at least 32 bytes");
        }

        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessExpirationMs = accessExpirationMs;
        this.approvalExpirationMs = approvalExpirationMs;
    }

    public String generateAccessToken(long userId, String username, String role) {
        Date now = new Date();

        return Jwts.builder()
                .subject(username)
                .claim("userId", userId)
                .claim("role", role.toUpperCase())
                .claim("tokenType", "access")
                .issuedAt(now)
                .expiration(new Date(now.getTime() + accessExpirationMs))
                .signWith(signingKey)
                .compact();
    }

    public String generateApprovalToken(long adminUserId) {
        Date now = new Date();

        return Jwts.builder()
                .subject(Long.toString(adminUserId))
                .claim("userId", adminUserId)
                .claim("role", "ADMIN")
                .claim("tokenType", "approval")
                .claim("scope", "query:approve")
                .id(UUID.randomUUID().toString())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + approvalExpirationMs))
                .signWith(signingKey)
                .compact();
    }

    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Claims validateAccessToken(String token) {
        Claims claims = validateToken(token);

        if (!"access".equals(claims.get("tokenType", String.class))) {
            throw new JwtException("Invalid access token type");
        }

        return claims;
    }

    public Claims validateApprovalToken(String token) {
        Claims claims = validateToken(token);

        if (!"approval".equals(claims.get("tokenType", String.class))
                || !"ADMIN".equals(claims.get("role", String.class))
                || !"query:approve".equals(claims.get("scope", String.class))) {
            throw new JwtException("Invalid approval token scope or type");
        }

        return claims;
    }
}
