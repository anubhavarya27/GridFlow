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

    public List<Map<String, Object>> getPayments(Integer customerId) {
        if (customerId == null) return getPayments();
        return jdbcTemplate.queryForList("""
            SELECT p.payment_id, p.bill_id, p.payment_sequence,
                   p.payment_date, p.amount, p.payment_mode
            FROM payment p
            JOIN bill b ON b.bill_id = p.bill_id
            WHERE EXISTS (
                SELECT 1 FROM property_incorporate_meter pm
                JOIN customer_owns_property own ON own.property_id = pm.property_id
                WHERE pm.meter_id = b.meter_id AND own.cust_id = ?
            )
            ORDER BY p.payment_date DESC, p.payment_id DESC
            """, customerId);
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

    public List<Map<String, Object>> getPaymentsByBillId(int billId, Integer customerId) {
        if (customerId == null) return getPaymentsByBillId(billId);
        return jdbcTemplate.queryForList("""
            SELECT p.payment_id, p.bill_id, p.payment_sequence,
                   p.payment_date, p.amount, p.payment_mode
            FROM payment p
            JOIN bill b ON b.bill_id = p.bill_id
            WHERE p.bill_id = ? AND EXISTS (
                SELECT 1 FROM property_incorporate_meter pm
                JOIN customer_owns_property own ON own.property_id = pm.property_id
                WHERE pm.meter_id = b.meter_id AND own.cust_id = ?
            )
            ORDER BY p.payment_date DESC, p.payment_id DESC
            """, billId, customerId);
    }
}
