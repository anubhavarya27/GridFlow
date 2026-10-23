package com.gridflow.backend.controller;

import com.gridflow.backend.dto.ApiResponse;
import com.gridflow.backend.service.ProjectedBillService;
import com.gridflow.backend.security.CustomerScope;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bills")
public class ProjectedBillController {

    private final ProjectedBillService projectedBillService;

    public ProjectedBillController(ProjectedBillService projectedBillService) {
        this.projectedBillService = projectedBillService;
    }

    @GetMapping("/projected")
    public ResponseEntity<ApiResponse<?>> getProjectedBills(
            @RequestParam(required = false) Integer meterId) {

        if (meterId != null && meterId <= 0) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Meter ID must be positive."));
        }

        return ResponseEntity.ok(ApiResponse.success(
                CustomerScope.isAdministrator()
                        ? projectedBillService.getProjectedBills(meterId)
                        : projectedBillService.getProjectedBills(
                                meterId, CustomerScope.currentCustomerId())));
    }
}
