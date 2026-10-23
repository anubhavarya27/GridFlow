const express = require("express");

const router = express.Router();

const {
    getOwnerships,
    getOwnershipsByCustomer,
    getOwnershipByIds
} = require("../controllers/ownershipController");

// GET all ownership records
router.get("/", getOwnerships);

// GET ownership records for a specific customer
router.get("/customer/:customerId", getOwnershipsByCustomer);

// GET one ownership record by customer and property
router.get("/:customerId/:propertyId", getOwnershipByIds);

module.exports = router;