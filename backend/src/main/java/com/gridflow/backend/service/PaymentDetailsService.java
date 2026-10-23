package com.gridflow.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class PaymentDetailsService {
    private final JdbcTemplate jdbcTemplate;

    private static final Set<String> ALLOWED_TABLES = Set.of(
        "card",
        "card_payment",
        "cash_payment",
        "upi_payment",
        "payment_schedule",
        "meter_service"
    );

    public PaymentDetailsService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> getTableRows(String tableName) {
        if (!ALLOWED_TABLES.contains(tableName)) {
            throw new IllegalArgumentException("Unsupported resource.");
        }

        return jdbcTemplate.queryForList(
            "SELECT * FROM " + tableName + " ORDER BY 1"
        );
    }
}