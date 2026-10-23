
package com.gridflow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record LoginRequest(

        @NotBlank(message = "Username is required")
        String username,

        @NotBlank(message = "Password is required")
        String password,

        @NotBlank(message = "Role is required")
        @Pattern(
                regexp = "(?i)ADMIN|USER",
                message = "Role must be ADMIN or USER"
        )
        String role

) {}
