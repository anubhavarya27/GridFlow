package com.gridflow.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class MeterReadingServiceTests {

    private JdbcTemplate jdbcTemplate;
    private MeterReadingService service;

    @BeforeEach
    void setUp() {
        jdbcTemplate = mock(JdbcTemplate.class);
        service = new MeterReadingService(jdbcTemplate);
    }

    @Test
    void getReadingsReturnsDatabaseResults() {
        List<Map<String, Object>> expected =
                List.of(Map.of("meter_id", 1, "reading_value", 120));

        when(jdbcTemplate.queryForList(anyString())).thenReturn(expected);

        assertEquals(expected, service.getReadings());

        verify(jdbcTemplate).queryForList(contains("FROM meter_reading"));
    }

    @Test
    void getReadingsByMeterIdUsesRequestedMeter() {
        List<Map<String, Object>> expected =
                List.of(Map.of("meter_id", 7, "reading_value", 250));

        when(jdbcTemplate.queryForList(anyString(), anyInt()))
                .thenReturn(expected);

        assertEquals(expected, service.getReadingsByMeterId(7));

        verify(jdbcTemplate).queryForList(
                contains("WHERE meter_id = ?"), eq(7));
    }

    @Test
    void getConsumptionUsesMeterAndDateRangeInCorrectOrder() {
        int meterId = 7;
        LocalDate from = LocalDate.of(2026, 10, 1);
        LocalDate to = LocalDate.of(2026, 10, 23);

        List<Map<String, Object>> expected =
                List.of(Map.of("reading_date", from, "consumption", 35));

        when(jdbcTemplate.queryForList(
                anyString(), anyInt(), any(), any()))
                .thenReturn(expected);

        assertEquals(expected, service.getConsumption(meterId, from, to));

        verify(jdbcTemplate).queryForList(
                argThat((String sql) ->
                        sql.contains("LAG(reading_value)")
                        && sql.contains("reading_status = 'Valid'")
                        && sql.contains("reading_date <= ?")
                        && sql.contains("reading_date >= ?")
                        && sql.contains("ORDER BY reading_date")),
                eq(meterId), eq(to), eq(from));
    }

    @Test
    void getConsumptionReturnsEmptyResultsWhenNoReadingsMatch() {
        when(jdbcTemplate.queryForList(
                anyString(), anyInt(), any(), any()))
                .thenReturn(List.of());

        assertEquals(
                List.of(),
                service.getConsumption(
                        7,
                        LocalDate.of(2026, 10, 1),
                        LocalDate.of(2026, 10, 23)));
    }
}