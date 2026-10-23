package com.gridflow.backend.dto;

import jakarta.validation.constraints.Size;

public record QueryRejection(@Size(max = 500) String rejectionReason) {
}
