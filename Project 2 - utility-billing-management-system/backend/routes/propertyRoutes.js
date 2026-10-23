const express = require("express");

const router = express.Router();

const {
    getProperties,
    getPropertyById
} = require("../controllers/propertyController");


// GET all properties
router.get("/", getProperties);

// GET property by ID
router.get("/:id", getPropertyById);


module.exports = router;
