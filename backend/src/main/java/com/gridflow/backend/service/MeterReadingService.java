package com.gridflow.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
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
}