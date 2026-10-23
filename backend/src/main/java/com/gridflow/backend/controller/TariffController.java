package com.gridflow.backend.controller;

import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.service.TariffService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tariffs")
public class TariffController {
    private final TariffService tariffService;

    public TariffController(TariffService tariffService) {
        this.tariffService = tariffService;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getTariffs() {
        return ApiResponse.success(tariffService.getTariffs());
    }

    @GetMapping("/{tariffCode}")
    public ResponseEntity<ApiResponse<?>> getTariffByCode(
            @PathVariable String tariffCode) {
        Map<String, Object> tariff = tariffService.getTariffByCode(tariffCode);
        if (tariff == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Tariff not found."));
        }
        return ResponseEntity.ok(ApiResponse.success(tariff));
    }
}