package com.gridflow.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DashboardServiceTests {

    private JdbcTemplate jdbcTemplate;
    private DashboardService service;

    @BeforeEach
    void setUp() {
        jdbcTemplate = mock(JdbcTemplate.class);
        service = new DashboardService(jdbcTemplate);
    }

    @Test
    void getSummaryReturnsDatabaseSummary() {
        Map<String, Object> expected = Map.of(
                "total_customers", 10L,
                "total_properties", 6L,
                "total_meters", 10L,
                "total_bills", 30L,
                "total_revenue", 1250.0
        );

        when(jdbcTemplate.queryForMap(anyString())).thenReturn(expected);

        assertEquals(expected, service.getSummary());

        verify(jdbcTemplate).queryForMap(argThat((String sql) ->
                sql.contains("FROM customer")
                && sql.contains("FROM property")
                && sql.contains("FROM meter")
                && sql.contains("FROM bill")
                && sql.contains("FROM payment")
                && sql.contains("COALESCE(SUM(amount), 0)")));
    }

    @Test
    void getBillStatusReturnsGroupedStatusCounts() {
        List<Map<String, Object>> expected = List.of(
                Map.of("bill_status", "Paid", "bill_count", 12L),
                Map.of("bill_status", "Unpaid", "bill_count", 18L)
        );

        when(jdbcTemplate.queryForList(anyString())).thenReturn(expected);

        assertEquals(expected, service.getBillStatus());

        verify(jdbcTemplate).queryForList(argThat((String sql) ->
                sql.contains("FROM bill")
                && sql.contains("GROUP BY bill_status")
                && sql.contains("ORDER BY bill_status")));
    }

    @Test
    void getPaymentMethodsReturnsGroupedPaymentCounts() {
        List<Map<String, Object>> expected = List.of(
                Map.of("payment_mode", "Cash", "payment_count", 5L),
                Map.of("payment_mode", "UPI", "payment_count", 8L)
        );

        when(jdbcTemplate.queryForList(anyString())).thenReturn(expected);

        assertEquals(expected, service.getPaymentMethods());

        verify(jdbcTemplate).queryForList(argThat((String sql) ->
                sql.contains("FROM payment")
                && sql.contains("GROUP BY payment_mode")
                && sql.contains("ORDER BY payment_mode")));
    }

    @Test
    void getConsumptionUsesValidReadingsAndPreviousValues() {
        List<Map<String, Object>> expected = List.of(
                Map.of("month", "2026-10", "consumption", 350.0)
        );

        when(jdbcTemplate.queryForList(anyString())).thenReturn(expected);

        assertEquals(expected, service.getConsumption());

        verify(jdbcTemplate).queryForList(argThat((String sql) ->
                sql.contains("LAG(reading_value)")
                && sql.contains("PARTITION BY meter_id")
                && sql.contains("reading_status = 'Valid'")
                && sql.contains("GROUP BY DATE_TRUNC('month', reading_date)")
                && sql.contains("ORDER BY DATE_TRUNC('month', reading_date)")));
    }

    @Test
    void getRevenueReturnsMonthlyPaymentTotals() {
        List<Map<String, Object>> expected = List.of(
                Map.of("month", "2026-10", "revenue", 1250.0)
        );

        when(jdbcTemplate.queryForList(anyString())).thenReturn(expected);

        assertEquals(expected, service.getRevenue());

        verify(jdbcTemplate).queryForList(argThat((String sql) ->
                sql.contains("FROM payment")
                && sql.contains("SUM(amount) AS revenue")
                && sql.contains("DATE_TRUNC('month', payment_date)")
                && sql.contains("GROUP BY DATE_TRUNC('month', payment_date)")
                && sql.contains("ORDER BY DATE_TRUNC('month', payment_date)")));
    }

    @Test
    void dashboardListsCanReturnEmptyResults() {
        when(jdbcTemplate.queryForList(anyString())).thenReturn(List.of());

        assertEquals(List.of(), service.getBillStatus());
        assertEquals(List.of(), service.getPaymentMethods());
        assertEquals(List.of(), service.getConsumption());
        assertEquals(List.of(), service.getRevenue());

        verify(jdbcTemplate, times(4)).queryForList(anyString());
    }
}