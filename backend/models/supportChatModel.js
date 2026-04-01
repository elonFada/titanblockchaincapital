import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
  {
    senderType: {
      type: String,
      enum: ["user", "admin", "system"],
      required: true,
    },
    senderUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    senderAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    text: {
      type: String,
      trim: true,
      default: "",
    },
    attachmentUrl: {
      type: String,
      default: null,
      trim: true,
    },
    attachmentPublicId: {
      type: String,
      default: null,
      trim: true,
    },
    attachmentName: {
      type: String,
      default: null,
      trim: true,
    },
    attachmentType: {
      type: String,
      default: null,
      trim: true,
    },
    readByUser: {
      type: Boolean,
      default: false,
    },
    readByAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const supportChatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      index: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastMessageText: {
      type: String,
      default: "",
      trim: true,
    },
    messages: [supportMessageSchema],
  },
  {
    timestamps: true,
  }
);

supportChatSchema.index({ createdAt: -1 });
supportChatSchema.index({ updatedAt: -1 });

const SupportChat = mongoose.model("SupportChat", supportChatSchema);

export default SupportChat;