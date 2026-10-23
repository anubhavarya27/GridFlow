package com.gridflow.backend.config;

import com.gridflow.backend.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GlobalExceptionHandlerTests {
    private final GlobalExceptionHandler handler =
        new GlobalExceptionHandler();

    @Test
    void unreadableBodyReturnsBadRequest() {
        HttpInputMessage inputMessage = mock(HttpInputMessage.class);
        var response = handler.handleUnreadableRequest(
            new HttpMessageNotReadableException("invalid", inputMessage));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void unexpectedExceptionReturnsGenericInternalServerError() {
        var response = handler.handleUnexpected(
            new RuntimeException("internal details"));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR,
            response.getStatusCode());
        assertFalse(response.getBody().message()
            .contains("internal details"));
    }

    @Test
    void typeMismatchReturnsBadRequest() {
        MethodArgumentTypeMismatchException exception =
            new MethodArgumentTypeMismatchException(
                "not-a-number", Integer.class, "meterId",
                null, new IllegalArgumentException("invalid number"));

        var response = handler.handleTypeMismatch(exception);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().message().contains("meterId"));
    }
}
