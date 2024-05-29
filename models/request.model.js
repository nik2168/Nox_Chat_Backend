const { Schema, Types, model, models } = require("mongoose");

const requestSchema = new Schema(
  {
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "accepted", "rejected"],
    },
    sender: {
      type: Types.ObjectId,
      ref: "User",
      require: true,
    },

    receiver: {
      type: Types.ObjectId,
      ref: "User",
      require: true,
    },
  },
  {
    timestamps: true,
  }
);

const Request = models.Request || model("Request", requestSchema);
module.exports = Request