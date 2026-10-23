package com.gridflow.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class CustomerServiceTests {
    private JdbcTemplate jdbc;
    private CustomerService service;

    @BeforeEach void setUp() {
        jdbc = mock(JdbcTemplate.class);
        service = new CustomerService(jdbc);
    }

    @Test void returnsCustomersWithContactSubqueries() {
        List<Map<String,Object>> rows = List.of(Map.of("cust_id", 1));
        when(jdbc.queryForList(anyString())).thenReturn(rows);
        assertEquals(rows, service.getCustomers());
        verify(jdbc).queryForList(argThat((String sql) ->
                sql.contains("FROM customer c")
                && sql.contains("customer_email")
                && sql.contains("customer_phone")
                && sql.contains("ORDER BY c.cust_id")));
    }

    @Test void findsCustomerById() {
        Map<String,Object> row = Map.of("cust_id", 4);
        when(jdbc.queryForList(anyString(), anyInt())).thenReturn(List.of(row));
        assertEquals(row, service.getCustomerById(4));
        verify(jdbc).queryForList(
                argThat((String sql) -> sql.contains("WHERE c.cust_id = ?")),
                eq(4));
    }

    @Test void returnsNullWhenCustomerIsMissing() {
        when(jdbc.queryForList(anyString(), anyInt())).thenReturn(List.of());
        assertNull(service.getCustomerById(999));
    }
}