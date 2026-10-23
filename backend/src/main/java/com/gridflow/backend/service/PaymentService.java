package com.gridflow.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class PaymentService {
    private final JdbcTemplate jdbcTemplate;

    public PaymentService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> getPayments() {
        String sql = """
            SELECT payment_id, bill_id, payment_sequence, payment_date,
                   amount, payment_mode
            FROM payment
            ORDER BY payment_date DESC, payment_id DESC
            """;
        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getPaymentsByBillId(int billId) {
        String sql = """
            SELECT payment_id, bill_id, payment_sequence, payment_date,
                   amount, payment_mode
            FROM payment
            WHERE bill_id = ?
            ORDER BY payment_date DESC, payment_id DESC
            """;
        return jdbcTemplate.queryForList(sql, billId);
    }
}