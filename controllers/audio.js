const textfile = require("../models/textfile");
const User = require("../models/user");

exports.createAudio = (req, res, next) => {
  const { textId } = req.body;

  let currentUser;

  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const err = new Error("No user found!");
        return next(err);
      }
      currentUser = user;
      return textfile.findById(user.textfile);
    })
    .then((textDocument) => {
      if (!textDocument) {
        const err = new Error("No textdocument belonging to user");
        return next(err);
      }

      const fileitems = textDocument.fileitems;
      const items = fileitems.items;
      let currentIndex = textDocument.lastIndex;
      console.log(items[currentIndex]._id.toString());
      console.log(textId.toString() + "\n");

      if (items[currentIndex]._id.toString() !== textId.toString()) {
        return res.json({
          result: items[currentIndex].text,
          fileName: items[currentIndex]._id,
        });
      }

      items[currentIndex].audioPath =
        "Audios/" + currentUser.name + "_audios/" + textId + ".wav";
      items[currentIndex].createdAt = new Date();

      while (items[currentIndex] && items[currentIndex].audioPath) {
        currentIndex++;
      }
      textDocument.lastIndex = currentIndex;
      const result =
        textDocument.lastIndex !== items.length
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
    });
};

exports.skipAudio = (req, res, next) => {
  User.findById(req.userId)
    .then((user) => {
      return textfile.findById(user.textfile);
    })
    .then((textDocument) => {
      if (!textDocument) {
        const err = new Error("No textdocument belonging to user");
        return next(err);
      }

      const items = textDocument.fileitems.items;
      let currentIndex = textDocument.lastIndex;

      items[currentIndex].audioPath = "Undefined";
      items[currentIndex].createdAt = null;

      textDocument.lastIndex++;
      currentIndex++;
      const result =
        textDocument.lastIndex !== items.length
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
