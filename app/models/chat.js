const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const chatSchema = new Schema({
  msgFrom: { type: String, default: "", required: true },
  msgTo: { type: String, default: "", required: true },
  msg: { type: String, default: "", required: true },
  room: { type: String, default: "", required: true },
  createdOn: { type: Date, default: Date.now }
});

mongoose.model("Chat", chatSchema);
