
package com.gridflow.backend.controller;

import com.gridflow.backend.dto.VerifyApprovalRequest;
import com.gridflow.backend.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import com.gridflow.backend.config.JwtAuthenticationFilter.GridFlowPrincipal;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ApiControllerTests {
    private BillService bills;
    private CustomerService customers;
    private DashboardService dashboard;
    private MeterReadingService readings;
    private OwnershipService ownerships;
    private PaymentService payments;
    private PaymentDetailsService paymentDetails;
    private PropertyService properties;
    private TariffService tariffs;
    private UtilityServiceService utilityServices;
    private AuthService auth;

    private BillController billController;
    private CustomerController customerController;
    private DashboardController dashboardController;
    private HealthController healthController;
    private MeterReadingController meterReadingController;
    private OwnershipController ownershipController;
    private PaymentController paymentController;
    private PaymentDetailsController paymentDetailsController;
    private PropertyController propertyController;
    private TariffController tariffController;
    private UtilityServiceController utilityServiceController;
    private AuthController authController;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new GridFlowPrincipal(1L, "admin", "ADMIN"), null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
        bills = mock(BillService.class);
        customers = mock(CustomerService.class);
        dashboard = mock(DashboardService.class);
        readings = mock(MeterReadingService.class);
        ownerships = mock(OwnershipService.class);
        payments = mock(PaymentService.class);
        paymentDetails = mock(PaymentDetailsService.class);
        properties = mock(PropertyService.class);
        tariffs = mock(TariffService.class);
        utilityServices = mock(UtilityServiceService.class);
        auth = mock(AuthService.class);

        billController = new BillController(bills);
        customerController = new CustomerController(customers);
        dashboardController = new DashboardController(dashboard);
        healthController = new HealthController();
        meterReadingController = new MeterReadingController(readings);
        ownershipController = new OwnershipController(ownerships);
        paymentController = new PaymentController(payments);
        paymentDetailsController = new PaymentDetailsController(paymentDetails);
        propertyController = new PropertyController(properties);
        tariffController = new TariffController(tariffs);
        utilityServiceController = new UtilityServiceController(utilityServices);
        authController = new AuthController(auth);
    }

    @Test
    void healthEndpointReportsRunning() {
        Map<String, Object> result = healthController.health();
        assertEquals(true, result.get("success"));
        assertEquals("GridFlow backend is running", result.get("message"));
    }

    @Test
    void billsEndpointReturnsServiceData() {
        var rows = List.of(Map.<String, Object>of("bill_id", 1));
        when(bills.getBills()).thenReturn(rows);

        assertEquals(rows, billController.getBills().data());
    }

    @Test
    void billEndpointRejectsNonPositiveId() {
        var response = billController.getBillById(0);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verifyNoInteractions(bills);
    }

    @Test
    void billEndpointReturnsNotFoundWhenMissing() {
        when(bills.getBillById(999)).thenReturn(null);

        var response = billController.getBillById(999);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void billEndpointReturnsExistingBill() {
        Map<String, Object> bill = Map.of("bill_id", 1);
        when(bills.getBillById(1)).thenReturn(bill);

        var response = billController.getBillById(1);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(bill, response.getBody().data());
    }

    @Test
    void customersEndpointReturnsServiceData() {
        var rows = List.of(Map.<String, Object>of("cust_id", 1));
        when(customers.getCustomers()).thenReturn(rows);

        assertEquals(rows, customerController.getCustomers().data());
    }

    @Test
    void customerEndpointRejectsNonPositiveId() {
        var response = customerController.getCustomerById(-1);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verifyNoInteractions(customers);
    }

    @Test
    void customerEndpointReturnsNotFoundWhenMissing() {
        when(customers.getCustomerById(999)).thenReturn(null);

        assertEquals(HttpStatus.NOT_FOUND,
            customerController.getCustomerById(999).getStatusCode());
    }

    @Test
    void dashboardEndpointsReturnServiceResults() {
        when(dashboard.getSummary()).thenReturn(Map.of("customers", 10));
        when(dashboard.getBillStatus()).thenReturn(List.of());
        when(dashboard.getPaymentMethods()).thenReturn(List.of());
        when(dashboard.getConsumption()).thenReturn(List.of());
        when(dashboard.getRevenue()).thenReturn(List.of());

        assertEquals(10, dashboardController.getSummary().data().get("customers"));
        assertTrue(dashboardController.getBillStatus().data().isEmpty());
        assertTrue(dashboardController.getPaymentMethods().data().isEmpty());
        assertTrue(dashboardController.getConsumption().data().isEmpty());
        assertTrue(dashboardController.getRevenue().data().isEmpty());
    }

    @Test
    void meterReadingsEndpointReturnsServiceResults() {
        var rows = List.of(Map.<String, Object>of("meter_id", 1));
        when(readings.getReadings()).thenReturn(rows);

        assertEquals(rows, meterReadingController.getReadings().data());
    }

    @Test
    void meterReadingsByIdRejectsNonPositiveId() {
        var response = meterReadingController.getReadingsByMeterId(0);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verifyNoInteractions(readings);
    }

    @Test
    void meterConsumptionRejectsInvalidIdAndDateRange() {
        LocalDate from = LocalDate.of(2026, 10, 23);
        LocalDate to = LocalDate.of(2026, 10, 1);

        var invalidMeter =
            meterReadingController.getConsumption(0, from, to);
        var invalidDates =
            meterReadingController.getConsumption(1, from, to);

        assertEquals(HttpStatus.BAD_REQUEST, invalidMeter.getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST, invalidDates.getStatusCode());
        verifyNoInteractions(readings);
    }

    @Test
    void meterConsumptionPassesValidParametersToService() {
        LocalDate from = LocalDate.of(2026, 10, 1);
        LocalDate to = LocalDate.of(2026, 10, 23);
        var rows = List.of(Map.<String, Object>of("consumption", 35));
        when(readings.getConsumption(7, from, to)).thenReturn(rows);

        var response = meterReadingController.getConsumption(7, from, to);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(rows, response.getBody().data());
        verify(readings).getConsumption(7, from, to);
    }

    @Test
    void ownershipEndpointRejectsNonPositiveCustomerId() {
        var response = ownershipController.getOwnershipsByCustomerId(0);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verifyNoInteractions(ownerships);
    }

    @Test
    void ownershipEndpointReturnsResultsForValidCustomer() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new GridFlowPrincipal(1L, "admin", "ADMIN"), null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
        var rows = List.of(Map.<String, Object>of("cust_id", 3));
        when(ownerships.getOwnershipsByCustomerId(3)).thenReturn(rows);

        var response = ownershipController.getOwnershipsByCustomerId(3);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(rows, response.getBody().data());
    }

    @Test
    void userCannotReadAnotherCustomersOwnership() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new GridFlowPrincipal(12L, "customer", "USER", 3), null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        var response = ownershipController.getOwnershipsByCustomerId(4);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        verifyNoInteractions(ownerships);
    }

    @Test
    void paymentEndpointRejectsNonPositiveBillId() {
        var response = paymentController.getPaymentsByBillId(-1);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verifyNoInteractions(payments);
    }

    @Test
    void paymentEndpointReturnsResultsForBill() {
        var rows = List.of(Map.<String, Object>of("bill_id", 4));
        when(payments.getPaymentsByBillId(4)).thenReturn(rows);

        var response = paymentController.getPaymentsByBillId(4);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(rows, response.getBody().data());
    }

    @Test
    void paymentDetailsEndpointReturnsAllowedResource() {
        var rows = List.of(Map.<String, Object>of("payment_id", 1));
        when(paymentDetails.getTableRows("card_payment")).thenReturn(rows);

        var response = paymentDetailsController.getResource("card_payment");
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(rows, response.getBody().data());
    }

    @Test
    void paymentDetailsEndpointMapsUnsupportedResourceToNotFound() {
        when(paymentDetails.getTableRows("unsupported"))
            .thenThrow(new IllegalArgumentException("Unsupported resource."));

        var response = paymentDetailsController.getResource("unsupported");
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void propertiesAndMetersEndpointsReturnServiceData() {
        var propertyRows = List.of(Map.<String, Object>of("property_id", 1));
        var meterRows = List.of(Map.<String, Object>of("meter_id", 2));
        when(properties.getProperties()).thenReturn(propertyRows);
        when(properties.getMeters()).thenReturn(meterRows);

        assertEquals(propertyRows, propertyController.getProperties().data());
        assertEquals(meterRows, propertyController.getMeters().data());
    }

    @Test
    void tariffEndpointReturnsAllTariffs() {
        var rows = List.of(Map.<String, Object>of("tariff_code", "T1"));
        when(tariffs.getTariffs()).thenReturn(rows);

        assertEquals(rows, tariffController.getTariffs().data());
    }

    @Test
    void tariffEndpointReturnsNotFoundForUnknownCode() {
        when(tariffs.getTariffByCode("UNKNOWN")).thenReturn(null);

        assertEquals(HttpStatus.NOT_FOUND,
            tariffController.getTariffByCode("UNKNOWN").getStatusCode());
    }

    @Test
    void tariffEndpointReturnsMatchingTariff() {
        var tariff = Map.<String, Object>of("tariff_code", "T1");
        when(tariffs.getTariffByCode("T1")).thenReturn(tariff);

        var response = tariffController.getTariffByCode("T1");
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(tariff, response.getBody().data());
    }

    @Test
    void utilityServiceEndpointsReturnServiceResults() {
        var utility = List.of(Map.<String, Object>of("service_id", 1));
        var electricity = List.of(Map.<String, Object>of("service_id", 2));
        var water = List.of(Map.<String, Object>of("service_id", 3));

        when(utilityServices.getUtilityServices()).thenReturn(utility);
        when(utilityServices.getElectricityServices()).thenReturn(electricity);
        when(utilityServices.getWaterServices()).thenReturn(water);

        assertEquals(utility, utilityServiceController.getUtilityServices().data());
        assertEquals(electricity, utilityServiceController.getElectricityServices().data());
        assertEquals(water, utilityServiceController.getWaterServices().data());
    }

    @Test
    void approvalEndpointReturnsTokenFromService() {
        when(auth.validateApprovalRequest(any(VerifyApprovalRequest.class)))
            .thenReturn("test-approval-token");

        var response = authController.verifyApproval(
            new VerifyApprovalRequest("test-password"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("test-approval-token",
            ((Map<?, ?>) response.getBody().data()).get("approvalToken"));
    }

    @Test
    void approvalEndpointPropagatesAuthorizationDenial() {
        when(auth.validateApprovalRequest(any(VerifyApprovalRequest.class)))
            .thenThrow(new AccessDeniedException("Administrator access is required."));

        var response = authController.verifyApproval(
            new VerifyApprovalRequest("test-password"));

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("Administrator access is required.",
            response.getBody().message());
    }
}
