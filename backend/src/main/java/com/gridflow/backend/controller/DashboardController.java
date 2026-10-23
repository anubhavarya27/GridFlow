package com.gridflow.backend.controller;

import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public ApiResponse<Map<String, Object>> getSummary() {
        return ApiResponse.success(dashboardService.getSummary());
    }

    @GetMapping("/bill-status")
    public ApiResponse<List<Map<String, Object>>> getBillStatus() {
        return ApiResponse.success(dashboardService.getBillStatus());
    }

    @GetMapping("/payment-methods")
    public ApiResponse<List<Map<String, Object>>> getPaymentMethods() {
        return ApiResponse.success(dashboardService.getPaymentMethods());
    }

    @GetMapping("/consumption")
    public ApiResponse<List<Map<String, Object>>> getConsumption() {
        return ApiResponse.success(dashboardService.getConsumption());
    }

    @GetMapping("/revenue")
    public ApiResponse<List<Map<String, Object>>> getRevenue() {
        return ApiResponse.success(dashboardService.getRevenue());
    }
}