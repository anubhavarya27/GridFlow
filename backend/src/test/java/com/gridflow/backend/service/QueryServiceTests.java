package com.gridflow.backend.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.PlatformTransactionManager;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class QueryServiceTests {
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final QueryService service = new QueryService(
            jdbc, mock(PlatformTransactionManager.class));

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void rejectsWritesToAuthenticationTables() {
        assertThrows(IllegalArgumentException.class,
                () -> service.executeOrSubmit(
                        "UPDATE app_user SET role = 'ADMIN' WHERE user_id = 2"));
        verifyNoInteractions(jdbc);
    }

    @Test
    void rejectsUnsupportedDdl() {
        assertThrows(IllegalArgumentException.class,
                () -> service.executeOrSubmit("DROP TABLE customer"));
        verifyNoInteractions(jdbc);
    }

    @Test
    void rejectsReadingAuthenticationData() {
        assertThrows(IllegalArgumentException.class,
                () -> service.executeOrSubmit("SELECT * FROM app_user"));
        verifyNoInteractions(jdbc);
    }

    @Test
    void rejectsQueriesWithDatabaseSideEffects() {
        assertThrows(IllegalArgumentException.class,
                () -> service.executeOrSubmit("SELECT pg_sleep(10)"));
        verifyNoInteractions(jdbc);
    }

    @Test
    void rejectsQuotedAuthenticationTables() {
        assertThrows(IllegalArgumentException.class,
                () -> service.executeOrSubmit("SELECT * FROM \"app_user\""));
        verifyNoInteractions(jdbc);
    }

    @Test
    void rejectsDataChangesHiddenInsideCtes() {
        assertThrows(IllegalArgumentException.class,
                () -> service.executeOrSubmit(
                        "WITH changed AS (DELETE FROM customer RETURNING *) SELECT * FROM changed"));
        verifyNoInteractions(jdbc);
    }
}
