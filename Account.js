const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  gameName: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },

  // Shop info
  price: { type: Number, default: 0 },
  oldPrice: { type: Number, default: 0 },
  rank: { type: String, default: "" },
  status: { type: String, default: "san-sang" },

  note: String,
  lastPlayed: String,
  avatar: String,
  resourceImages: [String],

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Account", accountSchema);
