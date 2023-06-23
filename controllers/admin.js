const mammoth = require("mammoth");
const fs = require("fs");

const ffprobe = require("ffprobe");
const ffprobeStatic = require("ffprobe-static");

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
          textId: "$fileitems._id",
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

exports.deleteAudio = async (req, res, next) => {
  const { textfileId, textId } = req.query;

  try {
    const textfile = await Textfile.findById(textfileId).exec();
    const items = textfile.fileitems.items;

    const foundItem = items.find((item) => {
      return item._id.toString() === textId.toString();
    });

    foundItem.set("createdAt", undefined);

    await textfile.save();
  } catch (err) {
    return res.status(500).send("Error deleting file");
  }
  res.json({ result: "file deleted" });
};

exports.editText = async (req, res, next) => {
  const { content, textfileId, textId } = req.body;

  try {
    // Find the textfile by textfileId and update the specific item within the fileitems array
    const updatedTextfile = await Textfile.findOneAndUpdate(
      {
        _id: textfileId,
        "fileitems.items._id": textId,
      },
      {
        $set: {
          "fileitems.items.$.text": content,
        },
      },
      { new: true }
    );

    if (!updatedTextfile) {
      return res.status(404).json({ message: "Item not found" });
    }

    return res.status(200).json({ message: "Text updated successfully" });
  } catch (error) {
    console.error("Error updating text:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getTotalTime = async (req, res, next) => {
  let { user, startDate, endDate } = req.body;

  let textfileId = "all";

  if (startDate === "") {
    startDate = "2000-01-01";
  }

  if (endDate === "") {
    endDate = "2100-01-01";
  }

  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  try {
    const foundUser = await User.findById(user);
    textfileId = foundUser.textfile;
  } catch (err) {}

  let matchQuery = {
    _id: textfileId === "all" ? { $exists: true } : textfileId,
  };

  try {
    const query = [
      {
        $match: matchQuery,
      },
      {
        $project: {
          // filename: 1,
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
        },
      },
    ];
    const results = await Textfile.aggregate(query);

    let totalTime = 0;

    return getAudioDurations(results)
      .then((result) => {
        return res.json(result);
      })
      .catch((err) => {
        console.error("Error:", err);
        res.status(500).json({ error: "An error occurred" });
      });
    res.json({ totalTime: totalTime });
  } catch (err) {
    console.log(err);
  }
};

const getAudioDurations = async (audioList) => {
  const durationPromises = audioList.map((item) => {
    const audioPath = item.audioPath;

    return ffprobe(audioPath, { path: ffprobeStatic.path })
      .then((info) => {
        const duration = info.streams[0].duration;
        return parseFloat(duration);
      })
      .catch((err) => {
        console.error("Error getting audio duration:", err);
        return 0; // Or any default duration value in case of error
      });
  });

  try {
    const durations = await Promise.all(durationPromises);
    const totalTime = durations.reduce((acc, duration) => acc + duration, 0);
    return { totalTime };
  } catch (err) {
    console.error("Error calculating total time:", err);
    return { totalTime: 0 }; // Or any default value in case of error
  }
};
