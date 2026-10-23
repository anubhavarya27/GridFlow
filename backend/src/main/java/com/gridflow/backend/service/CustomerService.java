package com.gridflow.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class CustomerService {
    private final JdbcTemplate jdbcTemplate;

    public CustomerService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> getCustomers() {
        return getCustomers(null);
    }

    public List<Map<String, Object>> getCustomers(Integer customerId) {
        if (customerId == null) {
            return jdbcTemplate.queryForList("""
                    SELECT c.cust_id, c.cust_name, c.apartment,
                           c.flat_no, c.city, c.dob,
                           (SELECT string_agg(e.email, ', ' ORDER BY e.email)
                            FROM customer_email e WHERE e.cust_id = c.cust_id) AS emails,
                           (SELECT string_agg(p.phone_no, ', ' ORDER BY p.phone_no)
                            FROM customer_phone p WHERE p.cust_id = c.cust_id) AS phone_numbers
                    FROM customer c
                    ORDER BY c.cust_id
                    """);
        }
        String sql = """
            SELECT c.cust_id, c.cust_name, c.apartment,
                   c.flat_no, c.city, c.dob,
                   (SELECT string_agg(e.email, ', ' ORDER BY e.email)
                    FROM customer_email e WHERE e.cust_id = c.cust_id) AS emails,
                   (SELECT string_agg(p.phone_no, ', ' ORDER BY p.phone_no)
                    FROM customer_phone p WHERE p.cust_id = c.cust_id) AS phone_numbers
            FROM customer c
            WHERE (?::integer IS NULL OR c.cust_id = ?::integer)
            ORDER BY c.cust_id
            """;
        return jdbcTemplate.queryForList(sql, customerId, customerId);
    }

    public Map<String, Object> getCustomerById(int customerId) {
        return getCustomerById(customerId, null);
    }

    public Map<String, Object> getCustomerById(int customerId, Integer customerScope) {
        if (customerScope == null) {
            String sql = """
                SELECT c.cust_id, c.cust_name, c.apartment,
                       c.flat_no, c.city, c.dob,
                       (SELECT string_agg(e.email, ', ' ORDER BY e.email)
                        FROM customer_email e WHERE e.cust_id = c.cust_id) AS emails,
                       (SELECT string_agg(p.phone_no, ', ' ORDER BY p.phone_no)
                        FROM customer_phone p WHERE p.cust_id = c.cust_id) AS phone_numbers
                FROM customer c WHERE c.cust_id = ?
                """;
            List<Map<String, Object>> adminRows = jdbcTemplate.queryForList(sql, customerId);
            return adminRows.isEmpty() ? null : adminRows.get(0);
        }
        String sql = """
            SELECT c.cust_id, c.cust_name, c.apartment,
                   c.flat_no, c.city, c.dob,
                   (SELECT string_agg(e.email, ', ' ORDER BY e.email)
                    FROM customer_email e WHERE e.cust_id = c.cust_id) AS emails,
                   (SELECT string_agg(p.phone_no, ', ' ORDER BY p.phone_no)
                    FROM customer_phone p WHERE p.cust_id = c.cust_id) AS phone_numbers
            FROM customer c
            WHERE c.cust_id = ?
              AND (?::integer IS NULL OR c.cust_id = ?::integer)
            """;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                sql, customerId, customerScope, customerScope);
        return rows.isEmpty() ? null : rows.get(0);
    }
}
