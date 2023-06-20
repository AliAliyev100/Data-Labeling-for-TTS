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
exports.getPanel = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 2;
  const skip = (page - 1) * limit;

  try {
    const totalCount = await textfile
      .aggregate([
        {
          $project: {
            fileitems: {
              $cond: {
                if: { $gt: ["$lastIndex", 0] },
                then: { $slice: ["$fileitems.items", 0, "$lastIndex"] },
                else: [],
              },
            },
          },
        },
        {
          $unwind: "$fileitems",
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    const count = totalCount.length > 0 ? totalCount[0].count : 0;
    const totalPages = Math.ceil(count / limit);

    const query = [
      {
        $project: {
          filename: 1,
          fileitems: {
            $cond: {
              if: { $gt: ["$lastIndex", 0] },
              then: { $slice: ["$fileitems.items", 0, "$lastIndex"] },
              else: [],
            },
          },
        },
      },
      {
        $unwind: "$fileitems",
      },
      {
        $project: {
          filename: 1,
          audioPath: "$fileitems.audioPath",
          text: "$fileitems.text",
          createdAt: "$fileitems.createdAt",
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ];

    const results = await textfile.aggregate(query).exec();

    res.json({ allFiles: results, pages: totalPages });
  } catch (error) {
    // Handle the error
    console.error(error);
    res.status(500).json({ error: error });
  }
};
