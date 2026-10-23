package com.gridflow.backend.controller;

import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.service.MeterReadingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meter-readings")
public class MeterReadingController {
    private final MeterReadingService meterReadingService;

    public MeterReadingController(MeterReadingService meterReadingService) {
        this.meterReadingService = meterReadingService;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getReadings() {
        return ApiResponse.success(meterReadingService.getReadings());
    }

    @GetMapping("/meter/{meterId}")
    public ResponseEntity<ApiResponse<?>> getReadingsByMeterId(
            @PathVariable int meterId) {
        if (meterId <= 0) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Meter ID must be positive."));
        }
        return ResponseEntity.ok(
                ApiResponse.success(
                        meterReadingService.getReadingsByMeterId(meterId)));
    }
}