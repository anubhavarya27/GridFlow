package com.gridflow.backend.controller;

import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.service.ReportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService reports;

    public ReportController(ReportService reports) {
        this.reports = reports;
    }

    @GetMapping("/overview")
    public ApiResponse<Map<String, Object>> overview() {
        return ApiResponse.success(reports.overview());
    }

    @GetMapping("/monthly")
    public ApiResponse<Map<String, Object>> monthly() {
        return ApiResponse.success(reports.monthly());
    }

    @GetMapping("/bill-status")
    public ApiResponse<List<Map<String, Object>>> billStatus() {
        return ApiResponse.success(reports.billStatus());
    }

    @GetMapping("/payment-methods")
    public ApiResponse<List<Map<String, Object>>> paymentMethods() {
        return ApiResponse.success(reports.paymentMethods());
    }

    @GetMapping("/top-meters")
    public ApiResponse<List<Map<String, Object>>> topMeters() {
        return ApiResponse.success(reports.topMeters());
    }
}
