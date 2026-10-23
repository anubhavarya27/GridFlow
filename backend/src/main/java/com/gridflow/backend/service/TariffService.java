package com.gridflow.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class TariffService {
    private final JdbcTemplate jdbcTemplate;

    public TariffService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> getTariffs() {
        String sql = """
            SELECT tariff_code, unit_rate
            FROM tariff
            ORDER BY tariff_code
            """;
        return jdbcTemplate.queryForList(sql);
    }

    public Map<String, Object> getTariffByCode(String tariffCode) {
        String sql = """
            SELECT tariff_code, unit_rate
            FROM tariff
            WHERE tariff_code = ?
            """;
        List<Map<String, Object>> rows =
                jdbcTemplate.queryForList(sql, tariffCode);
        return rows.isEmpty() ? null : rows.get(0);
    }
}