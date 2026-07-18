const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String,
      default: ""
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    role: {
      type: String,
      default: ""
    },
    isForGuest: {
      type: Boolean,
      default: false
    },
    type: {
      type: String, // e.g. booking, settlement, system, offer
      default: "system"
    },
    data: {
      type: Object // optional extra payload
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

notificationSchema.virtual("message").get(function () {
  return this.body;
});

notificationSchema.virtual("link").get(function () {
  return this.data?.link || "";
});

module.exports = mongoose.model("Notification", notificationSchema);
