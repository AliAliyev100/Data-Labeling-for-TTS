const textfile = require("../models/textfile")

exports.createAudio = (req, res, next) => {
  const textId = req.body.textId;
  textfile
    .findOneAndUpdate(
      { "fileitems.items._id": textId },
      { $set: { "fileitems.items.$.audioPath": "/Audios/" + textId + ".wav" } },
      { new: true }
    )
    .then((updatedTextFile) => {
    })
    .catch((error) => {
      console.error("Error updating text file:", error);
    });
  res.json({ result: true });
};
