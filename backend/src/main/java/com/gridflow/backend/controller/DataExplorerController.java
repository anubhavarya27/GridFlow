package com.gridflow.backend.controller;

import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.service.DataExplorerService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DataExplorerController {
    private final DataExplorerService data;

    public DataExplorerController(DataExplorerService data) {
        this.data = data;
    }

    @GetMapping("/property-meters")
    public ApiResponse<List<Map<String, Object>>> propertyMeters() {
        return list("property-meters");
    }

    @GetMapping("/meter-services")
    public ApiResponse<List<Map<String, Object>>> meterServices() {
        return list("meter-services");
    }

    @GetMapping("/customer-phones")
    public ApiResponse<List<Map<String, Object>>> customerPhones() {
        return list("customer-phones");
    }

    @GetMapping("/customer-emails")
    public ApiResponse<List<Map<String, Object>>> customerEmails() {
        return list("customer-emails");
    }

    @GetMapping("/payment-schedules")
    public ApiResponse<List<Map<String, Object>>> paymentSchedules() {
        return list("payment-schedules");
    }

    @GetMapping("/card-payments/cards")
    public ApiResponse<List<Map<String, Object>>> cards() {
        return list("cards");
    }

    @GetMapping("/card-payments")
    public ApiResponse<List<Map<String, Object>>> cardPayments() {
        return list("card-payments");
    }

    @GetMapping("/cash-payments")
    public ApiResponse<List<Map<String, Object>>> cashPayments() {
        return list("cash-payments");
    }

    @GetMapping("/upi-payments")
    public ApiResponse<List<Map<String, Object>>> upiPayments() {
        return list("upi-payments");
    }

    @GetMapping("/electricity-services")
    public ApiResponse<List<Map<String, Object>>> electricityServices() {
        return list("electricity-services");
    }

    @GetMapping("/water-services")
    public ApiResponse<List<Map<String, Object>>> waterServices() {
        return list("water-services");
    }

    private ApiResponse<List<Map<String, Object>>> list(String resource) {
        return ApiResponse.success(data.list(resource));
    }
}
