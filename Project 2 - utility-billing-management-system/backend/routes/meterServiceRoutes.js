const express = require("express");

const router = express.Router();

const {
    getMeterServices,
    getServicesByMeter,
    getMetersByService,
    getMeterServiceByIds
} = require("../controllers/meterServiceController");

// GET all meter-service relationships
router.get("/", getMeterServices);

// GET services for a specific meter
router.get("/meter/:meterId", getServicesByMeter);

// GET meters for a specific service
router.get("/service/:serviceId", getMetersByService);

// GET one meter-service relationship
router.get("/:meterId/:serviceId", getMeterServiceByIds);

module.exports = router;