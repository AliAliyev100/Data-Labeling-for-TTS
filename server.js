const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");

const textfile = require("./models/textfile");
const audioRouter = require("./routes/audio");
const filesRouter = require("./routes/files");

const app = express();
app.use(express.json());

const fileStorageAudio = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Audios");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname + ".wav");
  },
});

const fileStorageText = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Texts");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    );
  },
});

const fileFilterText = (req, file, cb) => {
  if (
    file.mimetype === "text/plain" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const fileFilterAudio = (req, file, cb) => {
  if (file.mimetype === "audio/wav") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const uploadAudio = multer({
  storage: fileStorageAudio,
  fileFilter: fileFilterAudio,
}).single("audio");

const uploadText = multer({
  storage: fileStorageText,
  fileFilter: fileFilterText,
}).single("text");

app.use(express.static("public"));

app.use("/audio", uploadAudio, audioRouter);
app.use("/files", uploadText, filesRouter);

const mongodbUri =
  "mongodb+srv://aliyevali04:5pT54lC70RpidywW@cluster0.qebtx7h.mongodb.net/tts";

mongoose
  .connect(mongodbUri)
  .then((res) => {
    app.listen(3000);
  })
  .catch((err) => {
    next(new Error(err));
  });
