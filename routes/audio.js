const express = require("express");
const router = express.Router();
const audioController = require("../controllers/audio")

const isAuth = require("../middleware/is-auth")

router.post("/create-audio",isAuth, audioController.createAudio);

router.post("/skip",isAuth, audioController.skipAudio);

module.exports = router;