const jwt = require("jsonwebtoken");
const { v4 } = require("uuid");
const cloudinary = require("cloudinary");
const { getBase64 } = require("../lib/helper.js");
const Message = require("../models/message.model.js");
const Chat = require("../models/chat.model.js");
const { REFETCH_MESSAGES } = require("../constants/events.js");
const userSocketIds = new Map(); // will map user id with socketId


const cookieObj = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

const sendToken = (res, user, code, message) => {
  const token = jwt.sign({ userid: user.userid }, process.env.secret, {
    expiresIn: 15 * 24 * 60 * 60 * 1000,
  });

  res
    .status(code)
    .cookie("nox_token", token, cookieObj)
    .send({ success: true, message, user });
};

const emitEvent = (req, event, users, data) => {
  const io = req.app.get("io");
  
  const usersSocket = users.map((user) =>
    userSocketIds.get(user.toString())
  );

  io.to(usersSocket).emit(event, data);
  return;
};

const uploadFilesToCloudinary = async (files = []) => {
  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.v2.uploader.upload(
        getBase64(file),
        { resource_type: "auto", public_id: v4() },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  });
  try {
    const results = await Promise.all(uploadPromises);
    const formatedResult = results.map((result) => {
      return {
        url: result.secure_url,
        public_id: result.public_id,
      };
    });
    return formatedResult;
  } catch (err) {
    throw new Error("Error while uploading files to cloudinary !", err);
  }
};


const updateMessagesToOnline = async (user, io) => {

try{

  const myChats = await Chat.find({members: user._id, groupChat: false}).populate('members').lean()
  const myChatsIds = myChats.map((chat) => {
    return chat._id
  })

  const allMembers = myChats.map((chat) => {
    return chat.members.filter((member) => member._id.toString() !==user._id.toString())
  }).flat()

  const members = allMembers.map((member) => {
    return member._id
  })

const messagesPromise = myChatsIds.map((curId) => {
  const messages =  Message.updateMany({chat: curId, status: "send", sender: { $nin: user._id.toString()}}, { $set: {status: "online"}})
  return messages
})

const resolvedPromise = await Promise.all(messagesPromise)

    // emitEvent(req, REFETCH_MESSAGES, members, "online");


      const usersSocket = members.map((user) =>
        userSocketIds.get(user.toString())
      );

      io.to(usersSocket).emit(REFETCH_MESSAGES, "online");
      console.log("Messages status changed to online for user : ", user.name)
      return;


}catch(err){ 
console.log("error while updating the messages status to online !",err)
}
}

const updateChatMessagesToSeen = async (userId, chatid, members, io) => {



try{
const messages = await Message.updateMany(
  {chat: chatid, sender: {$nin: userId.toString()}},
  {
    $set: {
      status: "seen",
    },
  },
);

  const usersSocket = members.map((user) => userSocketIds.get(user.toString()));

  io.to(usersSocket).emit(REFETCH_MESSAGES, "seen");

  console.log("all messsages for chat updated to seen for chatid : ", chatid)

}catch(err){ 
  console.log("error while updating the messages status from online to seen !", err)
}

};

module.exports = {
  sendToken,
  emitEvent,
  uploadFilesToCloudinary,
  userSocketIds,
  updateMessagesToOnline,
  updateChatMessagesToSeen,
};
