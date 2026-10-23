package com.gridflow.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class OwnershipServiceTests {
    private JdbcTemplate jdbc;
    private OwnershipService service;

    @BeforeEach void setUp() {
        jdbc = mock(JdbcTemplate.class);
        service = new OwnershipService(jdbc);
    }

    @Test void returnsOwnershipsWithCustomerAndPropertyNames() {
        List<Map<String,Object>> rows = List.of(Map.of("cust_id", 1));
        when(jdbc.queryForList(anyString())).thenReturn(rows);
        assertEquals(rows, service.getOwnerships());
        verify(jdbc).queryForList(argThat((String sql) ->
                sql.contains("customer_owns_property")
                && sql.contains("JOIN customer")
                && sql.contains("JOIN property")));
    }

    @Test void filtersOwnershipsByCustomerId() {
        List<Map<String,Object>> rows = List.of(Map.of("cust_id", 5));
        when(jdbc.queryForList(anyString(), anyInt())).thenReturn(rows);
        assertEquals(rows, service.getOwnershipsByCustomerId(5));
        verify(jdbc).queryForList(
                argThat((String sql) -> sql.contains("WHERE cp.cust_id = ?")),
                eq(5));
    }
}