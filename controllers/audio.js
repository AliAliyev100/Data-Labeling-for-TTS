const textfile = require("../models/textfile");

exports.createAudio = (req, res, next) => {
  const { textId, filename } = req.body;

  textfile
    .findOne({ filename: filename })
    .then((textDocument) => {
      const fileitems = textDocument.fileitems;
      const items = fileitems.items;
      let currentIndex = textDocument.lastİndex;
      console.log(items[currentIndex]._id.toString());
      console.log(textId.toString() + "\n");

      if (items[currentIndex]._id.toString() !== textId.toString()) {
        return res.json({
          result: items[currentIndex].text,
          fileName: items[currentIndex]._id,
        });
      }

      items[currentIndex].audioPath = "/Audios/" + textId + ".wav";

      console.log(items[currentIndex].audioPath);

      while (items[currentIndex] && items[currentIndex].audioPath) {
        console.log("here");
        currentIndex++;
      }
      const result =
        textDocument.lastİndex !== items.length
          ? items[currentIndex]
          : {
              text: "Tebrikler! Butun Cumleleri Bitirdiniz!",
              fileName: "finished",
            };
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

exports.skipAudio = (req, res, next) => {
  const { textId, filename } = req.body;

  textfile
    .findOne({ filename: filename })
    .then((textDocument) => {
      const items = textDocument.fileitems.items;
      let currentIndex = textDocument.lastİndex;
      items[currentIndex].audioPath = "Undefined";
      textDocument.lastİndex++;
      currentIndex++;
      const result =
        textDocument.lastİndex !== items.length
          ? items[currentIndex]
          : {
              text: "Tebrikler! Butun Cumleleri Bitirdiniz!",
              fileName: "finished",
            };
      res.json({
        result: result.text,
        fileName: result._id,
      });
      return textDocument.save();
    })
    .catch((err) => {
      throw err;
    });
};
