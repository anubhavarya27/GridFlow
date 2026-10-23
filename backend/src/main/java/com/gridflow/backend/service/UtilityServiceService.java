package com.gridflow.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class UtilityServiceService {
    private final JdbcTemplate jdbcTemplate;

    public UtilityServiceService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> getUtilityServices() {
        return jdbcTemplate.queryForList("""
            SELECT * FROM utility_service
            ORDER BY 1
            """);
    }

    public List<Map<String, Object>> getElectricityServices() {
        return jdbcTemplate.queryForList("""
            SELECT * FROM electricity_service
            ORDER BY 1
            """);
    }

    public List<Map<String, Object>> getWaterServices() {
        return jdbcTemplate.queryForList("""
            SELECT * FROM water_service
            ORDER BY 1
            """);
    }
}