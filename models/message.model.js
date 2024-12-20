const { Schema, Types, model, models } = require("mongoose");

const messageSchema = new Schema(
  {
    content: {
      type: String,
    },
    attachments: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    tempId: {
      type:String,
      required: true,
      unique: true,
    },
    isPoll: {
      type: Boolean,
      default: false,
    },
    options: [
      {
        content: {
          type: String,
        },
        members: [ {
          type: Types.ObjectId,
          ref: "User",
        }],
      },
    ],
    isAlert: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: "send",
      enum: ["send", "online", "seen"],
    },
    sender: {
      type: Types.ObjectId,
      ref: "User",
      require: true,
    },
    chat: {
      type: Types.ObjectId,
      ref: "Chat",
      require: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Message = models.Message || model("Message", messageSchema);
module.exports = Message;
