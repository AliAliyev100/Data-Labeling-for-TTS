const express = require("express");
const router = express.Router();

const { addItemText } = require("../controllers/files");

router.post("/add-item-text", addItemText);

module.exports = router;