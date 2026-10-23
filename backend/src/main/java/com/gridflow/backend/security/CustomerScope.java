package com.gridflow.backend.security;

import com.gridflow.backend.config.JwtAuthenticationFilter.GridFlowPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Resolves the authenticated customer's scope; administrators are unscoped. */
public final class CustomerScope {
    private CustomerScope() {}

    public static Integer currentCustomerId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof GridFlowPrincipal principal)) {
            throw new AccessDeniedException("Authentication is required.");
        }
        if ("ADMIN".equals(principal.role())) return null;
        if (!"USER".equals(principal.role()) || principal.customerId() == null
                || principal.customerId() <= 0) {
            throw new AccessDeniedException("A valid customer mapping is required.");
        }
        return principal.customerId();
    }

    public static boolean isAdministrator() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null
                && authentication.getPrincipal() instanceof GridFlowPrincipal principal
                && "ADMIN".equals(principal.role());
    }
}
