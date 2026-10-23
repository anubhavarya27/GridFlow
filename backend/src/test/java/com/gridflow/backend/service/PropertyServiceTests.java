package com.gridflow.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PropertyServiceTests {
    private JdbcTemplate jdbc;
    private PropertyService service;

    @BeforeEach void setUp() {
        jdbc = mock(JdbcTemplate.class);
        service = new PropertyService(jdbc);
    }

    @Test void returnsPropertiesWithMeterCounts() {
        List<Map<String,Object>> rows = List.of(Map.of("property_id", 1));
        when(jdbc.queryForList(anyString())).thenReturn(rows);
        assertEquals(rows, service.getProperties());
        verify(jdbc).queryForList(argThat((String sql) ->
                sql.contains("FROM property p")
                && sql.contains("property_incorporate_meter")
                && sql.contains("AS meter_count")));
    }

    @Test void returnsMetersAndAssociatedProperties() {
        List<Map<String,Object>> rows = List.of(Map.of("meter_id", 2));
        when(jdbc.queryForList(anyString())).thenReturn(rows);
        assertEquals(rows, service.getMeters());
        verify(jdbc).queryForList(argThat((String sql) ->
                sql.contains("FROM meter m")
                && sql.contains("LEFT JOIN property_incorporate_meter")));
    }
}