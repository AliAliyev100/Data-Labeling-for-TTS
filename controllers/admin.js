const mammoth = require("mammoth");
const fs = require("fs");

const Textfile = require("../models/textfile");
const User = require("../models/user");

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
  let { user, startdate, enddate } = req.query;

  let textfileId = "all";

  if (startdate === "") {
    startdate = "2000-01-01";
  }

  if (enddate === "") {
    enddate = "2100-01-01";
  }

  const startDateObj = new Date(startdate);
  const endDateObj = new Date(enddate);

  try {
    const foundUser = await User.findById(user);
    textfileId = foundUser.textfile;
  } catch (err) {}

  const limit = 20;
  const skip = (page - 1) * limit;

  let matchQuery = {
    _id: textfileId === "all" ? { $exists: true } : textfileId,
  };

  try {
    const totalCount = await Textfile.aggregate([
      {
        $match: matchQuery,
      },
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
        $match: {
          "fileitems.createdAt": {
            $gte: startDateObj,
            $lte: endDateObj,
          },
        },
      },  
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);

    const count = totalCount.length > 0 ? totalCount[0].count : 0;
    const totalPages = Math.ceil(count / limit);

    const query = [
      {
        $match: matchQuery,
      },
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
        $match: {
          "fileitems.createdAt": {
            $gte: startDateObj,
            $lte: endDateObj,
          },
        },
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

    const results = await Textfile.aggregate(query);

    return res.json({ allFiles: results, pages: totalPages });
  } catch (error) {
    // Handle the error
    console.error(error);
    return res.status(500).json({ error: error });
  }
};

exports.getUsers = (req, res, next) => {
  User.find()
    .then((foundUsers) => {
      const users = [];
      foundUsers.forEach((user) => {
        users.push({ id: user._id, name: user.name });
      });
      return res.json({ users: users });
    })
    .catch((err) => {
      return res.status(500).send("Error retrieving users");
    });
};
