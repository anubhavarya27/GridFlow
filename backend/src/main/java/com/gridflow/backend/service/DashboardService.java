package com.gridflow.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final JdbcTemplate jdbcTemplate;

    public DashboardService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Map<String, Object> getSummary() {
        String sql = """
            SELECT
                (SELECT COUNT(*) FROM customer) AS total_customers,
                (SELECT COUNT(*) FROM property) AS total_properties,
                (SELECT COUNT(*) FROM meter) AS total_meters,
                (SELECT COUNT(*) FROM bill) AS total_bills,
                (SELECT COALESCE(SUM(amount), 0) FROM payment) AS total_revenue
            """;

        return jdbcTemplate.queryForMap(sql);
    }

    public Map<String, Object> getSummary(Integer customerId) {
        if (customerId == null) return getSummary();
        return jdbcTemplate.queryForMap("""
            SELECT
                1::bigint AS total_customers,
                (SELECT COUNT(DISTINCT own.property_id) FROM customer_owns_property own WHERE own.cust_id = ?) AS total_properties,
                (SELECT COUNT(DISTINCT pm.meter_id) FROM property_incorporate_meter pm JOIN customer_owns_property own ON own.property_id = pm.property_id WHERE own.cust_id = ?) AS total_meters,
                (SELECT COUNT(*) FROM bill b WHERE EXISTS (SELECT 1 FROM property_incorporate_meter pm JOIN customer_owns_property own ON own.property_id = pm.property_id WHERE pm.meter_id = b.meter_id AND own.cust_id = ?)) AS total_bills,
                (SELECT COALESCE(SUM(p.amount), 0) FROM payment p JOIN bill b ON b.bill_id = p.bill_id WHERE EXISTS (SELECT 1 FROM property_incorporate_meter pm JOIN customer_owns_property own ON own.property_id = pm.property_id WHERE pm.meter_id = b.meter_id AND own.cust_id = ?)) AS total_revenue
            """, customerId, customerId, customerId, customerId);
    }

    public List<Map<String, Object>> getBillStatus() {
        String sql = """
            SELECT bill_status, COUNT(*) AS bill_count
            FROM bill
            GROUP BY bill_status
            ORDER BY bill_status
            """;

        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getBillStatus(Integer customerId) {
        if (customerId == null) return getBillStatus();
        return jdbcTemplate.queryForList("""
            SELECT b.bill_status, COUNT(*) AS bill_count
            FROM bill b
            WHERE EXISTS (SELECT 1 FROM property_incorporate_meter pm
                JOIN customer_owns_property own ON own.property_id = pm.property_id
                WHERE pm.meter_id = b.meter_id AND own.cust_id = ?)
            GROUP BY b.bill_status ORDER BY b.bill_status
            """, customerId);
    }

    public List<Map<String, Object>> getPaymentMethods() {
        String sql = """
            SELECT payment_mode, COUNT(*) AS payment_count
            FROM payment
            GROUP BY payment_mode
            ORDER BY payment_mode
            """;

        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getPaymentMethods(Integer customerId) {
        if (customerId == null) return getPaymentMethods();
        return jdbcTemplate.queryForList("""
            SELECT p.payment_mode, COUNT(*) AS payment_count
            FROM payment p JOIN bill b ON b.bill_id = p.bill_id
            WHERE EXISTS (SELECT 1 FROM property_incorporate_meter pm
                JOIN customer_owns_property own ON own.property_id = pm.property_id
                WHERE pm.meter_id = b.meter_id AND own.cust_id = ?)
            GROUP BY p.payment_mode ORDER BY p.payment_mode
            """, customerId);
    }

    public List<Map<String, Object>> getConsumption() {
        String sql = """
            WITH valid_readings AS (
                SELECT
                    meter_id,
                    reading_date,
                    reading_value,
                    LAG(reading_value) OVER (
                        PARTITION BY meter_id
                        ORDER BY reading_date, reading_no
                    ) AS previous_value
                FROM meter_reading
                WHERE reading_status = 'Valid'
            )
            SELECT
                TO_CHAR(DATE_TRUNC('month', reading_date), 'YYYY-MM') AS month,
                SUM(reading_value - previous_value) AS consumption
            FROM valid_readings
            WHERE previous_value IS NOT NULL
            GROUP BY DATE_TRUNC('month', reading_date)
            ORDER BY DATE_TRUNC('month', reading_date)
            """;

        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getConsumption(Integer customerId) {
        if (customerId == null) return getConsumption();
        return jdbcTemplate.queryForList("""
            WITH valid_readings AS (
                SELECT meter_id, reading_date, reading_no, reading_value,
                       LAG(reading_value) OVER (PARTITION BY meter_id ORDER BY reading_date, reading_no) AS previous_value
                FROM meter_reading r
                WHERE reading_status = 'Valid' AND EXISTS (
                    SELECT 1 FROM property_incorporate_meter pm
                    JOIN customer_owns_property own ON own.property_id = pm.property_id
                    WHERE pm.meter_id = r.meter_id AND own.cust_id = ?)
            )
            SELECT TO_CHAR(DATE_TRUNC('month', reading_date), 'YYYY-MM') AS month,
                   SUM(reading_value - previous_value) AS consumption
            FROM valid_readings WHERE previous_value IS NOT NULL
            GROUP BY DATE_TRUNC('month', reading_date)
            ORDER BY DATE_TRUNC('month', reading_date)
            """, customerId);
    }

    public List<Map<String, Object>> getRevenue() {
        String sql = """
            SELECT
                TO_CHAR(DATE_TRUNC('month', payment_date), 'YYYY-MM') AS month,
                SUM(amount) AS revenue
            FROM payment
            GROUP BY DATE_TRUNC('month', payment_date)
            ORDER BY DATE_TRUNC('month', payment_date)
            """;

        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getRevenue(Integer customerId) {
        if (customerId == null) return getRevenue();
        return jdbcTemplate.queryForList("""
            SELECT TO_CHAR(DATE_TRUNC('month', p.payment_date), 'YYYY-MM') AS month,
                   SUM(p.amount) AS revenue
            FROM payment p JOIN bill b ON b.bill_id = p.bill_id
            WHERE EXISTS (SELECT 1 FROM property_incorporate_meter pm
                JOIN customer_owns_property own ON own.property_id = pm.property_id
                WHERE pm.meter_id = b.meter_id AND own.cust_id = ?)
            GROUP BY DATE_TRUNC('month', p.payment_date)
            ORDER BY DATE_TRUNC('month', p.payment_date)
            """, customerId);
    }

    public List<Map<String, Object>> getTopMeters() {
        return jdbcTemplate.queryForList("""
            WITH usage_by_meter AS (
                SELECT meter_id, SUM(reading_value - previous_value) AS total_consumption
                FROM (
                    SELECT meter_id, reading_date, reading_no, reading_value,
                           LAG(reading_value) OVER (
                               PARTITION BY meter_id ORDER BY reading_date, reading_no
                           ) AS previous_value
                    FROM meter_reading
                    WHERE reading_status = 'Valid'
                ) readings
                WHERE previous_value IS NOT NULL
                GROUP BY meter_id
            )
            SELECT meter_id, total_consumption
            FROM usage_by_meter
            ORDER BY total_consumption DESC, meter_id
            LIMIT 10
            """);
    }

    public List<Map<String, Object>> getTopMeters(Integer customerId) {
        if (customerId == null) return getTopMeters();
        return jdbcTemplate.queryForList("""
            WITH readings AS (
                SELECT r.meter_id, r.reading_date, r.reading_no, r.reading_value,
                       LAG(r.reading_value) OVER (PARTITION BY r.meter_id ORDER BY r.reading_date, r.reading_no) AS previous_value
                FROM meter_reading r
                WHERE r.reading_status = 'Valid' AND EXISTS (
                    SELECT 1 FROM property_incorporate_meter pm
                    JOIN customer_owns_property own ON own.property_id = pm.property_id
                    WHERE pm.meter_id = r.meter_id AND own.cust_id = ?)
            )
            SELECT meter_id, SUM(reading_value - previous_value) AS total_consumption
            FROM readings WHERE previous_value IS NOT NULL
            GROUP BY meter_id ORDER BY total_consumption DESC, meter_id LIMIT 10
            """, customerId);
    }

    public List<Map<String, Object>> getCustomerSummary() {
        return jdbcTemplate.queryForList("""
            SELECT c.cust_id, c.cust_name,
                   COUNT(DISTINCT b.bill_id) AS bill_count,
                   COALESCE(SUM(p.amount), 0) AS total_paid
            FROM customer c
            LEFT JOIN customer_owns_property own ON own.cust_id = c.cust_id
            LEFT JOIN property_incorporate_meter pm ON pm.property_id = own.property_id
            LEFT JOIN bill b ON b.meter_id = pm.meter_id
            LEFT JOIN payment p ON p.bill_id = b.bill_id
            GROUP BY c.cust_id, c.cust_name
            ORDER BY c.cust_id
            """);
    }

    public List<Map<String, Object>> getCustomerSummary(Integer customerId) {
        if (customerId == null) return getCustomerSummary();
        return jdbcTemplate.queryForList("""
            SELECT c.cust_id, c.cust_name,
                   COUNT(DISTINCT b.bill_id) AS bill_count,
                   COALESCE(SUM(p.amount), 0) AS total_paid
            FROM customer c
            LEFT JOIN customer_owns_property own ON own.cust_id = c.cust_id
            LEFT JOIN property_incorporate_meter pm ON pm.property_id = own.property_id
            LEFT JOIN bill b ON b.meter_id = pm.meter_id
            LEFT JOIN payment p ON p.bill_id = b.bill_id
            WHERE c.cust_id = ?
            GROUP BY c.cust_id, c.cust_name
            """, customerId);
    }

    public List<Map<String, Object>> getServiceDistribution() {
        return jdbcTemplate.queryForList("""
            SELECT CASE
                       WHEN es.service_id IS NOT NULL THEN 'Electricity'
                       WHEN ws.service_id IS NOT NULL THEN 'Water'
                       ELSE 'Other'
                   END AS service_type,
                   COUNT(DISTINCT ms.meter_id) AS meter_count
            FROM meter_service ms
            LEFT JOIN electricity_service es ON es.service_id = ms.service_id
            LEFT JOIN water_service ws ON ws.service_id = ms.service_id
            GROUP BY service_type
            ORDER BY service_type
            """);
    }

    public List<Map<String, Object>> getServiceDistribution(Integer customerId) {
        if (customerId == null) return getServiceDistribution();
        return jdbcTemplate.queryForList("""
            SELECT CASE WHEN es.service_id IS NOT NULL THEN 'Electricity'
                        WHEN ws.service_id IS NOT NULL THEN 'Water' ELSE 'Other' END AS service_type,
                   COUNT(DISTINCT ms.meter_id) AS meter_count
            FROM meter_service ms
            LEFT JOIN electricity_service es ON es.service_id = ms.service_id
            LEFT JOIN water_service ws ON ws.service_id = ms.service_id
            WHERE EXISTS (SELECT 1 FROM property_incorporate_meter pm
                JOIN customer_owns_property own ON own.property_id = pm.property_id
                WHERE pm.meter_id = ms.meter_id AND own.cust_id = ?)
            GROUP BY service_type ORDER BY service_type
            """, customerId);
    }

    public List<Map<String, Object>> getMeterStatus() {
        return jdbcTemplate.queryForList("""
            SELECT meter_status, COUNT(*) AS meter_count
            FROM meter
            GROUP BY meter_status
            ORDER BY meter_status
            """);
    }

    public List<Map<String, Object>> getMeterStatus(Integer customerId) {
        if (customerId == null) return getMeterStatus();
        return jdbcTemplate.queryForList("""
            SELECT m.meter_status, COUNT(*) AS meter_count
            FROM meter m
            WHERE EXISTS (SELECT 1 FROM property_incorporate_meter pm
                JOIN customer_owns_property own ON own.property_id = pm.property_id
                WHERE pm.meter_id = m.meter_id AND own.cust_id = ?)
            GROUP BY m.meter_status ORDER BY m.meter_status
            """, customerId);
    }
}
