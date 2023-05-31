const mammoth = require("mammoth");
const fs = require("fs");
const multer = require("multer");
const textfile = require("../models/textFile");

const addTextToDatabase = (filedata, filename, next) => {
  const files = filedata.split("\n").map((file) => file.toString());

  const fileitems = files.map((text) => ({ text }));

  const textFile = new textfile({
    filename: filename,
    fileLocation: "/",
    fileitems: { items: fileitems },
  });

  return textFile.save();
};

exports.addItemText = (req, res, next) => {
  if (!req.file) {
    const errorMessage =
      "Invalid file. Please upload a valid text or Word document file.";
    return res.redirect(
      "/error.html?message=" + encodeURIComponent(errorMessage)
    );
  }

  const filePath = req.file.path;
  fs.readFile(filePath, "binary", (err, fileData) => {
    if (!req.file) {
      const errorMessage =
        "Invalid file. Please upload a valid text or Word document file.";
      return res.redirect(
        "/error.html?message=" + encodeURIComponent(errorMessage)
      );
    }
    if (req.file.mimetype === "text/plain") {
      const text = fileData.toString("utf8");
      addTextToDatabase(text, req.file.originalname, next)
        .then((result) => {
          res.redirect("/index.html");
        })
        .catch((err) => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    } else {
      // Handle Word documents
      mammoth
        .extractRawText({ buffer: fileData })
        .then((result) => {
          const text = result.value; // Extracted text
          console.log(text);
          res.redirect("/index.html");
        })
        .catch((error) => {
          console.error(error);
          if (error.message.includes("Corrupted zip")) {
            res
              .status(400)
              .send(
                "Invalid file format. Please upload a valid Word document."
              );
          } else {
            res.status(500).send("Error extracting text from the file.");
          }
        });
    }
  });
};

// module.exports = {
//   addItemText,
// };
