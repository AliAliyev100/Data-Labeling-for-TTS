const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const audioSchema = new Schema({
  filename: {
    type: String,
    required: true,
  },
  fileLocation: {
    type: String,
    required: true,
  },
});


module.exports = mongoose.model("audio", audioSchema);
