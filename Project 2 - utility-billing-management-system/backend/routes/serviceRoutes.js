const express = require("express");

const router = express.Router();

const {
    getServices,
    getServiceById
} = require("../controllers/serviceController");


// GET all services
router.get("/", getServices);

// GET service by ID
router.get("/:id", getServiceById);


module.exports = router;