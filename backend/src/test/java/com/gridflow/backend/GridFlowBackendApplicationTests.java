
package com.gridflow.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import com.gridflow.backend.service.JwtService;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration",
        "spring.flyway.enabled=false",
        "gridflow.jwt.secret=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
        "gridflow.approval.password-hash=test-only-placeholder"
})
class GridFlowBackendApplicationTests {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    JwtService jwtService;

    @MockitoBean
    JdbcTemplate jdbcTemplate;

    @MockitoBean
    PlatformTransactionManager transactionManager;

    @Test
    void contextLoads() {
    }

    @Test
    void corsPreflightAllowsConfiguredFrontend() throws Exception {
        mockMvc.perform(options("/api/customers")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        "Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void regularUserCannotAccessAdministratorReports() throws Exception {
        String token = jwtService.generateAccessToken(42L, "customer", "USER", 7);
        mockMvc.perform(get("/api/reports/overview")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void userCustomerListUsesTheTokenCustomerMapping() throws Exception {
        String token = jwtService.generateAccessToken(42L, "customer", "USER", 7);
        mockMvc.perform(get("/api/customers")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }
}
