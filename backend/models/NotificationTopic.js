const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  }, // lowercase slug, e.g. 'new-offers'
  description: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("NotificationTopic", topicSchema);
