const express = require("express");

const router = express.Router();

const {
    getTariffs,
    getTariffByCode
} = require("../controllers/tariffController");

// GET all tariffs
router.get("/", getTariffs);

// GET tariff by tariff code
router.get("/:code", getTariffByCode);

module.exports = router;