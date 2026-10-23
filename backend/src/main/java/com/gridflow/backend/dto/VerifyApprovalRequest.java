
package com.gridflow.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyApprovalRequest(

        @NotBlank(message = "Approval password is required")
        String approvalPassword

) {}
