const express = require("express");

const router = express.Router();

const {
    getReadings,
    getReadingsByMeter
} = require("../controllers/readingController");

// GET all meter readings
router.get("/", getReadings);

// GET readings for a specific meter
router.get("/:meterId", getReadingsByMeter);

module.exports = router;