const express = require("express");

const router = express.Router();

const {
    getWaterServices,
    getWaterServiceById
} = require("../controllers/waterServiceController");

// GET all water services
router.get("/", getWaterServices);

// GET water service by ID
router.get("/:id", getWaterServiceById);

module.exports = router;