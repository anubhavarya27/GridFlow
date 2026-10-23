package com.gridflow.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DataExplorerService {
    private final JdbcTemplate jdbc;

    public DataExplorerService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> list(String resource) {
        String sql = switch (resource) {
            case "property-meters" -> "SELECT * FROM property_incorporate_meter ORDER BY property_id, meter_id";
            case "meter-services" -> "SELECT * FROM meter_service ORDER BY meter_id, service_id";
            case "customer-phones" -> "SELECT * FROM customer_phone ORDER BY cust_id, phone_no";
            case "customer-emails" -> "SELECT * FROM customer_email ORDER BY cust_id, email";
            case "payment-schedules" -> "SELECT * FROM payment_schedule ORDER BY payment_sequence";
            case "cards" -> "SELECT * FROM card ORDER BY card_no";
            case "card-payments" -> "SELECT * FROM card_payment ORDER BY payment_id";
            case "cash-payments" -> "SELECT * FROM cash_payment ORDER BY payment_id";
            case "upi-payments" -> "SELECT * FROM upi_payment ORDER BY payment_id";
            case "electricity-services" -> "SELECT * FROM electricity_service ORDER BY service_id";
            case "water-services" -> "SELECT * FROM water_service ORDER BY service_id";
            default -> throw new IllegalArgumentException("Unsupported resource.");
        };
        return jdbc.queryForList(sql);
    }
}
