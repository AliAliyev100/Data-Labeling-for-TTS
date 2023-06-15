const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin");

router.post("/add-item-text", adminController.addItemText);

module.exports = router;
