const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");

let i = 0;

const app = express();

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
    cb(null, file.originalname);
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
const uploadText = multer({ storage: fileStorageText, fileFilter: fileFilter }).single("text");
let result;

app.use(express.static("public"));

app.post("/create-audio", uploadAudio.single("audio"), async (req, res) => {
  console.log("uploaded Audio");
});

const filesRouter = require("./routes/files");

app.use(uploadText)
app.use(filesRouter);

// app.post("/add-item-text", uploadText.single("text"), async (req, res) => {

//   // Read the contents of the uploaded file
//   const filePath = req.file.path;
//   fs.readFile(filePath, "binary", (err, fileData) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send("Error reading file.");
//     }
//     // Extract text from the Word document
//     if (req.file.mimetype === "text/plain") {
//       // Handle TXT files
//       const text = fileData.toString("utf8");
//       console.log(text);
//       res.redirect("/index.html");
//     } else {
//       // Handle Word documents
//       mammoth.extractRawText({ buffer: fileData })
//         .then(result => {
//           const text = result.value; // Extracted text
//           console.log(text);
//           res.redirect("/index.html");
//         })
//         .catch(error => {
//           console.error(error);
//           if (error.message.includes("Corrupted zip")) {
//             res.status(400).send("Invalid file format. Please upload a valid Word document.");
//           } else {
//             res.status(500).send("Error extracting text from the file.");
//           }
//         });
//     }
//   });
// });


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
