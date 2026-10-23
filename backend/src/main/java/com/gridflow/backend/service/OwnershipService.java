package com.gridflow.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class OwnershipService {
    private final JdbcTemplate jdbcTemplate;

    public OwnershipService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> getOwnerships() {
        String sql = """
            SELECT cp.cust_id, c.cust_name,
                   cp.property_id, p.property_name,
                   cp.ownership_date, cp.ownership_type
            FROM customer_owns_property cp
            JOIN customer c ON c.cust_id = cp.cust_id
            JOIN property p ON p.property_id = cp.property_id
            ORDER BY cp.property_id, cp.cust_id
            """;
        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getOwnershipsByCustomerId(int customerId) {
        String sql = """
            SELECT cp.cust_id, c.cust_name,
                   cp.property_id, p.property_name,
                   cp.ownership_date, cp.ownership_type
            FROM customer_owns_property cp
            JOIN customer c ON c.cust_id = cp.cust_id
            JOIN property p ON p.property_id = cp.property_id
            WHERE cp.cust_id = ?
            ORDER BY cp.property_id
            """;
        return jdbcTemplate.queryForList(sql, customerId);
    }
}