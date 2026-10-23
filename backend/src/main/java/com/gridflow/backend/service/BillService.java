package com.gridflow.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class BillService {

    private final JdbcTemplate jdbcTemplate;

    public BillService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> getBills() {
        String sql = """
            SELECT
                b.bill_id,
                b.meter_id,
                b.billing_month,
                b.billing_date,
                b.previous_reading,
                b.current_reading,
                b.tariff_code,
                b.bill_status
            FROM bill b
            ORDER BY b.billing_month DESC, b.bill_id DESC
            """;

        return jdbcTemplate.queryForList(sql);
    }

    public Map<String, Object> getBillById(int billId) {
        String sql = """
            SELECT
                b.bill_id,
                b.meter_id,
                b.billing_month,
                b.billing_date,
                b.previous_reading,
                b.current_reading,
                b.tariff_code,
                b.bill_status
            FROM bill b
            WHERE b.bill_id = ?
            """;

        List<Map<String, Object>> results =
                jdbcTemplate.queryForList(sql, billId);

        return results.isEmpty() ? null : results.get(0);
    }
}