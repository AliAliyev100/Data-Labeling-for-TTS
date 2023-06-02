const express = require("express");
const router = express.Router();

const fileController = require("../controllers/files");

router.post("/add-item-text", fileController.addItemText);

router.get("/label", fileController.getLabel);

router.post("/gettextvalues", fileController.getTextValues);

module.exports = router;