package com.gridflow.backend.controller;

import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.service.BillService;
import com.gridflow.backend.security.CustomerScope;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bills")
public class BillController {

    private final BillService billService;

    public BillController(BillService billService) {
        this.billService = billService;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getBills() {
        return ApiResponse.success(CustomerScope.isAdministrator()
                ? billService.getBills()
                : billService.getBills(CustomerScope.currentCustomerId()));
    }

    @GetMapping("/{billId}")
    public ResponseEntity<ApiResponse<?>> getBillById(
            @PathVariable int billId) {

        if (billId <= 0) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Bill ID must be positive."));
        }

        Map<String, Object> bill = CustomerScope.isAdministrator()
                ? billService.getBillById(billId)
                : billService.getBillById(billId, CustomerScope.currentCustomerId());

        if (bill == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Bill not found."));
        }

        return ResponseEntity.ok(ApiResponse.success(bill));
    }
}
