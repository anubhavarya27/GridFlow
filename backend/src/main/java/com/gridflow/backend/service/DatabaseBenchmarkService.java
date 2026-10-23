package com.gridflow.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gridflow.backend.dto.database.BenchmarkRunRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DatabaseBenchmarkService {
    private static final String RAW_SQL = """
        SELECT reading_date::timestamp AS bucket, meter_id,
               COUNT(*)::bigint AS reading_count,
               AVG(reading_value)::numeric AS avg_reading_value,
               MIN(reading_value)::numeric AS min_reading_value,
               MAX(reading_value)::numeric AS max_reading_value
        FROM public.meter_reading
        WHERE reading_status = 'Valid'
          AND reading_date >= ? AND reading_date < (?::date + INTERVAL '1 day')
          AND (?::integer IS NULL OR meter_id = ?::integer)
        GROUP BY reading_date, meter_id
        ORDER BY reading_date, meter_id
        """;

    private static final String AGGREGATE_SQL = """
        SELECT bucket, meter_id, reading_count,
               avg_reading_value, min_reading_value, max_reading_value
        FROM public.meter_reading_daily
        WHERE bucket >= ?::date
          AND bucket < (?::date + INTERVAL '1 day')
          AND (?::integer IS NULL OR meter_id = ?::integer)
        ORDER BY bucket, meter_id
        """;

    private static final String RAW_EXPLAIN = "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + RAW_SQL;
    private static final String AGGREGATE_EXPLAIN = "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + AGGREGATE_SQL;

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public DatabaseBenchmarkService(JdbcTemplate jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Map<String, Object> run(BenchmarkRunRequest request) {
        Integer meterId = request == null ? null : request.meterId();
        LocalDate from = request == null ? null : request.from();
        LocalDate to = request == null ? null : request.to();
        int repetitions = request == null || request.repetitions() == null ? 5 : request.repetitions();

        if (meterId != null && meterId <= 0) throw new IllegalArgumentException("meterId must be positive.");
        if (repetitions < 1 || repetitions > 20) throw new IllegalArgumentException("repetitions must be between 1 and 20.");

        LocalDate[] bounds = resolveBounds(from, to);
        from = bounds[0];
        to = bounds[1];
        if (from.isAfter(to)) throw new IllegalArgumentException("from must be on or before to.");
        if (from.isBefore(LocalDate.of(1900, 1, 1)) || to.isAfter(LocalDate.of(2200, 1, 1)))
            throw new IllegalArgumentException("Date range is outside the supported range.");

        List<Double> rawExec = new ArrayList<>(), aggExec = new ArrayList<>();
        List<Double> rawPlan = new ArrayList<>(), aggPlan = new ArrayList<>();
        long rawRows = 0, aggRows = 0;

        // Run once each to warm up, then collect the requested measured samples.
        executeExplain(RAW_EXPLAIN, from, to, meterId);
        executeExplain(AGGREGATE_EXPLAIN, from, to, meterId);
        List<Map<String, Object>> rawResults = List.of();
        List<Map<String, Object>> aggregateResults = List.of();

        for (int i = 0; i < repetitions; i++) {
            PlanStats raw = executeExplain(RAW_EXPLAIN, from, to, meterId);
            PlanStats agg = executeExplain(AGGREGATE_EXPLAIN, from, to, meterId);
            rawExec.add(raw.executionMs()); aggExec.add(agg.executionMs());
            if (raw.planningMs() != null) rawPlan.add(raw.planningMs());
            if (agg.planningMs() != null) aggPlan.add(agg.planningMs());
            rawRows = raw.rowsProcessed(); aggRows = agg.rowsProcessed();
            // Confirm output equivalence using actual query results, not EXPLAIN estimates.
            rawResults = jdbc.queryForList(RAW_SQL, args(from, to, meterId));
            aggregateResults = jdbc.queryForList(AGGREGATE_SQL, args(from, to, meterId));
        }

        boolean resultsMatch = equivalent(rawResults, aggregateResults);
        double rawMedianExec = median(rawExec), aggMedianExec = median(aggExec);
        Double rawMedianPlan = rawPlan.isEmpty() ? null : median(rawPlan);
        Double aggMedianPlan = aggPlan.isEmpty() ? null : median(aggPlan);

        Long id = jdbc.queryForObject("""
            INSERT INTO public.database_benchmark_history
              (meter_id, from_date, to_date, repetitions,
               raw_median_execution_ms, aggregate_median_execution_ms,
               raw_median_planning_ms, aggregate_median_planning_ms,
               raw_rows_processed, aggregate_rows_processed, results_match)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
            """, Long.class, meterId, Date.valueOf(from), Date.valueOf(to), repetitions,
                rawMedianExec, aggMedianExec, rawMedianPlan, aggMedianPlan,
                rawRows, aggRows, resultsMatch);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", id);
        response.put("executedAt", jdbc.queryForObject("SELECT executed_at FROM public.database_benchmark_history WHERE id = ?", Object.class, id));
        response.put("database", "TimescaleDB");
        response.put("from", from); response.put("to", to); response.put("meterId", meterId);
        response.put("repetitions", repetitions);
        response.put("resultsMatch", resultsMatch);
        response.put("rawTable", metricMap(rawMedianExec, rawMedianPlan, rawRows, rawExec));
        response.put("continuousAggregate", metricMap(aggMedianExec, aggMedianPlan, aggRows, aggExec));
        response.put("note", "Timings are measured on this database and machine; compare repeated runs under similar load.");
        return response;
    }

    public List<Map<String, Object>> history(int limit) {
        return jdbc.queryForList("""
            SELECT id, executed_at AS \"executedAt\", meter_id AS \"meterId\",
                   from_date AS \"from\", to_date AS \"to\", repetitions,
                   raw_median_execution_ms AS \"rawMedianExecutionMs\",
                   aggregate_median_execution_ms AS \"aggregateMedianExecutionMs\",
                   raw_median_planning_ms AS \"rawMedianPlanningMs\",
                   aggregate_median_planning_ms AS \"aggregateMedianPlanningMs\",
                   raw_rows_processed AS \"rawRowsProcessed\",
                   aggregate_rows_processed AS \"aggregateRowsProcessed\",
                   results_match AS \"resultsMatch\"
            FROM public.database_benchmark_history
            ORDER BY executed_at DESC LIMIT ?
            """, limit);
    }

    private LocalDate[] resolveBounds(LocalDate from, LocalDate to) {
        LocalDate min = jdbc.queryForObject("SELECT MIN(reading_date) FROM public.meter_reading", LocalDate.class);
        LocalDate max = jdbc.queryForObject("SELECT MAX(reading_date) FROM public.meter_reading", LocalDate.class);
        if (min == null || max == null) throw new IllegalArgumentException("meter_reading contains no data to benchmark.");
        return new LocalDate[]{from == null ? min : from, to == null ? max : to};
    }

    private Object[] args(LocalDate from, LocalDate to, Integer meterId) {
        return new Object[]{Date.valueOf(from), Date.valueOf(to), meterId, meterId};
    }

    private PlanStats executeExplain(String sql, LocalDate from, LocalDate to, Integer meterId) {
        try {
            String json = jdbc.queryForObject(sql, (rs, rowNum) -> rs.getString(1), args(from, to, meterId));
            List<?> root = objectMapper.readValue(json, List.class);
            if (root.isEmpty() || !(root.get(0) instanceof Map<?, ?> explain))
                throw new IllegalStateException("Unexpected EXPLAIN JSON returned by PostgreSQL.");
            Double execution = number(explain.get("Execution Time"));
            Double planning = number(explain.get("Planning Time"));
            Object planObj = explain.get("Plan");
            long rows = planObj instanceof Map<?, ?> plan ? scanRows(plan) : 0;
            return new PlanStats(execution == null ? 0 : execution, planning, rows);
        } catch (Exception ex) {
            if (ex instanceof RuntimeException runtime) throw runtime;
            throw new IllegalStateException("Could not parse PostgreSQL EXPLAIN ANALYZE output.", ex);
        }
    }

    private long scanRows(Map<?, ?> node) {
        long rows = 0;
        Object type = node.get("Node Type");
        if (type instanceof String s && s.toLowerCase().contains("scan")) {
            Double actual = number(node.get("Actual Rows"));
            Double loops = number(node.get("Actual Loops"));
            rows += Math.round((actual == null ? 0 : actual) * (loops == null ? 1 : loops));
        }
        Object children = node.get("Plans");
        if (children instanceof List<?> list) {
            for (Object child : list) if (child instanceof Map<?, ?> map) rows += scanRows(map);
        }
        return rows;
    }

    private boolean equivalent(List<Map<String, Object>> a, List<Map<String, Object>> b) {
        if (a.size() != b.size()) return false;
        for (int i = 0; i < a.size(); i++) {
            Map<String, Object> x = a.get(i), y = b.get(i);
            if (!same(x.get("bucket"), y.get("bucket")) || !same(x.get("meter_id"), y.get("meter_id"))
                    || !same(x.get("reading_count"), y.get("reading_count"))
                    || !same(x.get("avg_reading_value"), y.get("avg_reading_value"))
                    || !same(x.get("min_reading_value"), y.get("min_reading_value"))
                    || !same(x.get("max_reading_value"), y.get("max_reading_value"))) return false;
        }
        return true;
    }

    private boolean same(Object a, Object b) {
        if (a == null || b == null) return a == b;
        if (a instanceof Number an && b instanceof Number bn)
            return new java.math.BigDecimal(an.toString()).compareTo(new java.math.BigDecimal(bn.toString())) == 0;
        return a.toString().equals(b.toString());
    }

    private Map<String, Object> metricMap(double execution, Double planning, long rows, List<Double> samples) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("medianExecutionMs", round(execution)); m.put("medianPlanningMs", planning == null ? null : round(planning));
        m.put("rowsProcessed", rows); m.put("executionSamplesMs", samples.stream().map(DatabaseBenchmarkService::round).toList());
        return m;
    }

    private static Double number(Object o) { return o instanceof Number n ? n.doubleValue() : null; }
    private static double median(List<Double> values) {
        List<Double> sorted = values.stream().sorted(Comparator.naturalOrder()).toList();
        int n = sorted.size();
        return n % 2 == 1 ? sorted.get(n / 2) : (sorted.get(n / 2 - 1) + sorted.get(n / 2)) / 2.0;
    }
    private static double round(double d) { return Math.round(d * 1000.0) / 1000.0; }
    private record PlanStats(double executionMs, Double planningMs, long rowsProcessed) {}
}
