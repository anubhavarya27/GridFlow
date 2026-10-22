
package com.gridflow.backend.service;

import com.gridflow.backend.dto.LoginRequest;
import com.gridflow.backend.dto.VerifyApprovalRequest;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    public void validateLoginRequest(LoginRequest request) {
        // Credential verification will be implemented when the
        // database schema and authentication rules are confirmed.
        throw new UnsupportedOperationException(
                "Authentication is not configured yet"
        );
    }

    public void validateApprovalRequest(VerifyApprovalRequest request) {
        // Approval-token verification will be implemented alongside
        // the agreed approval workflow.
        throw new UnsupportedOperationException(
                "Approval verification is not configured yet"
        );
    }
}
