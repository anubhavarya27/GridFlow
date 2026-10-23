package com.gridflow.backend.controller;

import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.service.DashboardService;
import com.gridflow.backend.security.CustomerScope;
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
        return ApiResponse.success(CustomerScope.isAdministrator()
                ? dashboardService.getSummary()
                : dashboardService.getSummary(CustomerScope.currentCustomerId()));
    }

    @GetMapping("/bill-status")
    public ApiResponse<List<Map<String, Object>>> getBillStatus() {
        return ApiResponse.success(CustomerScope.isAdministrator()
                ? dashboardService.getBillStatus()
                : dashboardService.getBillStatus(CustomerScope.currentCustomerId()));
    }

    @GetMapping("/payment-methods")
    public ApiResponse<List<Map<String, Object>>> getPaymentMethods() {
        return ApiResponse.success(CustomerScope.isAdministrator()
                ? dashboardService.getPaymentMethods()
                : dashboardService.getPaymentMethods(CustomerScope.currentCustomerId()));
    }

    @GetMapping("/consumption")
    public ApiResponse<List<Map<String, Object>>> getConsumption() {
        return ApiResponse.success(CustomerScope.isAdministrator()
                ? dashboardService.getConsumption()
                : dashboardService.getConsumption(CustomerScope.currentCustomerId()));
    }

    @GetMapping("/revenue")
    public ApiResponse<List<Map<String, Object>>> getRevenue() {
        return ApiResponse.success(CustomerScope.isAdministrator()
                ? dashboardService.getRevenue()
                : dashboardService.getRevenue(CustomerScope.currentCustomerId()));
    }

    @GetMapping("/top-meters")
    public ApiResponse<List<Map<String, Object>>> getTopMeters() {
        return ApiResponse.success(CustomerScope.isAdministrator()
                ? dashboardService.getTopMeters()
                : dashboardService.getTopMeters(CustomerScope.currentCustomerId()));
    }

    @GetMapping("/customer-summary")
    public ApiResponse<List<Map<String, Object>>> getCustomerSummary() {
        return ApiResponse.success(CustomerScope.isAdministrator()
                ? dashboardService.getCustomerSummary()
                : dashboardService.getCustomerSummary(CustomerScope.currentCustomerId()));
    }

    @GetMapping("/service-distribution")
    public ApiResponse<List<Map<String, Object>>> getServiceDistribution() {
        return ApiResponse.success(CustomerScope.isAdministrator()
                ? dashboardService.getServiceDistribution()
                : dashboardService.getServiceDistribution(CustomerScope.currentCustomerId()));
    }

    @GetMapping("/meter-status")
    public ApiResponse<List<Map<String, Object>>> getMeterStatus() {
        return ApiResponse.success(CustomerScope.isAdministrator()
                ? dashboardService.getMeterStatus()
                : dashboardService.getMeterStatus(CustomerScope.currentCustomerId()));
    }
}
