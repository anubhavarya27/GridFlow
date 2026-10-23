package com.gridflow.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class PropertyService {
    private final JdbcTemplate jdbcTemplate;

    public PropertyService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> getProperties() {
        String sql = """
            SELECT p.property_id, p.property_name, p.occupancy_status,
                   (SELECT count(*)
                    FROM property_incorporate_meter pm
                    WHERE pm.property_id = p.property_id) AS meter_count
            FROM property p
            ORDER BY p.property_id
            """;
        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getMeters() {
        String sql = """
            SELECT m.meter_id, m.capacity, m.installation_date,
                   m.meter_status, pm.property_id
            FROM meter m
            LEFT JOIN property_incorporate_meter pm ON pm.meter_id = m.meter_id
            ORDER BY m.meter_id
            """;
        return jdbcTemplate.queryForList(sql);
    }
}