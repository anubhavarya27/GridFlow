
package com.gridflow.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyApprovalRequest(
        @NotBlank(message = "Approval token is required")
        String approvalToken
) {}
