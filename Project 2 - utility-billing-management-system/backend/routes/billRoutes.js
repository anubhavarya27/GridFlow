const express = require("express");

const router = express.Router();

const {
    getBills,
    getBillById
} = require("../controllers/billController");


// GET all bills
router.get("/", getBills);

// GET bill by ID
router.get("/:id", getBillById);


module.exports = router;