const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin");

router.post("/add-item-text", adminController.addItemText);

router.get("/get-panel", adminController.getPanel);

module.exports = router;
