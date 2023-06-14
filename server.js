const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");

const textfile = require("./models/textfile");
const User = require("./models/user");

const audioRouter = require("./routes/audio");
const filesRouter = require("./routes/files");
const authRouter = require("./routes/auth");

const isAuth = require("./middleware/is-auth");

const app = express();
app.use(express.json());

const fileStorageAudio = multer.diskStorage({
  destination: (req, file, cb) => {
    let folderName;
    return User.findById(req.userId)
      .then((user) => {
        folderName = "Audios/" + user.name + "_audios";
        if (!fs.existsSync(folderName)) {
          fs.mkdirSync(folderName);
        }
      })
      .then((result) => {
        cb(null, folderName);
      });
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

app.use("/audio", isAuth, uploadAudio, audioRouter);
app.use("/files", uploadText, filesRouter);
app.use("/auth", authRouter);

authRouter;

app.use((error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message;
  const data = error.data;
  // res.redirect("./error.html")
  res.status(status).json({ message: message, data: data });
});

const mongoURI = "mongodb://127.0.0.1:27017/tts";

mongoose
  .connect(mongoURI)
  .then(() => {
    app.listen(3000);
  })
  .catch((err) => {
    throw new Error(err);
  });
