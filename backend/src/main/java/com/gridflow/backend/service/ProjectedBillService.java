package com.gridflow.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class ProjectedBillService {

    private final JdbcTemplate jdbcTemplate;

    public ProjectedBillService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> getProjectedBills(Integer meterId) {
        LocalDate periodStart = LocalDate.now().withDayOfMonth(1);
        LocalDate nextPeriodStart = periodStart.plusMonths(1);

        String sql = """
            WITH baseline AS (
                SELECT DISTINCT ON (meter_id)
                       meter_id, reading_value AS previous_reading
                FROM meter_reading
                WHERE reading_status = 'Valid'
                  AND reading_date < ?
                ORDER BY meter_id, reading_date DESC, reading_no DESC
            ),
            latest AS (
                SELECT DISTINCT ON (meter_id)
                       meter_id, reading_date, reading_value AS current_reading
                FROM meter_reading
                WHERE reading_status = 'Valid'
                  AND reading_date >= ?
                  AND reading_date < ?
                ORDER BY meter_id, reading_date DESC, reading_no DESC
            ),
            latest_tariff AS (
                SELECT DISTINCT ON (meter_id)
                       meter_id, tariff_code
                FROM bill
                ORDER BY meter_id, billing_month DESC
            )
            SELECT l.meter_id,
                   ?::date AS billing_period_start,
                   (?::date - 1) AS billing_period_end,
                   l.reading_date AS latest_reading_date,
                   b.previous_reading,
                   l.current_reading,
                   (l.current_reading - b.previous_reading) AS estimated_units,
                   t.tariff_code,
                   t.unit_rate,
                   ROUND(
                       (l.current_reading - b.previous_reading) * t.unit_rate,
                       2
                   ) AS estimated_amount
            FROM latest l
            JOIN baseline b ON b.meter_id = l.meter_id
            JOIN latest_tariff lt ON lt.meter_id = l.meter_id
            JOIN tariff t ON t.tariff_code = lt.tariff_code
            WHERE l.current_reading >= b.previous_reading
              AND (CAST(? AS INTEGER) IS NULL OR l.meter_id = CAST(? AS INTEGER))
            ORDER BY l.meter_id
            """;

        return jdbcTemplate.queryForList(
                sql,
                periodStart,
                periodStart,
                nextPeriodStart,
                periodStart,
                nextPeriodStart,
                meterId,
                meterId);
    }
}