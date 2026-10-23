package com.gridflow.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final JdbcTemplate jdbcTemplate;

    public DashboardService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Map<String, Object> getSummary() {
        String sql = """
            SELECT
                (SELECT COUNT(*) FROM customer) AS total_customers,
                (SELECT COUNT(*) FROM property) AS total_properties,
                (SELECT COUNT(*) FROM meter) AS total_meters,
                (SELECT COUNT(*) FROM bill) AS total_bills,
                (SELECT COALESCE(SUM(amount), 0) FROM payment) AS total_revenue
            """;

        return jdbcTemplate.queryForMap(sql);
    }

    public List<Map<String, Object>> getBillStatus() {
        String sql = """
            SELECT bill_status, COUNT(*) AS bill_count
            FROM bill
            GROUP BY bill_status
            ORDER BY bill_status
            """;

        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getPaymentMethods() {
        String sql = """
            SELECT payment_mode, COUNT(*) AS payment_count
            FROM payment
            GROUP BY payment_mode
            ORDER BY payment_mode
            """;

        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getConsumption() {
        String sql = """
            WITH valid_readings AS (
                SELECT
                    meter_id,
                    reading_date,
                    reading_value,
                    LAG(reading_value) OVER (
                        PARTITION BY meter_id
                        ORDER BY reading_date, reading_no
                    ) AS previous_value
                FROM meter_reading
                WHERE reading_status = 'Valid'
            )
            SELECT
                TO_CHAR(DATE_TRUNC('month', reading_date), 'YYYY-MM') AS month,
                SUM(reading_value - previous_value) AS consumption
            FROM valid_readings
            WHERE previous_value IS NOT NULL
            GROUP BY DATE_TRUNC('month', reading_date)
            ORDER BY DATE_TRUNC('month', reading_date)
            """;

        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getRevenue() {
        String sql = """
            SELECT
                TO_CHAR(DATE_TRUNC('month', payment_date), 'YYYY-MM') AS month,
                SUM(amount) AS revenue
            FROM payment
            GROUP BY DATE_TRUNC('month', payment_date)
            ORDER BY DATE_TRUNC('month', payment_date)
            """;

        return jdbcTemplate.queryForList(sql);
    }
}