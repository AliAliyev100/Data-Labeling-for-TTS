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
  fileitems: {
    items: [
      {
        audio: {
          type: Schema.Types.ObjectId,
          ref: "Audio",
        },
        text: { type: String, required: true },
      },
    ],
  },
});

module.exports = mongoose.model("textfile", textfileSchema);
