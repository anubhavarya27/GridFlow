package com.gridflow.backend.controller;

import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.service.UtilityServiceService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/services")
public class UtilityServiceController {
    private final UtilityServiceService service;

    public UtilityServiceController(UtilityServiceService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getUtilityServices() {
        return ApiResponse.success(service.getUtilityServices());
    }

    @GetMapping("/electricity")
    public ApiResponse<List<Map<String, Object>>> getElectricityServices() {
        return ApiResponse.success(service.getElectricityServices());
    }

    @GetMapping("/water")
    public ApiResponse<List<Map<String, Object>>> getWaterServices() {
        return ApiResponse.success(service.getWaterServices());
    }
}