package com.gridflow.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PaymentDetailsServiceTests {
    private JdbcTemplate jdbc;
    private PaymentDetailsService service;

    @BeforeEach void setUp() {
        jdbc = mock(JdbcTemplate.class);
        service = new PaymentDetailsService(jdbc);
    }

    @Test void acceptsAllowedTableAndReturnsRows() {
        List<Map<String,Object>> rows = List.of(Map.of("payment_id", 1));
        when(jdbc.queryForList(anyString())).thenReturn(rows);

        assertEquals(rows, service.getTableRows("card_payment"));
        verify(jdbc).queryForList("SELECT * FROM card_payment ORDER BY 1");
    }

    @Test void rejectsUnsupportedTableWithoutQueryingDatabase() {
        assertThrows(IllegalArgumentException.class,
                () -> service.getTableRows("customer"));

        verifyNoInteractions(jdbc);
    }

    @Test void rejectsSqlInjectionAsTableName() {
        assertThrows(IllegalArgumentException.class,
                () -> service.getTableRows("payment; DROP TABLE customer"));

        verifyNoInteractions(jdbc);
    }
}