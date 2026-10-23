package com.gridflow.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class TariffServiceTests {
    private JdbcTemplate jdbc;
    private TariffService service;

    @BeforeEach void setUp() {
        jdbc = mock(JdbcTemplate.class);
        service = new TariffService(jdbc);
    }

    @Test void returnsTariffsInCodeOrder() {
        List<Map<String,Object>> rows = List.of(Map.of("tariff_code", "T1"));
        when(jdbc.queryForList(anyString())).thenReturn(rows);
        assertEquals(rows, service.getTariffs());
        verify(jdbc).queryForList(argThat((String sql) ->
                sql.contains("FROM tariff")
                && sql.contains("ORDER BY tariff_code")));
    }

    @Test void findsTariffByCode() {
        Map<String,Object> row = Map.of("tariff_code", "T1");
        when(jdbc.queryForList(anyString(), anyString())).thenReturn(List.of(row));
        assertEquals(row, service.getTariffByCode("T1"));
        verify(jdbc).queryForList(
                argThat((String sql) -> sql.contains("WHERE tariff_code = ?")),
                eq("T1"));
    }

    @Test void returnsNullWhenTariffIsMissing() {
        when(jdbc.queryForList(anyString(), anyString())).thenReturn(List.of());
        assertNull(service.getTariffByCode("missing"));
    }
}