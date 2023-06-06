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
        audioPath: { type: String, default: "" },
        text: { type: String, required: true },
      },
    ],
    index: {
      type: 'string', // Specify the index type
    },
  },
});
module.exports = mongoose.model("textfile", textfileSchema);
