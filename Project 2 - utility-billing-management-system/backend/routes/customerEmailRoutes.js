const express = require("express");

const router = express.Router();

const {
    getCustomerEmails,
    getCustomerEmailsByCustomer,
    getCustomerEmailByIds
} = require("../controllers/customerEmailController");

// GET all customer email addresses
router.get("/", getCustomerEmails);

// GET email addresses for a specific customer
router.get("/customer/:customerId", getCustomerEmailsByCustomer);

// GET one email address by customer and email
router.get("/:customerId/:email", getCustomerEmailByIds);

module.exports = router;