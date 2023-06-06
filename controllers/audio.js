const textfile = require("../models/textfile");

exports.createAudio = (req, res, next) => {
  const { textId, filename } = req.body;

  textfile
    .findOne({ filename: filename })
    .then((textDocument) => {
      const fileitems = textDocument.fileitems;
      const items = fileitems.items;
      let currentIndex = textDocument.lastİndex;
      items[currentIndex].audioPath = "/Audios/" + textId + ".wav";

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

  // textfile
  //   .findOneAndUpdate(
  //     { "fileitems.items._id": textId },
  //     { $set: { "fileitems.items.$.audioPath": "/Audios/" + textId + ".wav" } },
  //     { new: true }
  //   )
  //   .catch((error) => {
  //     console.error("Error updating text file:", error);
  //   });
};
