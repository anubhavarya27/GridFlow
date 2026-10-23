const express = require("express");
const cors = require("cors");
require("dotenv").config();

// ================================
// Routes
// ================================
const customerRoutes = require("./routes/customerRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const meterRoutes = require("./routes/meterRoutes");
const authRoutes = require("./routes/authRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const billRoutes = require("./routes/billRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const readingRoutes = require("./routes/readingRoutes");
const requestRoutes = require("./routes/requestRoutes");
const reportRoutes = require("./routes/reportRoutes");
const queryRoutes = require("./routes/queryRoutes");

const ownershipRoutes = require("./routes/ownershipRoutes");
const customerPhoneRoutes = require("./routes/customerPhoneRoutes");
const customerEmailRoutes = require("./routes/customerEmailRoutes");
const propertyMeterRoutes = require("./routes/propertyMeterRoutes");
const meterServiceRoutes = require("./routes/meterServiceRoutes");
const electricityServiceRoutes = require("./routes/electricityServiceRoutes");
const waterServiceRoutes = require("./routes/waterServiceRoutes");
const tariffRoutes = require("./routes/tariffRoutes");
const paymentScheduleRoutes = require("./routes/paymentScheduleRoutes");
const cardPaymentRoutes = require("./routes/cardPaymentRoutes");
const cashPaymentRoutes = require("./routes/cashPaymentRoutes");
const upiPaymentRoutes = require("./routes/upiPaymentRoutes");

// ================================
// Error Handler
// ================================
const errorHandler = require("./middleware/errorHandler");

const app = express();

const PORT = process.env.PORT || 5000;

// ================================
// Middleware
// ================================
app.use(cors());
app.use(express.json());

// ================================
// Root Route
// ================================
app.get("/", (req, res) => {
    res.json({
        message: "Utility Billing Management System API is running"
    });
});

// ================================
// Main API Routes
// ================================
app.use("/api/customers", customerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/meters", meterRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/readings", readingRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/query", queryRoutes);

// ================================
// Relationship Routes
// ================================
app.use("/api/ownerships", ownershipRoutes);
app.use("/api/customer-phones", customerPhoneRoutes);
app.use("/api/customer-emails", customerEmailRoutes);
app.use("/api/property-meters", propertyMeterRoutes);
app.use("/api/meter-services", meterServiceRoutes);

// ================================
// Service Specialization Routes
// ================================
app.use("/api/electricity-services", electricityServiceRoutes);
app.use("/api/water-services", waterServiceRoutes);

// ================================
// Tariff & Payment Schedule Routes
// ================================
app.use("/api/tariffs", tariffRoutes);
app.use("/api/payment-schedules", paymentScheduleRoutes);

// ================================
// Payment Specialization Routes
// ================================
app.use("/api/card-payments", cardPaymentRoutes);
app.use("/api/cash-payments", cashPaymentRoutes);
app.use("/api/upi-payments", upiPaymentRoutes);

// ================================
// 404 Route Handler
// ================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// ================================
// Error Handler
// ================================
app.use(errorHandler);

// ================================
// Start Server
// ================================
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});