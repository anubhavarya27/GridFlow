package com.gridflow.backend.service;

import com.gridflow.backend.config.JwtAuthenticationFilter.GridFlowPrincipal;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DataAccessException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.jdbc.core.ResultSetExtractor;

import java.sql.ResultSetMetaData;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class QueryService {
    private static final Set<String> BUSINESS_TABLES = Set.of(
            "customer", "customer_phone", "customer_email", "property",
            "customer_owns_property", "meter", "property_incorporate_meter",
            "meter_reading", "utility_service", "electricity_service",
            "water_service", "meter_service", "tariff", "bill",
            "payment_schedule", "payment", "card", "card_payment",
            "cash_payment", "upi_payment");
    private static final Pattern TABLE_REFERENCE = Pattern.compile(
            "(?i)\\b(?:FROM|JOIN)\\s+(?:\"([a-z_][a-z0-9_]*)\"|([a-z_][a-z0-9_]*))(?:\\.(?:\"([a-z_][a-z0-9_]*)\"|([a-z_][a-z0-9_]*)))?");
    private static final Pattern CTE_NAME = Pattern.compile(
            "(?i)(?:\\bWITH\\s+|,)\\s*([a-z_][a-z0-9_]*)\\s+AS\\s*\\(");
    private static final Pattern INSERT = Pattern.compile(
            "(?is)^INSERT\\s+INTO\\s+([a-z_][a-z0-9_]*)\\s*\\([^;]+\\)\\s*VALUES\\s*\\([^;]+\\)(?:\\s*,\\s*\\([^;]+\\))*$");
    private static final Pattern UPDATE = Pattern.compile(
            "(?is)^UPDATE\\s+([a-z_][a-z0-9_]*)\\s+SET\\s+.+\\s+WHERE\\s+.+$");
    private static final Pattern DELETE = Pattern.compile(
            "(?is)^DELETE\\s+FROM\\s+([a-z_][a-z0-9_]*)\\s+WHERE\\s+.+$");
    private static final Pattern SENSITIVE_FUNCTION = Pattern.compile(
            "(?i)\\b(pg_sleep|pg_read_file|pg_read_binary_file|pg_ls_dir|dblink|lo_export|lo_import|set_config|nextval|setval)\\s*\\(");

    private final JdbcTemplate jdbc;
    private final TransactionTemplate readOnly;
    private final TransactionTemplate writeTransaction;

    public QueryService(JdbcTemplate jdbc,
                        PlatformTransactionManager transactionManager) {
        this.jdbc = jdbc;
        this.readOnly = new TransactionTemplate(transactionManager);
        this.readOnly.setReadOnly(true);
        this.writeTransaction = new TransactionTemplate(transactionManager);
    }

    public Map<String, Object> executeOrSubmit(String submittedSql) {
        String sql = normalize(submittedSql);
        if (isReadQuery(sql)) {
            List<Map<String, Object>> rows = readOnly.execute(status -> executeRead(sql));
            return Map.of("mode", "READ_ONLY", "rows", rows,
                    "columns", rows.isEmpty() ? List.of() : new ArrayList<>(rows.getFirst().keySet()),
                    "rowCount", rows.size());
        }

        validateWrite(sql);
        GridFlowPrincipal requester = currentPrincipal();
        Number id = jdbc.queryForObject("""
                INSERT INTO public.query_request (requested_by, query_text)
                VALUES (?, ?)
                RETURNING request_id
                """, Number.class, requester.userId(), sql);
        return Map.of("mode", "PENDING_APPROVAL", "status", "PENDING",
                "request_id", id.longValue(), "query", sql,
                "message", "Submitted for administrator approval.");
    }

    public List<Map<String, Object>> requests() {
        return jdbc.queryForList("""
                SELECT r.request_id, r.query_text, r.status,
                       r.requested_by, requester.username AS requested_by_username,
                       r.created_at, r.reviewed_at, r.reviewed_by,
                       reviewer.username AS reviewed_by_username,
                       r.rejection_reason, r.affected_rows
                FROM public.query_request r
                JOIN public.app_user requester ON requester.user_id = r.requested_by
                LEFT JOIN public.app_user reviewer ON reviewer.user_id = r.reviewed_by
                ORDER BY r.created_at DESC, r.request_id DESC
                LIMIT 500
                """);
    }

    public Map<String, Object> request(long requestId) {
        if (requestId <= 0) throw new IllegalArgumentException("Request ID must be positive.");
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT r.request_id, r.query_text, r.status,
                       r.requested_by, requester.username AS requested_by_username,
                       r.created_at, r.reviewed_at, r.reviewed_by,
                       reviewer.username AS reviewed_by_username,
                       r.rejection_reason, r.affected_rows
                FROM public.query_request r
                JOIN public.app_user requester ON requester.user_id = r.requested_by
                LEFT JOIN public.app_user reviewer ON reviewer.user_id = r.reviewed_by
                WHERE r.request_id = ?
                """, requestId);
        if (rows.isEmpty()) return null;
        Map<String, Object> row = rows.getFirst();
        GridFlowPrincipal principal = currentPrincipal();
        if (!"ADMIN".equals(principal.role())
                && ((Number) row.get("requested_by")).longValue() != principal.userId()) {
            throw new AccessDeniedException("You cannot view another user's query request.");
        }
        return row;
    }

    public Map<String, Object> approve(long requestId, long administratorId) {
        try {
            return writeTransaction.execute(status -> {
                Map<String, Object> pending = pendingRequest(requestId);
                String sql = (String) pending.get("query_text");
                validateWrite(sql);
                int affected = jdbc.update(sql);
                jdbc.update("""
                        UPDATE public.query_request
                        SET status = 'APPROVED', reviewed_at = now(), reviewed_by = ?,
                            affected_rows = ?, rejection_reason = NULL
                        WHERE request_id = ? AND status = 'PENDING'
                        """, administratorId, affected, requestId);
                return Map.of("request_id", requestId, "status", "APPROVED",
                        "affected_rows", affected);
            });
        } catch (DataAccessException exception) {
            jdbc.update("""
                    UPDATE public.query_request
                    SET status = 'FAILED', reviewed_at = now(), reviewed_by = ?,
                        rejection_reason = ?
                    WHERE request_id = ? AND status = 'PENDING'
                    """, administratorId, safeFailure(exception), requestId);
            return Map.of("request_id", requestId, "status", "FAILED",
                    "message", "The approved change could not be applied.");
        }
    }

    public Map<String, Object> reject(long requestId, long administratorId,
                                      String reason) {
        return writeTransaction.execute(status -> {
            pendingRequest(requestId);
            int changed = jdbc.update("""
                    UPDATE public.query_request
                    SET status = 'REJECTED', reviewed_at = now(), reviewed_by = ?,
                        rejection_reason = ?
                    WHERE request_id = ? AND status = 'PENDING'
                    """, administratorId, normalizeReason(reason), requestId);
            if (changed == 0) throw new IllegalStateException("This request was already reviewed.");
            return Map.of("request_id", requestId, "status", "REJECTED");
        });
    }

    private Map<String, Object> pendingRequest(long requestId) {
        if (requestId <= 0) throw new IllegalArgumentException("Request ID must be positive.");
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT request_id, query_text, status
                FROM public.query_request
                WHERE request_id = ?
                FOR UPDATE
                """, requestId);
        if (rows.isEmpty()) throw new IllegalArgumentException("Query request not found.");
        Map<String, Object> request = rows.getFirst();
        if (!"PENDING".equals(request.get("status"))) {
            throw new IllegalStateException("This request was already reviewed.");
        }
        return request;
    }

    private List<Map<String, Object>> executeRead(String sql) {
        jdbc.execute("SET LOCAL statement_timeout = '5s'");
        if (sql.matches("(?is)^SHOW\\s+TABLES$")) {
            List<Map<String, Object>> rows = jdbc.queryForList("""
                    SELECT table_name AS name
                    FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                    ORDER BY table_name
                    """);
            return rows.stream().filter(row -> BUSINESS_TABLES.contains(
                    row.get("name").toString())).toList();
        }

        Matcher describe = Pattern.compile("(?i)^(?:DESCRIBE|DESC)\\s+([a-z_][a-z0-9_]*)$").matcher(sql);
        if (describe.matches()) return describeTable(describe.group(1));
        Matcher showColumns = Pattern.compile("(?i)^SHOW\\s+COLUMNS\\s+FROM\\s+([a-z_][a-z0-9_]*)$").matcher(sql);
        if (showColumns.matches()) return describeTable(showColumns.group(1));

        String query = sql;
        if (query.matches("(?is)^EXPLAIN\\s+.+")) {
            query = query.replaceFirst("(?is)^EXPLAIN\\s+", "");
            query = "EXPLAIN " + query;
            return jdbc.queryForList(query);
        }
        String readSql = query;
        return jdbc.query(connection -> {
            var statement = connection.prepareStatement(readSql);
            statement.setMaxRows(1000);
            statement.setQueryTimeout(5);
            return statement;
        }, (ResultSetExtractor<List<Map<String, Object>>>) resultSet -> {
            List<Map<String, Object>> rows = new ArrayList<>();
            ResultSetMetaData metadata = resultSet.getMetaData();
            while (resultSet.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                for (int column = 1; column <= metadata.getColumnCount(); column++) {
                    row.put(metadata.getColumnLabel(column), resultSet.getObject(column));
                }
                rows.add(row);
            }
            return rows;
        });
    }

    private List<Map<String, Object>> describeTable(String table) {
        if (!BUSINESS_TABLES.contains(table.toLowerCase())) {
            throw new IllegalArgumentException("Unsupported table.");
        }
        return jdbc.queryForList("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = ?
                ORDER BY ordinal_position
                """, table.toLowerCase());
    }

    private boolean isReadQuery(String sql) {
        String upper = sql.toUpperCase();
        boolean read = upper.matches("(?s)^(SELECT|WITH)\\b.*")
                || upper.matches("(?s)^EXPLAIN\\s+(SELECT|WITH)\\b.*")
                || upper.matches("(?is)^SHOW\\s+(TABLES|COLUMNS\\s+FROM\\s+[a-z_][a-z0-9_]*)$")
                || upper.matches("(?is)^(DESCRIBE|DESC)\\s+[a-z_][a-z0-9_]*$");
        if (!read) return false;
        if (SENSITIVE_FUNCTION.matcher(sql).find()
                || upper.contains(" FOR UPDATE") || upper.contains(" FOR SHARE")
                || upper.contains(" INTO ") || upper.contains(";")) {
            throw new IllegalArgumentException("This read query is not permitted.");
        }
        if (upper.startsWith("EXPLAIN") && upper.contains("ANALYZE")) {
            throw new IllegalArgumentException("EXPLAIN ANALYZE is not permitted.");
        }
        if (sql.contains("--") || sql.contains("/*") || sql.contains("*/")
                || upper.matches("(?s).*\\b(INSERT|UPDATE|DELETE|MERGE|CREATE|ALTER|DROP|TRUNCATE|CALL|DO)\\b.*")
                || upper.contains("RECURSIVE")) {
            throw new IllegalArgumentException("This read query is not permitted.");
        }
        validateReadTables(sql);
        return true;
    }

    private void validateReadTables(String sql) {
        Set<String> allowed = new java.util.HashSet<>(BUSINESS_TABLES);
        Matcher ctes = CTE_NAME.matcher(sql);
        while (ctes.find()) allowed.add(ctes.group(1).toLowerCase());
        Matcher references = TABLE_REFERENCE.matcher(sql);
        while (references.find()) {
            String first = references.group(1) != null ? references.group(1) : references.group(2);
            String table = references.group(3) != null ? references.group(3)
                    : references.group(4) != null ? references.group(4) : first;
            if ((references.group(3) != null || references.group(4) != null)
                    && !"public".equalsIgnoreCase(first)) {
                throw new IllegalArgumentException("Queries may read application business tables only.");
            }
            if (!allowed.contains(table.toLowerCase())) {
                throw new IllegalArgumentException("Queries may read application business tables only.");
            }
        }
    }

    private void validateWrite(String sql) {
        String upper = sql.toUpperCase();
        if (upper.contains(";") || sql.contains("--") || sql.contains("/*")
                || sql.contains("*/") || upper.contains(" RETURNING ")) {
            throw new IllegalArgumentException("Submit one supported data change without comments or extra statements.");
        }
        Matcher matcher = INSERT.matcher(sql);
        if (!matcher.matches()) matcher = UPDATE.matcher(sql);
        if (!matcher.matches()) matcher = DELETE.matcher(sql);
        if (!matcher.matches() || !BUSINESS_TABLES.contains(matcher.group(1).toLowerCase())) {
            throw new IllegalArgumentException("Only INSERT, UPDATE, and DELETE statements on application business tables can be submitted.");
        }
        if (upper.contains(" SELECT ") || upper.contains(" COPY ")
                || upper.contains(" CALL ") || upper.contains(" DO ")) {
            throw new IllegalArgumentException("This data-change statement is not supported.");
        }
    }

    private String normalize(String query) {
        if (query == null || query.isBlank()) throw new IllegalArgumentException("Query is required.");
        String sql = query.trim();
        if (sql.endsWith(";") && sql.indexOf(';') == sql.length() - 1) {
            sql = sql.substring(0, sql.length() - 1).trim();
        }
        if (sql.length() > 10000) throw new IllegalArgumentException("Query is too long.");
        if (sql.contains("\u0000")) throw new IllegalArgumentException("Query contains an invalid character.");
        return sql;
    }

    private String normalizeReason(String reason) {
        if (reason == null || reason.isBlank()) return "Request rejected by an administrator.";
        return reason.trim().substring(0, Math.min(reason.trim().length(), 500));
    }

    private String safeFailure(RuntimeException exception) {
        // Database exceptions can contain the submitted SQL and values; keep details out of the approval queue.
        return "Database rejected this change. Review the record and submit a corrected request.";
    }

    private GridFlowPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof GridFlowPrincipal principal)) {
            throw new AccessDeniedException("Authentication is required.");
        }
        return principal;
    }
}
