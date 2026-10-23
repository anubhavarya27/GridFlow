package com.gridflow.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {
    private final JdbcTemplate jdbc;
    private final DashboardService dashboard;

    public ReportService(JdbcTemplate jdbc, DashboardService dashboard) {
        this.jdbc = jdbc;
        this.dashboard = dashboard;
    }

    public Map<String, Object> overview() {
        Map<String, Object> result = new LinkedHashMap<>(dashboard.getSummary());
        result.put("total_payments", jdbc.queryForObject(
                "SELECT COUNT(*) FROM payment", Long.class));
        result.put("total_consumption", jdbc.queryForObject("""
                SELECT COALESCE(SUM(consumption), 0)
                FROM (
                    SELECT reading_value - LAG(reading_value) OVER (
                               PARTITION BY meter_id ORDER BY reading_date, reading_no
                           ) AS consumption
                    FROM meter_reading
                    WHERE reading_status = 'Valid'
                ) usage
                WHERE consumption IS NOT NULL
                """, java.math.BigDecimal.class));
        return result;
    }

    public Map<String, Object> monthly() {
        return Map.of("consumption", dashboard.getConsumption(),
                "revenue", dashboard.getRevenue());
    }

    public List<Map<String, Object>> billStatus() {
        return jdbc.queryForList("""
                SELECT bill_status, COUNT(*) AS count
                FROM bill
                GROUP BY bill_status
                ORDER BY bill_status
                """);
    }

    public List<Map<String, Object>> paymentMethods() {
        return jdbc.queryForList("""
                SELECT payment_mode, COUNT(*) AS payment_count,
                       COALESCE(SUM(amount), 0) AS total_amount
                FROM payment
                GROUP BY payment_mode
                ORDER BY payment_mode
                """);
    }

    public List<Map<String, Object>> topMeters() {
        return dashboard.getTopMeters();
    }
}
