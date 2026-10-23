package com.gridflow.backend.config;

import com.gridflow.backend.service.JwtService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import org.springframework.beans.factory.annotation.Value;
import java.util.List;
import java.util.Arrays;

@Configuration
public class SecurityConfig {

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(
            JwtService jwtService) {
        return new JwtAuthenticationFilter(jwtService);
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            throw new UsernameNotFoundException("Use the GridFlow database-backed login endpoint.");
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${gridflow.cors.allowed-origins:http://localhost:5173}") String allowedOrigins) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim).filter(origin -> !origin.isEmpty()).toList());
        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(
                List.of("Authorization", "Content-Type", "X-Approval-Token"));
        configuration.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        source.registerCorsConfiguration("/swagger-ui/**", configuration);
        source.registerCorsConfiguration("/v3/api-docs/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter)
            throws Exception {

        http
            .cors(cors -> {})
            .csrf(csrf -> csrf.disable())
            .httpBasic(basic -> basic.disable())
            .formLogin(form -> form.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers(
                    "/swagger-ui.html",
                    "/swagger-ui/**",
                    "/v3/api-docs",
                    "/v3/api-docs/**",
                    "/v3/api-docs.yaml"
                ).permitAll()
                .requestMatchers(
                    HttpMethod.POST, "/api/auth/verify-approval"
                ).hasRole("ADMIN")
                .requestMatchers("/api/query", "/api/query/**").hasRole("ADMIN")
                .requestMatchers("/api/reports/**").hasRole("ADMIN")
                .requestMatchers("/api/dashboard/**")
                    .hasAnyRole("ADMIN", "USER")
                .requestMatchers("/api/payment-details/**")
                    .hasRole("ADMIN")
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/property-meters", "/api/meter-services",
                    "/api/customer-phones", "/api/customer-emails",
                    "/api/payment-schedules", "/api/card-payments/**",
                    "/api/cash-payments", "/api/upi-payments",
                    "/api/electricity-services", "/api/water-services"
                ).hasRole("ADMIN")
                .requestMatchers("/api/customers/**", "/api/bills/**",
                    "/api/payments/**", "/api/ownerships/**",
                    "/api/properties/**", "/api/meters/**")
                    .hasAnyRole("ADMIN", "USER")
                .requestMatchers("/api/meter-readings/daily-aggregate",
                    "/api/meter-readings/alerts").hasRole("ADMIN")
                .requestMatchers("/api/meter-readings/**")
                    .hasAnyRole("ADMIN", "USER")
                .requestMatchers("/api/tariffs/**", "/api/services/**")
                    .hasAnyRole("ADMIN", "USER")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/database/benchmarks/**").hasRole("ADMIN")
                .anyRequest().hasRole("ADMIN")
            )
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
