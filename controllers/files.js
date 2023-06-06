const mammoth = require("mammoth");
const fs = require("fs");
const textfile = require("../models/textfile");

const addTextToDatabase = (filedata, file) => {
  const files = filedata
    .split("\n")
    .map((file) => file.toString())
    .filter((f) => {
      return f.length > 0;
    });

  const fileitems = files.map((text) => ({ text }));
  const textFile = new textfile({
    filename: file.filename,
    originalFilename: file.originalname,
    fileLocation: file.path,
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
  fs.readFile(filePath, "utf-8", (err, fileData) => {
    if (!req.file) {
      const errorMessage =
        "Invalid file. Please upload a valid text or Word document file.";
      return res.redirect(
        "/error.html?message=" + encodeURIComponent(errorMessage)
      );
    }
    if (req.file.mimetype === "text/plain") {
      const text = fileData.toString("utf8");
      addTextToDatabase(text, req.file)
        .then((result) => {
          res.redirect("/label.html");
        })
        .catch((err) => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    } else {
      mammoth
        .extractRawText({ buffer: fileData })
        .then((result) => {
          const text = result.value; // Extracted text
          addTextToDatabase(text, req.file)
            .then((result) => {
              res.redirect("/label.html");
            })
            .catch((err) => {
              const error = new Error(err);
              error.httpStatusCode = 500;
              return next(error);
            });
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

exports.getLabel = (req, res, next) => {
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
};

exports.getTextValues = (req, res, next) => {
  let { filename } = req.body;

  textfile
    .findOne({ filename: filename })
    .then((textDocument) => {
      const fileitems = textDocument.fileitems;
      const items = fileitems.items;
      let currentIndex = textDocument.lastİndex;

      while (items[currentIndex].audioPath) {
        currentIndex++;
      }
      const result = items[currentIndex];
      textDocument.lastİndex = currentIndex;
      res.json({
        result: result.text,
        fileName: result._id,
      });
      return textDocument.save();
    })
    .then((updatedTextDocument) => {})
    .catch((err) => {
      next(err);
    });
};
