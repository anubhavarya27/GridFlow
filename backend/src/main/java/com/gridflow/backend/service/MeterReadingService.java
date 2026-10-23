package com.gridflow.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class MeterReadingService {
    private final JdbcTemplate jdbcTemplate;

    public MeterReadingService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> getReadings() {
        String sql = """
            SELECT meter_id, reading_no, reading_date,
                   reading_value, reading_status
            FROM meter_reading
            ORDER BY reading_date DESC, meter_id, reading_no DESC
            """;

        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getReadings(Integer customerId) {
        if (customerId == null) return getReadings();
        return jdbcTemplate.queryForList("""
            SELECT r.meter_id, r.reading_no, r.reading_date,
                   r.reading_value, r.reading_status
            FROM meter_reading r
            WHERE EXISTS (
                SELECT 1 FROM property_incorporate_meter pm
                JOIN customer_owns_property own ON own.property_id = pm.property_id
                WHERE pm.meter_id = r.meter_id AND own.cust_id = ?
            )
            ORDER BY r.reading_date DESC, r.meter_id, r.reading_no DESC
            """, customerId);
    }

    public List<Map<String, Object>> getReadingsByMeterId(int meterId) {
        String sql = """
            SELECT meter_id, reading_no, reading_date,
                   reading_value, reading_status
            FROM meter_reading
            WHERE meter_id = ?
            ORDER BY reading_date DESC, reading_no DESC
            """;

        return jdbcTemplate.queryForList(sql, meterId);
    }

    public List<Map<String, Object>> getReadingsByMeterId(int meterId, Integer customerId) {
        if (customerId == null) return getReadingsByMeterId(meterId);
        return jdbcTemplate.queryForList("""
            SELECT r.meter_id, r.reading_no, r.reading_date,
                   r.reading_value, r.reading_status
            FROM meter_reading r
            WHERE r.meter_id = ? AND EXISTS (
                SELECT 1 FROM property_incorporate_meter pm
                JOIN customer_owns_property own ON own.property_id = pm.property_id
                WHERE pm.meter_id = r.meter_id AND own.cust_id = ?
            )
            ORDER BY r.reading_date DESC, r.reading_no DESC
            """, meterId, customerId);
    }

    public List<Map<String, Object>> getConsumption(
            int meterId, LocalDate from, LocalDate to) {

        String sql = """
            WITH valid_readings AS (
                SELECT
                    meter_id,
                    reading_no,
                    reading_date,
                    reading_value,
                    LAG(reading_value) OVER (
                        PARTITION BY meter_id
                        ORDER BY reading_date, reading_no
                    ) AS previous_value
                FROM meter_reading
                WHERE reading_status = 'Valid'
                  AND meter_id = ?
                  AND reading_date <= ?
            )
            SELECT
                reading_date,
                SUM(reading_value - previous_value) AS consumption
            FROM valid_readings
            WHERE previous_value IS NOT NULL
              AND reading_date >= ?
            GROUP BY reading_date
            ORDER BY reading_date
            """;

        return jdbcTemplate.queryForList(sql, meterId, to, from);
    }

    public List<Map<String, Object>> getConsumption(
            int meterId, LocalDate from, LocalDate to, Integer customerId) {
        if (customerId == null) return getConsumption(meterId, from, to);
        return jdbcTemplate.queryForList("""
            WITH valid_readings AS (
                SELECT meter_id, reading_no, reading_date, reading_value,
                       LAG(reading_value) OVER (
                           PARTITION BY meter_id ORDER BY reading_date, reading_no
                       ) AS previous_value
                FROM meter_reading r
                WHERE reading_status = 'Valid' AND meter_id = ?
                  AND reading_date <= ?
                  AND EXISTS (
                      SELECT 1 FROM property_incorporate_meter pm
                      JOIN customer_owns_property own ON own.property_id = pm.property_id
                      WHERE pm.meter_id = r.meter_id AND own.cust_id = ?
                  )
            )
            SELECT reading_date, SUM(reading_value - previous_value) AS consumption
            FROM valid_readings
            WHERE previous_value IS NOT NULL AND reading_date >= ?
            GROUP BY reading_date
            ORDER BY reading_date
            """, meterId, to, customerId, from);
    }
}
