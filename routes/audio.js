const express = require("express");
const router = express.Router();
const audioController = require("../controllers/audio")


router.post("/create-audio", audioController.createAudio);



module.exports = router;