package com.gridflow.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record QuerySubmission(
        @NotBlank @Size(max = 10000) String query) {
}
