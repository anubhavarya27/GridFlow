const express = require("express");

const router = express.Router();

const {
    getElectricityServices,
    getElectricityServiceById
} = require("../controllers/electricityServiceController");

// GET all electricity services
router.get("/", getElectricityServices);

// GET electricity service by ID
router.get("/:id", getElectricityServiceById);

module.exports = router;