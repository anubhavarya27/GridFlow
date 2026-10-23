const express = require("express");

const router = express.Router();

const {
    getMeters,
    getMeterById
} = require("../controllers/meterController");


// GET all meters
router.get("/", getMeters);

// GET meter by ID
router.get("/:id", getMeterById);


module.exports = router;