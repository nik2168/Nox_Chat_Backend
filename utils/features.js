const jwt = require("jsonwebtoken");
const { v4 } = require("uuid");
const cloudinary = require("cloudinary");
const { getBase64 } = require("../lib/helper.js");
const Message = require("../models/message.model.js");
const Chat = require("../models/chat.model.js");
const { REFETCH_MESSAGES, LAST_ONLINE, LAST_CHAT_ONLINE } = require("../constants/events.js");
const User = require("../models/user.model.js");
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

  const usersSocket = users.map((user) => userSocketIds.get(user.toString()));

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

const updateLastSeen = async (user, io) => {
  
  try {

const updatedUser = await User.findByIdAndUpdate(
  { _id: user._id },
  { lastSeen: new Date().toISOString() }
);

    const myChats = await Chat.find({
      members: user._id,
      groupChat: false,
    }).lean();


    const members = myChats
      .map((chat) => {
        return chat.members.filter(
          (member) => member.toString() !== user._id.toString()
        ).toString();
      })
      .flat();

      let usersSocket = [];

      for (let i = 0; i < members.length; i++) {
        if (userSocketIds.has(members[i].toString()) && members[i].toString() !== user._id.toString()) {
          usersSocket.push(userSocketIds.get(members[i].toString()));
        }
      } 

    io.to(usersSocket).emit(LAST_ONLINE, updatedUser.lastSeen);

    console.log("last seen  changed to cur time : ", user.name, user._id);
    return;
  } catch (err) {
    console.log("error while updating the messages status to online !", err);
  }
};




// const updateChatMessagesToSeen = async (userId, chatid, members, io) => {

//   try {

//     const curChat = await Chat.findById(chatid)

//     for(let i = 0; i < curChat.lastChatOnlineArray.length; i++){
//       let chatOnlineObj = curChat.lastChatOnlineArray[i];
//       if(chatOnlineObj.memberId.toString() === userId.toString()){
//       chatOnlineObj["lastChatOnline"] = new Date().toISOString();
//       }
//     }

//     await curChat.save();

// const lastChatOnline = {
//   memberId: curChat.lastChatOnlineArray.memberId.toString(),
//   lastChatOnline: new Date().toISOString()
// }

//    let usersSocket = [];

//    for (let i = 0; i < members.length; i++) {
//      if (userSocketIds.has(members[i]._id.toString()) && members[i]._id.toString() !== userId.toString()) {
//        usersSocket.push(userSocketIds.get(members[i]._id.toString()));
//      }
//    }

//     io.to(usersSocket).emit(LAST_CHAT_ONLINE, lastChatOnline);

//     console.log(" chatonline array time updated to cur time for chatid : ", chatid);
//   } catch (err) {
//     console.log(
//       "error while updating the messages status from online to seen !",
//       err
//     );
//   }
// };

module.exports = {
  sendToken,
  emitEvent,
  uploadFilesToCloudinary,
  userSocketIds,
  updateLastSeen,
};
