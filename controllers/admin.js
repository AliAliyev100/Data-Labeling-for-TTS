const mammoth = require("mammoth");
const fs = require("fs");

const Textfile = require("../models/textfile");
const textfile = require("../models/textfile");

const addTextToDatabase = (filedata, file) => {
  const files = filedata
    .split("\n")
    .map((file) => file.toString())
    .filter((f) => {
      return f.length > 0;
    });

  const fileitems = files.map((text) => ({ text }));
  const textFile = new Textfile({
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

exports.getPanel = (req, res, next) => {
  const page = req.query.page;

  let allFiles = [];
  const limit = 2;
  let total = 0;
  let cnt = 0;

  const passAmount = (page - 1) * limit || 0;
  let passCounter = 0;
  textfile
    .find()
    .then((textfiles) => {
      textfiles.forEach((textfile) => {
        total += textfile.lastIndex;
      });

      textfiles.forEach((textfile) => {
        for (let i = 0; i < textfile.lastIndex; i++) {
          passCounter++;
          if (passCounter <= passAmount) {
            continue;
          }
          const item = textfile.fileitems.items[i];
          allFiles.push({
            filename: textfile.filename,
            audioPath: item.audioPath,
            text: item.text,
            createdAt: item.createdAt,
          });
          cnt++;
          if (cnt >= limit) {
            break;
          }
        }
      });
      res.json({ allFiles: allFiles, pages: Math.ceil(total / limit) });
    })
    .catch((err) => {
      res.status(500).send(err);
    });
};

// exports.getPanel = async (req, res, next) => {
//   try {
//     const result = await Textfile.aggregate([
//       {
//         $group: {
//           _id: null,
//           mergedItems: {
//             $push: {
//               filename: "$filename",
//               items: "$fileitems.items",
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           mergedItems: {
//             $reduce: {
//               input: "$mergedItems",
//               initialValue: [],
//               in: {
//                 $concatArrays: [
//                   "$$value",
//                   {
//                     $map: {
//                       input: "$$this.items",
//                       as: "item",
//                       in: {
//                         filename: "$$this.filename",
//                         item: "$$item",
//                       },
//                     },
//                   },
//                 ],
//               },
//             },
//           },
//         },
//       },
//     ]).exec();
//     res.json(result[0].mergedItems);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };
