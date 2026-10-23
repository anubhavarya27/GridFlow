package com.gridflow.backend.dto.database;

import java.time.LocalDate;

public record BenchmarkRunRequest(
        Integer meterId,
        LocalDate from,
        LocalDate to,
        Integer repetitions) {
}
