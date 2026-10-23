package com.gridflow.backend.service;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class DataExplorerServiceTests {
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final DataExplorerService service = new DataExplorerService(jdbc);

    @Test
    void rejectsUnlistedTableNamesBeforeBuildingSql() {
        assertThrows(IllegalArgumentException.class,
                () -> service.list("customer; DROP TABLE customer"));
        verifyNoInteractions(jdbc);
    }
}
