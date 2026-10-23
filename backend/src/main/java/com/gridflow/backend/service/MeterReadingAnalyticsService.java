package com.gridflow.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class MeterReadingAnalyticsService {

    private final JdbcTemplate jdbcTemplate;

    public MeterReadingAnalyticsService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> getDailyAggregate(
            Integer meterId, LocalDate from, LocalDate to) {

        StringBuilder sql = new StringBuilder("""
            SELECT bucket, meter_id, reading_count,
                   avg_reading_value, min_reading_value,
                   max_reading_value
            FROM meter_reading_daily
            WHERE 1 = 1
            """);

        List<Object> args = new ArrayList<>();

        if (meterId != null) {
            sql.append(" AND meter_id = ?");
            args.add(meterId);
        }
        if (from != null) {
            sql.append(" AND bucket >= ?");
            args.add(from);
        }
        if (to != null) {
            sql.append(" AND bucket < (?::date + INTERVAL '1 day')");
            args.add(to);
        }

        sql.append(" ORDER BY bucket, meter_id");
        return jdbcTemplate.queryForList(sql.toString(), args.toArray());
    }

    public List<Map<String, Object>> getHighConsumptionAlerts(
            Integer meterId, LocalDate from, LocalDate to) {

        String sql = """
            WITH valid_readings AS (
                SELECT meter_id, reading_no, reading_date,
                       reading_value,
                       LAG(reading_value) OVER (
                           PARTITION BY meter_id
                           ORDER BY reading_date, reading_no
                       ) AS previous_value
                FROM meter_reading
                WHERE reading_status = 'Valid'
                  AND reading_date < (?::date + INTERVAL '1 day')
                  AND (CAST(? AS INTEGER) IS NULL OR meter_id = CAST(? AS INTEGER))
            ),
            daily AS (
                SELECT meter_id,
                       reading_date::date AS alert_date,
                       SUM(reading_value - previous_value) AS consumption
                FROM valid_readings
                WHERE previous_value IS NOT NULL
                GROUP BY meter_id, reading_date::date
            ),
            compared AS (
                SELECT d.meter_id, d.alert_date, d.consumption,
                       (
                           SELECT AVG(h.consumption)
                           FROM daily h
                           WHERE h.meter_id = d.meter_id
                             AND h.alert_date >= d.alert_date - 30
                             AND h.alert_date < d.alert_date
                       ) AS baseline
                FROM daily d
            )
            SELECT meter_id,
                   alert_date AS date,
                   consumption,
                   baseline,
                   baseline * 1.5 AS threshold,
                   'HIGH_CONSUMPTION' AS alert_type
            FROM compared
            WHERE alert_date BETWEEN ? AND ?
              AND consumption > baseline * 1.5
              AND baseline > 0
            ORDER BY alert_date, meter_id
            """;

        return jdbcTemplate.queryForList(
                sql, to, meterId, meterId, from, to);
    }
}