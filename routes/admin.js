const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin");

router.post("/add-item-text", adminController.addItemText);

router.get("/get-panel", adminController.getPanel);

router.get("/get-users", adminController.getUsers);

router.delete("/delete-audio", adminController.deleteAudio);

router.put("/edit-text", adminController.editText)

router.post("/get-time", adminController.getTotalTime)

module.exports = router;
