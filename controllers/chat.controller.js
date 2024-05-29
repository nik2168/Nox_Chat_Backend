const {
  ALERT,
  REFETCH_CHATS,
  NEW_ATTACHMENT,
  NEW_MESSAGE_ALERT,
  NEW_MESSAGE,
  MEMBER_REMOVED,
} = require("../constants/events.js");
const { v4 } = require("uuid");
const Chat = require("../models/chat.model.js");
const Message = require("../models/message.model.js");
const User = require("../models/user.model.js");
const { emitEvent, uploadFilesToCloudinary } = require("../utils/features.js");

const tempavatar = {
  public_id: "asd8a797",
  url: "akjshdgiaerhg",
};

// create New Group
const newGroupChat = async (req, res) => {
  const { name, members } = req.body;

  try {
    if (!members || members.length <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "group must have 1 member" });
    }

    const allMembers = [...members, req.userId];

    const file = req.file;

    let avatar;

    if (file) {
      const result = await uploadFilesToCloudinary([file]);

      avatar = {
        public_id: result[0].public_id,
        url: result[0].url,
      };
    }

    const temp = await Chat.create({
      name: name,
      groupChat: true,
      avatar,
      creator: req.userId,
      members: allMembers,
    });

    emitEvent(req, ALERT, allMembers, `Welcome to ${name} group !`);

    emitEvent(req, REFETCH_CHATS, members);

    return res.status(201).json({ success: true, message: "group  created !" });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Error while creating new group :",
      err,
    });
  }
};

// get personal chats
const getMyChats = async (req, res) => {
  const queryName = req.query.name;

  try {
    const chats = await Chat.find({
      members: req.userId,
      name: { $regex: queryName, $options: "i" },
    }).populate("members", "name avatar createdAt bio"); // will provide the user details from the members key. ...

    const transformChats = chats.map(
      ({ _id, name, avatar, groupChat, members }) => {
        const othermember = members.find(
          (i) => i._id.toString() !== req.userId.toString()
        );

        return {
          _id,
          name: groupChat ? name : othermember?.name,
          avatar: groupChat ? avatar?.url : othermember?.avatar?.url,
          groupChat,
          members: members.reduce((pre, cur) => {
            if (cur._id.toString() !== req.userId.toString()) {
              pre.push(cur);
            }
            return pre;
          }, []),
          // lastMessage: lastMessage
        };
      }
    );

    return res.status(200).json({ success: true, mychats: transformChats });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Error while getting personal chats :",
      err,
    });
  }
};

// get all of my group chats
const getMyGroups = async (req, res) => {
  try {
    const groupChats = await Chat.find({
      members: req.userId,
      groupChat: true,
    });

    return res.status(200).json({ success: true, groupChats: groupChats });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Error while fetching personal groups",
      Error: err,
    });
  }
};

// add members to the group
const addMembers = async (req, res) => {
  const { chatId, new_members } = req.body;

  try {
    const curGroup = await Chat.findById(chatId);

    if (!curGroup) {
      return res.status(404).json({
        success: false,
        message: "Group not found to add members",
      });
    }

    if (!new_members || new_members.length < 1) {
      return res.status(404).json({
        success: false,
        message: "please provide atleast 1 member",
      });
    }

    if (!curGroup.groupChat) {
      // if curgroup is not a group
      return res.status(400).json({
        success: false,
        message: "Its not a Group to add members",
      });
    }

    if (curGroup.creator.toString() !== req.userId.toString()) {
      // if admin is not doing it
      return res.status(400).json({
        success: false,
        message: "You're not a admin... Are you?",
      });
    }

    const uniqueMembers = new_members.filter(
      (i) => !curGroup.members.includes(i)
    ); // if admin send a members to add in group who is already in the group this will check it
    curGroup.members = [...curGroup.members, ...uniqueMembers];

    if (curGroup.members.length > 10)
      res
        .status(400)
        .json({ success: true, message: "Group length must be upto 10" }); // members upto 10 only

    await curGroup.save(); // save added members

    // show the added new members update in the group chat ...
    const newMembersPromise = new_members.map((i) => User.findById(i, "name"));
    const newMembers = await Promise.all(newMembersPromise);

    const allMembersName = newMembers.map((i) => i.name).join(",");

    const admin = await User.findById(req.userId);

    // message for real time
    const messageForRealTime = {
      content: `${allMembersName} added by ${admin.name}`,
      attachments: [],
      _id: v4(),
      isAlert: true,
      sender: {
        _id: admin._id,
        name: admin.name,
        chat: chatId,
        createdAt: new Date().toISOString(),
      },
    };

    emitEvent(req, NEW_MESSAGE, curGroup.members, {
      chatid: chatId,
      message: messageForRealTime,
    });

    // message for db
    await Message.create({
      sender: req.adminId,
      content: `${allMembersName} added by ${admin.name}`,
      isAlert: true,
      chat: chatId,
    });

    emitEvent(req, REFETCH_CHATS, curGroup.members);

    return res
      .status(200)
      .json({ success: true, message: "New members added successfully!" });
  } catch (err) {
    if (err.name === "CastError") {
      const path = err.path;
      err.message = `Invalid format of ${path}`;

      return res.status(400).json({
        success: false,
        message: process.env.NODE_ENV === "DEVELOPMENT" ? err : err.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Error while adding member to the groups",
      Error: err,
    });
  }
};

const removeMembers = async (req, res) => {
  const { chatId, remove_members } = req.body;

  try {
    let curGroup = await Chat.findById(chatId);

    if (!curGroup) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (!remove_members || remove_members.length == 0) {
      return res.status(404).json({
        success: false,
        message: "please provide atleast 1 member",
      });
    }

    if (!curGroup.groupChat) {
      // if curgroup is not a group
      return res.status(400).json({
        success: false,
        message: "Its not a Group",
      });
    }

    if (curGroup.creator.toString() !== req.userId.toString()) {
      // if admin is not doing it
      return res.status(400).json({
        success: false,
        message: "You're not a admin... Are you?",
      });
    }

    const allChatMembers = curGroup.members.map((i) => i.toString());

    const uniqueMembers = remove_members.filter((i) =>
      curGroup.members.includes(i)
    ); // if admin send a members to remove from group who is already in the group this will check it
    const filteredMember = curGroup.members.filter(
      (i) => !uniqueMembers.includes(i.toString())
    );
    curGroup.members = [...filteredMember];

    if (curGroup.members.length < 2)
      res
        .status(400)
        .json({ success: true, message: "Group size must be atleast 2" }); // members upto 10 only

    await curGroup.save(); // save removed members

    // show the added new members update in the group chat ...
    const newMembersPromise = uniqueMembers.map((i) =>
      User.findById(i, "name")
    );
    const newMembers = await Promise.all(newMembersPromise);

    const allMembersName = newMembers.map((i) => i.name).join(",");

    const admin = await User.findById(req.userId);

    // message for real time
    const messageForRealTime = {
      content: `${allMembersName} removed from the group by ${admin.name}`,
      attachments: [],
      _id: v4(),
      isAlert: true,
      sender: {
        _id: admin._id,
        name: admin.name,
        chat: chatId,
        createdAt: new Date().toISOString(),
      },
    };

    emitEvent(req, NEW_MESSAGE, allChatMembers, {
      chatid: chatId,
      message: messageForRealTime,
    });

    // message for db
    await Message.create({
      sender: req.userId,
      content: `${allMembersName} removed by ${admin.name}`,
      isAlert: true,
      chat: chatId,
    });

    const removedMemberId = remove_members[0];

    emitEvent(req, MEMBER_REMOVED, allChatMembers, {
      curChatId: chatId.toString(),
      userId: removedMemberId.toString(),
    });

    return res
      .status(200)
      .json({ success: true, message: "Members removed successfully!" });
  } catch (err) {
    if (err.name === "CastError") {
      const path = err.path;
      err.message = `Invalid format of ${path}`;

      return res.status(400).json({
        success: false,
        message: process.env.NODE_ENV === "DEVELOPMENT" ? err : err.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Error while removing members from the groups",
      Error: err,
    });
  }
};

const leaveGroup = async (req, res) => {
  const chatId = req.params.id;

  try {
    const curGroup = await Chat.findById(chatId);

    if (!curGroup) {
      return res.status(404).json({
        success: false,
        message: "Group not found to add members",
      });
    }

    if (!curGroup.groupChat) {
      return res.status(404).json({
        success: false,
        message: "This group is not a group lol",
      });
    }

    curGroup.members = curGroup.members.filter(
      (i) => i.toString() !== req.userId.toString()
    );

    if (req.userId.toString() === curGroup.creator.toString()) {
      curGroup.creator = curGroup.members[0];
    }

    if (curGroup.members.length <= 2)
      res
        .status(400)
        .json({ success: false, message: "Group must have atleast 2 members" });

    await curGroup.save();

    const admin = await User.findById(req.userId);

    // message for real time
    const messageForRealTime = {
      content: `${admin.name} left the group, ${
        curGroup.creator.toString() === req.userId.toString() &&
        "new random admin will be selected from rest of the group members !"
      }`,
      attachments: [],
      _id: v4(),
      isAlert: true,
      sender: {
        _id: admin._id,
        name: admin.name,
        chat: chatId,
        createdAt: new Date().toISOString(),
      },
    };

    emitEvent(req, NEW_MESSAGE, curGroup.members, {
      chatid: chatId,
      message: messageForRealTime,
    });

    // message for db
    await Message.create({
      sender: req.userId,
      content: `${leftUser.name} left the group `,
      isAlert: true,
      chat: chatId,
    });

    emitEvent(req, REFETCH_CHATS, curGroup.members);

    return res.status(200).json({
      success: true,
      message: `You left the group (${curGroup.name}) successfully!`,
    });
  } catch (err) {
    if (err.name === "CastError") {
      const path = err.path;
      err.message = `Invalid format of ${path}`;

      return res.status(400).json({
        success: false,
        message: process.env.NODE_ENV === "DEVELOPMENT" ? err : err.message,
      });
    }

    res.status(400).json({
      success: false,
      Message: "Error while leaving the group",
      Error: err,
    });
  }
};

// send phots, video and stufff. ....
const sendAttachments = async (req, res) => {
  const { chatId } = req.body;

  try {
    const files = req.files || [];

    if (files.length < 1 && files.length > 5) {
      return res.status(400).json({
        success: false,
        message: "please upload attachment upto 5",
      });
    }

      const [chat, user] = await Promise.all([
    Chat.findById(chatId),
    User.findById(req.userId, "name"),
  ]);

    if (!chat)
      return res.status(400).json({
        success: false,
        matchMediaessage: "Error while finding the chatId",
      });

    if (files.length < 1)
      return res
        .status(400)
        .json({ success: "false", message: "please provide attachment!" });

    // upload file here

    const attachments = await uploadFilesToCloudinary(files);

    const messageForRealTime = {
      content: "",
      attachments,
      chat: chatId,
      sender: {
        _id: user._id,
        name: user.name,
      },
    };

    const messageForDb = {
      content: "",
      attachments,
      chat: chatId,
      sender: user._id,
    };

    const message = await Message.create(messageForDb);

    emitEvent(req, NEW_MESSAGE, chat?.members, {
      message: messageForRealTime,
      chatid: chatId,
    });

    emitEvent(req, NEW_MESSAGE_ALERT, chat?.members, { chatid : chatId, message: "ATTACHMENT" });

    res.status(201).json({
      success: true,
      message: message,
    });
  } catch (err) {
    if (err.name === "CastError") {
      const path = err.path;
      err.message = `Invalid format of ${path}`;

      return res.status(400).json({
        success: false,
        message: process.env.NODE_ENV === "DEVELOPMENT" ? err : err.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: "error while sending the attachments",
      Error: err,
    });
  }
};

const getChatProfileData = async (req, res) => {
const chatId = req.params.id

  try {
      const chat = await Chat.findById(chatId)
        .populate("members", "name avatar")
        .lean();

      if (!chat)
        res.status(400).json({ success: false, message: "chat not found" });

      const curChatMembers = chat.members.map((i) => i._id.toString());

      if (!curChatMembers.includes(req.userId.toString())) {
        return res
          .status(400)
          .json({
            success: false,
            message: "you are not a member of this group",
          });
      }

      let profileData;

      if(!chat.groupChat){

        const othermember = chat.members.find((i) => i._id.toString() !== req.userId.toString())
       
        const otherUser = await User.find({_id : othermember._id})
        profileData = otherUser[0]
     
      }
      else{
        profileData = {
          _id: chat._id,
          avatar: chat.avatar,
          createdAt: chat.createdAt,
          name: chat.name,
          creator: chat.creator,
        }
      }


      return res.status(200).json({ success: true,  profileData });

  } catch (err) {
       if (err.name === "CastError") {
         const path = err.path;
         err.message = `Invalid format of ${path}`;

         return res.status(400).json({
           success: false,
           message: process.env.NODE_ENV === "DEVELOPMENT" ? err : err.message,
         });
       }

    return res.status(400).json({
      success: false,
      message: "error while fetching chat profile details",
      Error: err,
    });

  }
};


const getChatDetails = async (req, res) => {
  try {
    if (req.query.populate === "true") {
      // will send members with name and avatar
      const chat = await Chat.findById(req.params.id)
        .populate("members", "name avatar")
        .lean();

      if (!chat)
        res.status(400).json({ success: false, message: "chat not found" });

      const curChatMembers = chat.members.map((i) => i._id.toString());

      if (!curChatMembers.includes(req.userId.toString())) {
        return res
          .status(400)
          .json({
            success: false,
            message: "you are not a member of this group",
          });
      }

      return res.status(200).json({ success: true, curchat: chat });
    }

    // without populate in members else
    else {
      const chat = await Chat.findById(req.params.id);
      if (!chat)
        res.status(400).json({
          success: false,
          Message: "chat not found",
        });

      if (!chat.members.includes(req.userId.toString())) {
        return res
          .status(400)
          .json({
            success: false,
            message: "you are not a member of this group",
          });
      }

      return res.status(200).json({ success: true, curchat: chat });
    }
  } catch (err) {
    if (err.name === "CastError") {
      const path = err.path;
      err.message = `Invalid format of ${path}`;

      return res.status(400).json({
        success: false,
        message: process.env.NODE_ENV === "DEVELOPMENT" ? err : err.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: "error while fetching chat details",
      Error: err,
    });
  }
};

const updateGroupInfo = async (req, res) => {
  const { name } = req.body;
  const chatId = req.params.id;

  try {
    const curGroup = await Chat.findById(req.params.id);

    if (!curGroup)
      return res
        .status(400)
        .json({ success: false, message: "group not found" });

    if (!curGroup.groupChat)
      return res
        .status(400)
        .json({ success: false, message: "Its not a group" });

    curGroup.name = name;

    const file = req.file;

    let avatar;

    if (file) {
      const result = await uploadFilesToCloudinary([file]);

      avatar = {
        public_id: result[0].public_id,
        url: result[0].url,
      };
      curGroup.avatar = avatar;
    }

    await curGroup.save();

    const admin = await User.findById(req.userId);

    // message for real time
    const messageForRealTime = {
      content: `${admin.name} changed the group profile picture & name `,
      attachments: [],
      _id: v4(),
      isAlert: true,
      sender: {
        _id: admin._id,
        name: admin.name,
        chat: chatId,
        createdAt: new Date().toISOString(),
      },
    };

    emitEvent(req, NEW_MESSAGE, curGroup.members, {
      chatid: chatId,
      message: messageForRealTime,
    });

    // message for db
    await Message.create({
      sender: req.userId,
      content: `${admin.name} changed the group profile picture & name`,
      isAlert: true,
      chat: chatId,
    });

    emitEvent(req, REFETCH_CHATS, curGroup.members);

    res
      .status(201)
      .json({ success: true, message: "Group info changed successfully!" });
  } catch (err) {
    if (err.name === "CastError") {
      const path = err.path;
      err.message = `Invalid format of ${path}`;

      return res.status(400).json({
        success: false,
        message: process.env.NODE_ENV === "DEVELOPMENT" ? err : err.message,
      });
    }

    res.status(400).json({
      success: false,
      message: "error while updating group info",
      Error: err,
    });
  }
};

const deleteChat = async (req, res) => {
  try {
    const curGroup = await Chat.findById(req.params.id);

    if (!curGroup)
      return res
        .status(400)
        .json({ success: false, message: "group not found" });

    if (
      curGroup.groupChat &&
      curGroup.creator.toString() !== req.userId.toString()
    )
      return res
        .status(400)
        .json({ success: false, message: "Only Admin can delete Group" });

    if (
      !curGroup.groupChat &&
      !curGroup.members.includes(req.userId.toString())
    )
      return res.status(400).json({
        success: false,
        message: "Do you even know what you are doing brahh?",
      });

    const members = curGroup.members;

    // we need to delete all group data from cloudinary and database

    const messages = await Message.find({
      chat: req.params.id,
      attachments: { $exists: true, $ne: [] },
    }); // $exists will return if the field exist & even if it has null val
    // $ne will return only the query doc without null values
    const public_ids = [];

    messages.forEach(({ attachments }) => {
      attachments.forEach(({ public_id }) => {
        public_ids.push(public_id);
      });
    });

    await Promise.all([
      // delete public_ids from cloudinary,
      curGroup.deleteOne(),
      Message.deleteMany({ chat: req.params.id }),
    ]);

    // emitEvent(
    //   req,
    //   ALERT,
    //   members,
    //   "Guys the group is deleted by that stupid admin!"
    // );

    emitEvent(req, REFETCH_CHATS, members);


    return res
      .status(201)
      .json({ success: true, message: "Group deleted successfully!" });
      
  } catch (err) {
    if (err.name === "CastError") {
      const path = err.path;
      err.message = `Invalid format of ${path}`;

      return res.status(400).json({
        success: false,
        message: process.env.NODE_ENV === "DEVELOPMENT" ? err : err.message,
      });
    }

    res.status(400).json({
      success: false,
      message: "error while deleting the grouchat/chat details",
      Error: err,
    });
  }
};

const getMessages = async (req, res) => {
  const chatId = req.params.id;

  try {

    const { page = 1 } = req.query;

    const limit = 20;
    const skip = (page - 1) * limit;

    const chat = await Chat.findById(chatId);

    if (!chat)
      return res
        .status(404)
        .json({ success: true, message: "chat not found !" });

    if (!chat.members.includes(req.userId.toString()))
      return res.status(403).json({
        success: true,
        message: "You are not allowed to access this chat !",
      });

    const curChat = await Chat.findById(chatId);

    if (!curChat)
      return res
        .status(400)
        .json({ success: false, message: "group not found !" });

    if (!curChat.members.includes(req.userId.toString()))
      return res
        .status(400)
        .json({ sucess: false, message: "you are not a member of this group" });

    const [messages, totalMessagesCount] = await Promise.all([
      Message.find({ chat: chatId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "name avatar")
        .lean(),

      Message.countDocuments({ chat: chatId }),
    ]);

    const totalPages = Math.ceil(totalMessagesCount / limit) || 0; // math ceil will roundoff the value

   return  res
      .status(200)
      .json({ success: true, messages: messages.reverse(), totalPages });
  } catch (err) {
    if (err.name === "CastError") {
      const path = err.path;
      err.message = `Invalid format of ${path}`;

      return res.status(400).json({
        success: false,
        message: process.env.NODE_ENV === "DEVELOPMENT" ? err : err.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: "error while fetching the messages !",
      Error: err,
    });
  }
};

const getLastMessageTime = async (req, res) => {
  const chatId = req.params.id;

  try {

    const { page = 1 } = req.query;

    const limit = 20;
    const skip = (page - 1) * limit;

    const chat = await Chat.findById(chatId);

    if (!chat)
      return res
        .status(404)
        .json({ success: true, message: "chat not found !" });

    if (!chat.members.includes(req.userId.toString()))
      return res.status(403).json({
        success: true,
        message: "You are not allowed to access this chat !",
      });

    const curChat = await Chat.findById(chatId);

    if (!curChat)
      return res
        .status(400)
        .json({ success: false, message: "group not found !" });

    if (!curChat.members.includes(req.userId.toString()))
      return res
        .status(400)
        .json({ sucess: false, message: "you are not a member of this group" });

    const [messages, totalMessagesCount] = await Promise.all([
      Message.find({ chat: chatId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "name avatar")
        .lean(),

      Message.countDocuments({ chat: chatId }),
    ]);

    const totalPages = Math.ceil(totalMessagesCount / limit) || 0; // math ceil will roundoff the value

    // const transformMessages = messages.reverse()
    const lastMsg = messages[0]

   return  res
      .status(200)
      .json({ success: true, lastMessage: lastMsg, totalPages });
      
  } catch (err) {
    if (err.name === "CastError") {
      const path = err.path;
      err.message = `Invalid format of ${path}`;

      return res.status(400).json({
        success: false,
        message: process.env.NODE_ENV === "DEVELOPMENT" ? err : err.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: "error while fetching the last messages  !",
      Error: err,
    });
  }
};

module.exports = {
  newGroupChat,
  getMyChats,
  getMyGroups,
  addMembers,
  removeMembers,
  leaveGroup,
  sendAttachments,
  getChatDetails,
  updateGroupInfo,
  deleteChat,
  getMessages,
  getChatProfileData,
  getLastMessageTime,
};
