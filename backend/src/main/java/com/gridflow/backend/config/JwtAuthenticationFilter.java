package com.gridflow.backend.config;

import com.gridflow.backend.service.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        try {
            Claims claims = jwtService.validateAccessToken(token);

            String username = claims.getSubject();
            String role = claims.get("role", String.class);
            Object userIdClaim = claims.get("userId");
            Object customerIdClaim = claims.get("customerId");

            if (!(userIdClaim instanceof Number userIdNumber)
                    || username == null || username.isBlank()
                    || userIdNumber.longValue() <= 0
                    || role == null
                    || (!role.equals("ADMIN") && !role.equals("USER"))) {
                sendUnauthorized(response);
                return;
            }

            Integer customerId = null;

            if ("USER".equals(role)) {
                if (!(customerIdClaim instanceof Number customerIdNumber)
                        || customerIdNumber.intValue() <= 0) {
                    sendUnauthorized(response);
                    return;
                }
                customerId = customerIdNumber.intValue();
            }

            GridFlowPrincipal principal = new GridFlowPrincipal(
                    userIdNumber.longValue(),
                    username,
                    role,
                    customerId
            );

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            principal,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    );

            SecurityContextHolder.getContext()
                    .setAuthentication(authentication);

        } catch (JwtException | IllegalArgumentException exception) {
            SecurityContextHolder.clearContext();
            sendUnauthorized(response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void sendUnauthorized(HttpServletResponse response)
            throws IOException {

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write(
                "{\"success\":false,\"message\":\"You are not authenticated.\"}"
        );
    }

    public record GridFlowPrincipal(
            Long userId,
            String username,
            String role,
            Integer customerId) {

        public GridFlowPrincipal(
                Long userId,
                String username,
                String role) {
            this(userId, username, role, null);
        }
    }
}
