package com.gridflow.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class UtilityServiceServiceTests {
    private JdbcTemplate jdbc;
    private UtilityServiceService service;

    @BeforeEach
    void setUp() {
        jdbc = mock(JdbcTemplate.class);
        service = new UtilityServiceService(jdbc);
    }

    private void verifyQueryContains(String tableName) {
        verify(jdbc).queryForList(argThat(sql ->
            sql != null
                && sql.replaceAll("\\s+", " ").trim()
                    .equals("SELECT * FROM " + tableName + " ORDER BY 1")
        ));
    }

    @Test
    void returnsUtilityServices() {
        List<Map<String,Object>> rows = List.of(Map.of("service_id", 1));
        when(jdbc.queryForList(anyString())).thenReturn(rows);

        assertEquals(rows, service.getUtilityServices());
        verifyQueryContains("utility_service");
    }

    @Test
    void returnsElectricityServices() {
        List<Map<String,Object>> rows = List.of(Map.of("service_id", 2));
        when(jdbc.queryForList(anyString())).thenReturn(rows);

        assertEquals(rows, service.getElectricityServices());
        verifyQueryContains("electricity_service");
    }

    @Test
    void returnsWaterServices() {
        List<Map<String,Object>> rows = List.of(Map.of("service_id", 3));
        when(jdbc.queryForList(anyString())).thenReturn(rows);

        assertEquals(rows, service.getWaterServices());
        verifyQueryContains("water_service");
    }
}