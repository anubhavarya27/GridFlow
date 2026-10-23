package com.gridflow.backend.controller;

import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.service.CustomerService;
import com.gridflow.backend.security.CustomerScope;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {
    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getCustomers() {
        return ApiResponse.success(CustomerScope.isAdministrator()
                ? customerService.getCustomers()
                : customerService.getCustomers(CustomerScope.currentCustomerId()));
    }

    @GetMapping("/{customerId}")
    public ResponseEntity<ApiResponse<?>> getCustomerById(
            @PathVariable int customerId) {
        if (customerId <= 0) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Customer ID must be positive."));
        }

        Map<String, Object> customer = CustomerScope.isAdministrator()
                ? customerService.getCustomerById(customerId)
                : customerService.getCustomerById(
                        customerId, CustomerScope.currentCustomerId());
        if (customer == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Customer not found."));
        }

        return ResponseEntity.ok(ApiResponse.success(customer));
    }
}
