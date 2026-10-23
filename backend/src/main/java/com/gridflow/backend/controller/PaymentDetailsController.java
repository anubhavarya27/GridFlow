package com.gridflow.backend.controller;

import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.service.PaymentDetailsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment-details")
public class PaymentDetailsController {
    private final PaymentDetailsService paymentDetailsService;

    public PaymentDetailsController(PaymentDetailsService paymentDetailsService) {
        this.paymentDetailsService = paymentDetailsService;
    }

    @GetMapping("/{resource}")
    public ResponseEntity<ApiResponse<?>> getResource(
            @PathVariable String resource) {

        try {
            List<Map<String, Object>> rows =
                paymentDetailsService.getTableRows(resource);

            return ResponseEntity.ok(ApiResponse.success(rows));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Unsupported payment resource."));
        }
    }
}