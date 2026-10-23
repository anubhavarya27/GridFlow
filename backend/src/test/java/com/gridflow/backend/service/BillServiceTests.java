package com.gridflow.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class BillServiceTests {
    private JdbcTemplate jdbc;
    private BillService service;

    @BeforeEach void setUp() {
        jdbc = mock(JdbcTemplate.class);
        service = new BillService(jdbc);
    }

    @Test void returnsBills() {
        List<Map<String,Object>> rows = List.of(Map.of("bill_id", 1));
        when(jdbc.queryForList(anyString())).thenReturn(rows);
        assertEquals(rows, service.getBills());
        verify(jdbc).queryForList(argThat((String sql) ->
                sql.contains("FROM bill b")
                && sql.contains("ORDER BY b.billing_month DESC, b.bill_id DESC")));
    }

    @Test void findsBillById() {
        Map<String,Object> row = Map.of("bill_id", 12);
        when(jdbc.queryForList(anyString(), anyInt())).thenReturn(List.of(row));
        assertEquals(row, service.getBillById(12));
        verify(jdbc).queryForList(
                argThat((String sql) -> sql.contains("WHERE b.bill_id = ?")),
                eq(12));
    }

    @Test void returnsNullWhenBillIsMissing() {
        when(jdbc.queryForList(anyString(), anyInt())).thenReturn(List.of());
        assertNull(service.getBillById(999));
    }
}