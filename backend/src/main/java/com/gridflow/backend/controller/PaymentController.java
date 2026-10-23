package com.gridflow.backend.controller;

import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.service.PaymentService;
import com.gridflow.backend.security.CustomerScope;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getPayments() {
        return ApiResponse.success(CustomerScope.isAdministrator()
                ? paymentService.getPayments()
                : paymentService.getPayments(CustomerScope.currentCustomerId()));
    }

    @GetMapping("/bill/{billId}")
    public ResponseEntity<ApiResponse<?>> getPaymentsByBillId(
            @PathVariable int billId) {
        if (billId <= 0) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Bill ID must be positive."));
        }

        return ResponseEntity.ok(
                ApiResponse.success(CustomerScope.isAdministrator()
                        ? paymentService.getPaymentsByBillId(billId)
                        : paymentService.getPaymentsByBillId(
                                billId, CustomerScope.currentCustomerId())));
    }
}
