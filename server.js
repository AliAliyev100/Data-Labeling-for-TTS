const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const textfile = require("./models/textfile");
const bodyParser = require("body-parser");

let i = 0;

const app = express();
app.use(bodyParser.json());

const fileStorageAudio = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Audios");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    );
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

const fileFilter = (req, file, cb) => {
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

const uploadAudio = multer({ storage: fileStorageAudio });
const uploadText = multer({
  storage: fileStorageText,
  fileFilter: fileFilter,
}).single("text");
let result;

app.get("/label", (req, res, next) => {
  textfile
    .find()
    .then((result) => {
      res.json({
        result: result,
      });
    })
    .catch((err) => {
      next(err);
    });
});

app.post("/gettextvalues", (req, res, next) => {
  const { filename } = req.body;

  textfile
    .find({ filename: filename })
    .then((textDocument) => {
      res.json({
        result: textDocument[0],
      });
    })
    .catch((err) => {
      next(err);
    });

});

app.use(express.static("public"));

app.post("/create-audio", uploadAudio.single("audio"), async (req, res) => {
  console.log("uploaded Audio");
});

const filesRouter = require("./routes/files");

app.use(uploadText);
app.use(filesRouter);

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
