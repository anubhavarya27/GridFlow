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
        String sql = """
            SELECT c.cust_id, c.cust_name, c.apartment,
                   c.flat_no, c.city, c.dob,
                   (SELECT string_agg(e.email, ', ' ORDER BY e.email)
                    FROM customer_email e WHERE e.cust_id = c.cust_id) AS emails,
                   (SELECT string_agg(p.phone_no, ', ' ORDER BY p.phone_no)
                    FROM customer_phone p WHERE p.cust_id = c.cust_id) AS phone_numbers
            FROM customer c
            ORDER BY c.cust_id
            """;
        return jdbcTemplate.queryForList(sql);
    }

    public Map<String, Object> getCustomerById(int customerId) {
        String sql = """
            SELECT c.cust_id, c.cust_name, c.apartment,
                   c.flat_no, c.city, c.dob,
                   (SELECT string_agg(e.email, ', ' ORDER BY e.email)
                    FROM customer_email e WHERE e.cust_id = c.cust_id) AS emails,
                   (SELECT string_agg(p.phone_no, ', ' ORDER BY p.phone_no)
                    FROM customer_phone p WHERE p.cust_id = c.cust_id) AS phone_numbers
            FROM customer c
            WHERE c.cust_id = ?
            """;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, customerId);
        return rows.isEmpty() ? null : rows.get(0);
    }
}