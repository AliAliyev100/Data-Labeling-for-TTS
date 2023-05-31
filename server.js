const express = require("express");
const multer = require("multer");
const fs = require("fs");

let i = 0;

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "data");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    );
  },
});

const upload = multer({ storage: fileStorage });
const port = 3000;
let result;


app.use(express.static("public"));

app.post("/create-audio", upload.single("audio"), async (req, res) => {
  const response = { result, azureRes: "" };
  res.send(response);
});

app.listen(port, () => console.log(`server started on port ${port}`));
