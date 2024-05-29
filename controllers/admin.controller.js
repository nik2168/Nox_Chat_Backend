const jwt = require("jsonwebtoken");
const Chat = require("../models/chat.model");
const Message = require("../models/message.model");
const User = require("../models/user.model");
const { v4 } = require("uuid");


const cookieObj = {
  maxAge: 15 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

const adminLogin = async (req, res) => {

    const secretKey = req.body.secretKey

    const adminSecretKey = process.env.ADMIN_SECRET_KEY || "noKey"

try{
  
    const isMatch = secretKey.toString() === adminSecretKey.toString()

    if(!isMatch) return res.status(401).json({success: false, message: 'Secret key is incorrect'})

        const token = jwt.sign({key: adminSecretKey}, process.env.secret);

      return  res.status(200).cookie(process.env.ADMIN_TOKEN_NAME, token, {...cookieObj, maxAge: 1000 * 60 * 15}).json({sucess: 'true', message: 'Login successfull as Admin '})

}catch(err){
    res.status(400).json({success: false, message: 'error during admin login !'})
}

}

const adminVerify = async(req, res) => {
try {

  return res
    .status(200)
    .json({ admin: true});

} catch (err) {
  res
    .status(400)
    .json({ success: false, message: "error while verfying the admin" });
}
}

const adminLogout = async (req, res) => {

   try{
      return res
        .status(200)
        .cookie(process.env.ADMIN_TOKEN_NAME, "", {...cookieObj, maxAge: 0})
        .json({ sucess: "true", message: "admin logout successfully!" });

   }catch(err){
    res.status(400).json({success: false, message: 'error during logout process'})
   }

}

const getAllUsers = async (req, res) => {
  try {
    const allUsers = await User.find().select("-password");

    if (!allUsers)
      res.status(400).json({
        success: false,
        message: "error while fetching all the users",
      });

    const transformUser = await Promise.all(
      allUsers.map(async ({ name, _id, avatar, username }) => {
        const [groups, friends] = await Promise.all([
          Chat.countDocuments({ groupChat: "true", members: _id }),
          Chat.countDocuments({ groupChat: "false", members: _id }),
        ]);

        return {
          name,
          _id,
          avatar: avatar.url,
          username,
          groups,
          friends,
        };
      })
    );

    res.status(200).json({ success: true, users: transformUser });
  } catch (err) {
    res
      .status(400)
      .json({ success: false, message: "Error while getting all users" });
  }
};

const getAllChats = async (req, res) => {
  try {
    const allChats = await Chat.find()
      .populate("members", "name avatar")
      .populate("creator", "name avatar");

    const transformChat = await Promise.all(
      allChats.map(
        async ({ name, members, _id, avatar, creator, groupChat }) => {
          const [totalMessages] = await Promise.all([
            Message.countDocuments({ chat: _id }),
          ]);

          return {
            // _id,
            // name,
            // totalMember: members.length,
            // members: members.map(({ _id, name, avatar }) => ({
            //   name,
            //   _id,
            //   avatar: avatar.url,
            // })),
            // totalMessages,
            // avatar: members.slice(0, 3).map((member) => member.avatar.url),
            // creator: {
            //   name: creator?.name || "none",
            //   _id: creator?._id || "",
            //   avatar: creator?.avatar.url || "",
            // },
            // groupChat,
            _id,
            groupChat,
            name,
            avatar: members.slice(0, 3).map((member) => member.avatar.url),
            members: members.map(({ _id, name, avatar }) => ({
              _id,
              name,
              avatar: avatar.url,
            })),
            creator: {
              name: creator?.name || "None",
              avatar: creator?.avatar.url || "",
            },
            totalMembers: members.length,
            totalMessages,
          };
        }
      )
    );

   return res.status(200).json({ success: true, chats: transformChat });
  } catch (err) {
   return  res
      .status(400)
      .json({ success: false, message: "Error while getting all chats" });
  }
};

const getAllMessages = async (req, res) => {
  try {
  const messages = await Message.find({})
    .populate("sender", "name avatar")
    .populate("chat", "groupChat");


  const transformedMessages = messages.map(
    ({ content, attachments, _id, sender, createdAt, chat }) => ({
      _id,
      attachments,
      content,
      createdAt,
      chat: chat?._id || v4(),
      groupChat: chat?.groupChat || false,
      sender: {
        _id: sender._id,
        name: sender.name,
        avatar: sender.avatar?.url,
      },
    })
  );

  console.log( "here : ", transformedMessages[0])

  return res.status(200).json({
    success: true,
    messages: transformedMessages,
  });

  } catch (err) {
   return  res
      .status(400)
      .json({ success: false, message: "Error while getting all messages" });
  }
};

const getDashboard = async (req, res) => {

  try {
    const [msgCount, chatCount, usersCount, groupChatCount] = await Promise.all(
      [
        Message.countDocuments(),
        Chat.countDocuments(),
        User.countDocuments(),
        Chat.countDocuments({ groupChat: true }),
      ]
    ); // got all the document types


    // tricky part
 const today = new Date(); 
 const last7Days = new Date(); // 7 days before date from current date
 const dayInMillisecond = 1000*60*60*24; // 24 hours in milliseconds
 last7Days.setDate(last7Days.getDate() - 7)

 // last 7 days messages
 const last7DaysMessages =  await Message.find({createdAt: {$gte: last7Days, $lte: today,}}).select("createdAt") 

const messages = new Array(7).fill(0) // array with 7 length and initial val zero

last7DaysMessages.forEach(message => {
     // today time in ms - message created at time in ms / day in ms  
     // if today in 7 march 
     // then this index aprrox must be 1 - 7 for each messages

    const indexApprox = (today.getTime() - message.createdAt.getTime())/dayInMillisecond;

    const index = Math.floor(indexApprox) 
    messages[6-index]++; // to match the days before with array indexing 
})

    const stats = {
      msgCount,
      chatCount,
      usersCount,
      groupChatCount,
      messageChart: messages,
    };

    res.status(200).json({ success: true, stats: stats });
  } catch (err) {
    res
      .status(400)
      .json({ success: false, message: "Error while getting admin dsahboard" });
  }
};

module.exports = {
  getAllUsers,
  getAllChats,
  getAllMessages,
  getDashboard,
  adminLogin,
  adminLogout,
  adminVerify,
};
