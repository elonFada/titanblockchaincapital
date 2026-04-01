import asyncHandler from "express-async-handler";
import SupportChat from "../models/supportChatModel.js";
import User from "../models/userModel.js";

const WELCOME_TEXT =
  "Hello, welcome to TitanBlockchainCapital support. How can an agent assist you today?";

const normalizeMessage = (message) => ({
  id: message._id,
  senderType: message.senderType,
  senderUser: message.senderUser || null,
  senderAdmin: message.senderAdmin || null,
  text: message.text || "",
  attachmentUrl: message.attachmentUrl || null,
  attachmentName: message.attachmentName || null,
  attachmentType: message.attachmentType || null,
  readByUser: message.readByUser,
  readByAdmin: message.readByAdmin,
  createdAt: message.createdAt,
});

const ensureChatForUser = async (userId) => {
  let chat = await SupportChat.findOne({ user: userId })
    .populate("user", "fullName email profileImage")
    .populate("messages.senderAdmin", "name email")
    .populate("messages.senderUser", "fullName email profileImage");

  if (!chat) {
    chat = await SupportChat.create({
      user: userId,
      status: "open",
      lastMessageAt: new Date(),
      lastMessageText: WELCOME_TEXT,
      messages: [
        {
          senderType: "system",
          text: WELCOME_TEXT,
          readByUser: true,
          readByAdmin: true,
        },
      ],
    });

    chat = await SupportChat.findById(chat._id)
      .populate("user", "fullName email profileImage")
      .populate("messages.senderAdmin", "name email")
      .populate("messages.senderUser", "fullName email profileImage");
  }

  return chat;
};

// USER: get my chat
const getMySupportChat = asyncHandler(async (req, res) => {
  const chat = await ensureChatForUser(req.user._id);

  chat.messages.forEach((msg) => {
    if (msg.senderType !== "user") {
      msg.readByUser = true;
    }
  });

  await chat.save();

  res.status(200).json({
    success: true,
    data: {
      id: chat._id,
      status: chat.status,
      user: chat.user,
      messages: chat.messages.map(normalizeMessage),
      updatedAt: chat.updatedAt,
    },
  });
});

// USER: send message
const sendUserSupportMessage = asyncHandler(async (req, res) => {
  const text = (req.body.text || "").trim();
  const hasFile = !!req.file;

  if (!text && !hasFile) {
    res.status(400);
    throw new Error("Message text or attachment is required");
  }

  const chat = await ensureChatForUser(req.user._id);

  const newMessage = {
    senderType: "user",
    senderUser: req.user._id,
    text,
    attachmentUrl: hasFile ? req.file.path : null,
    attachmentPublicId: hasFile ? req.file.filename : null,
    attachmentName: hasFile ? req.file.originalname : null,
    attachmentType: hasFile ? req.file.mimetype : null,
    readByUser: true,
    readByAdmin: false,
  };

  chat.messages.push(newMessage);
  chat.lastMessageAt = new Date();
  chat.lastMessageText = text || req.file?.originalname || "Attachment";
  chat.status = "open";

  await chat.save();

  const populatedChat = await SupportChat.findById(chat._id)
    .populate("user", "fullName email profileImage")
    .populate("messages.senderAdmin", "name email")
    .populate("messages.senderUser", "fullName email profileImage");

  const message = populatedChat.messages[populatedChat.messages.length - 1];

  res.status(201).json({
    success: true,
    message: "Message sent successfully",
    data: normalizeMessage(message),
  });
});

// ADMIN: get all chats
const getAllSupportChats = asyncHandler(async (req, res) => {
  const chats = await SupportChat.find({})
    .populate("user", "fullName email profileImage")
    .sort({ lastMessageAt: -1 });

  const formatted = chats.map((chat) => {
    const unreadCount = chat.messages.filter(
      (msg) => msg.senderType === "user" && !msg.readByAdmin
    ).length;

    return {
      id: chat._id,
      status: chat.status,
      lastMessageAt: chat.lastMessageAt,
      lastMessageText: chat.lastMessageText,
      unreadCount,
      user: chat.user,
      messageCount: chat.messages.length,
    };
  });

  res.status(200).json({
    success: true,
    count: formatted.length,
    data: formatted,
  });
});

// ADMIN: get one chat
const getSupportChatById = asyncHandler(async (req, res) => {
  const chat = await SupportChat.findById(req.params.id)
    .populate("user", "fullName email profileImage")
    .populate("messages.senderAdmin", "name email")
    .populate("messages.senderUser", "fullName email profileImage");

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  chat.messages.forEach((msg) => {
    if (msg.senderType === "user") {
      msg.readByAdmin = true;
    }
  });

  await chat.save();

  res.status(200).json({
    success: true,
    data: {
      id: chat._id,
      status: chat.status,
      user: chat.user,
      messages: chat.messages.map(normalizeMessage),
      updatedAt: chat.updatedAt,
    },
  });
});

// ADMIN: reply
const sendAdminSupportReply = asyncHandler(async (req, res) => {
  const text = (req.body.text || "").trim();
  const hasFile = !!req.file;

  if (!text && !hasFile) {
    res.status(400);
    throw new Error("Reply text or attachment is required");
  }

  const chat = await SupportChat.findById(req.params.id);

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  const newMessage = {
    senderType: "admin",
    senderAdmin: req.admin._id,
    text,
    attachmentUrl: hasFile ? req.file.path : null,
    attachmentPublicId: hasFile ? req.file.filename : null,
    attachmentName: hasFile ? req.file.originalname : null,
    attachmentType: hasFile ? req.file.mimetype : null,
    readByUser: false,
    readByAdmin: true,
  };

  chat.messages.push(newMessage);
  chat.lastMessageAt = new Date();
  chat.lastMessageText = text || req.file?.originalname || "Attachment";

  await chat.save();

  const populatedChat = await SupportChat.findById(chat._id)
    .populate("user", "fullName email profileImage")
    .populate("messages.senderAdmin", "name email")
    .populate("messages.senderUser", "fullName email profileImage");

  const message = populatedChat.messages[populatedChat.messages.length - 1];

  res.status(201).json({
    success: true,
    message: "Reply sent successfully",
    data: normalizeMessage(message),
  });
});

export {
  getMySupportChat,
  sendUserSupportMessage,
  getAllSupportChats,
  getSupportChatById,
  sendAdminSupportReply,
};