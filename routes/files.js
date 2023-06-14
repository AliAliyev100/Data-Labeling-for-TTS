const express = require("express");
const router = express.Router();

const fileController = require("../controllers/files");
const isAuth = require("../middleware/is-auth")

router.post("/add-item-text", fileController.addItemText);


router.get("/gettextvalues", isAuth, fileController.getTextValues);

module.exports = router;
