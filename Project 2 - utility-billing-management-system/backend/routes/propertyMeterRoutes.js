const express = require("express");

const router = express.Router();

const {
    getPropertyMeters,
    getMeterByProperty,
    getPropertyByMeter
} = require("../controllers/propertyMeterController");

// GET all property-meter relationships
router.get("/", getPropertyMeters);

// GET meter for a specific property
router.get("/property/:propertyId", getMeterByProperty);

// GET property for a specific meter
router.get("/meter/:meterId", getPropertyByMeter);

module.exports = router;