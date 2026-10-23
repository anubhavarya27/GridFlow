package com.gridflow.backend.controller;

import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.service.PropertyService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PropertyController {
    private final PropertyService propertyService;

    public PropertyController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    @GetMapping("/properties")
    public ApiResponse<List<Map<String, Object>>> getProperties() {
        return ApiResponse.success(propertyService.getProperties());
    }

    @GetMapping("/meters")
    public ApiResponse<List<Map<String, Object>>> getMeters() {
        return ApiResponse.success(propertyService.getMeters());
    }
}