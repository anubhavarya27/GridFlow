package com.gridflow.backend.controller;

import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.service.MeterReadingAnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/meter-readings")
public class MeterReadingAnalyticsController {

    private final MeterReadingAnalyticsService analyticsService;

    public MeterReadingAnalyticsController(
            MeterReadingAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/daily-aggregate")
    public ResponseEntity<ApiResponse<?>> getDailyAggregate(
            @RequestParam(required = false) Integer meterId,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {

        if (meterId != null && meterId <= 0) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Meter ID must be positive."));
        }
        if (from != null && to != null && from.isAfter(to)) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("'from' must be on or before 'to'."));
        }

        return ResponseEntity.ok(ApiResponse.success(
                analyticsService.getDailyAggregate(meterId, from, to)));
    }

    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<?>> getHighConsumptionAlerts(
            @RequestParam(required = false) Integer meterId,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {

        if (meterId != null && meterId <= 0) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Meter ID must be positive."));
        }

        LocalDate effectiveTo = to != null ? to : LocalDate.now();
        LocalDate effectiveFrom = from != null
                ? from : effectiveTo.minusDays(30);

        if (effectiveFrom.isAfter(effectiveTo)) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("'from' must be on or before 'to'."));
        }

        return ResponseEntity.ok(ApiResponse.success(
                analyticsService.getHighConsumptionAlerts(
                        meterId, effectiveFrom, effectiveTo)));
    }
}