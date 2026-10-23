const express = require("express");

const router = express.Router();

const {
    getCustomerPhones,
    getCustomerPhonesByCustomer,
    getCustomerPhoneByIds
} = require("../controllers/customerPhoneController");

// GET all customer phone numbers
router.get("/", getCustomerPhones);

// GET phone numbers for a specific customer
router.get("/customer/:customerId", getCustomerPhonesByCustomer);

// GET one phone number by customer and phone number
router.get("/:customerId/:phoneNo", getCustomerPhoneByIds);

module.exports = router;