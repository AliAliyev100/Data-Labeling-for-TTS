const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const textfileSchema = new Schema({
  filename: {
    type: String,
    required: true,
  },
  originalFilename: {
    type: String,
    required: true,
  },
  fileLocation: {
    type: String,
    required: true,
  },
  lastİndex: {
    type: Number,
    required: true,
    default: 0,
  },
  fileitems: {
    items: [
      {
        audioPath: { type: String, default: "" },
        text: { type: String, required: true },
        createdAt: { type: Date },
      },
    ],
    index: {
      type: "number",
    },
  },
});
module.exports = mongoose.model("textfile", textfileSchema);

// db.textfiles.find({}, { "fileitems.items": { $slice: 100 } })
// access from shell