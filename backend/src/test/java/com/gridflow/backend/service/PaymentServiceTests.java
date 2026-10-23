package com.gridflow.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PaymentServiceTests {
    private JdbcTemplate jdbc;
    private PaymentService service;

    @BeforeEach void setUp() {
        jdbc = mock(JdbcTemplate.class);
        service = new PaymentService(jdbc);
    }

    @Test void returnsPaymentsInDateOrder() {
        List<Map<String,Object>> rows = List.of(Map.of("payment_id", 1));
        when(jdbc.queryForList(anyString())).thenReturn(rows);
        assertEquals(rows, service.getPayments());
        verify(jdbc).queryForList(argThat((String sql) ->
                sql.contains("FROM payment")
                && sql.contains("ORDER BY payment_date DESC, payment_id DESC")));
    }

    @Test void filtersPaymentsByBillId() {
        List<Map<String,Object>> rows = List.of(Map.of("bill_id", 3));
        when(jdbc.queryForList(anyString(), anyInt())).thenReturn(rows);
        assertEquals(rows, service.getPaymentsByBillId(3));
        verify(jdbc).queryForList(
                argThat((String sql) -> sql.contains("WHERE bill_id = ?")),
                eq(3));
    }

    @Test void returnsEmptyListWhenNoPaymentsExist() {
        when(jdbc.queryForList(anyString())).thenReturn(List.of());
        assertEquals(List.of(), service.getPayments());
    }
}