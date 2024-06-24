const User = require("../models/user.model.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Chat = require("../models/chat.model.js");
const Message = require("../models/message.model.js");
const { emitEvent, uploadFilesToCloudinary } = require("../utils/features.js");
const { NEW_REQUEST, REFETCH_CHATS } = require("../constants/events.js");
const Request = require("../models/request.model.js");

const cookieObj = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

// SIGN UP :
const createUser = async (req, res) => {
  const { name, username, password, bio } = req.body;
  try {
    const file = req.file;
    if (!file)
      res.status(400).json({ sucess: false, message: "Please Upload avatar" });

    const result = await uploadFilesToCloudinary([file]);

    const avatar = {
      public_id: result[0].public_id,
      url: result[0].url,
    };

    const newUser = await User.create({
      name,
      username,
      password,
      bio,
      avatar,
    });

    // generate a new jwt token
    const token = jwt.sign({ _id: newUser._id }, process.env.secret);

    // If everything is fine then send the jwt token in cookie
    return res
      .status(201)
      .cookie(process.env.TOKEN_NAME, token, cookieObj)
      .json({ success: true, message: "User Created!", user: newUser });
  } catch (err) {
    if (err.code === 11000) {
      const error = Object.keys(err.keyPattern).join(",");
      return res
        .status(400)
        .json({ success: false, message: `Duplicate field ${error}` });
    }
    return res
      .status(500)
      .json({ success: false, message: "error while trying to signup", err: err });
  }
};

// LOG IN :
const userLogin = async (req, res) => {
  const { username, password } = req.body;


  try {
    // check if user is present
    const checkUser = await User.findOne({ username: username }).select(
      "+password"
    );
    if (!checkUser)
      return res
        .status(400)
        .json({ success: false, message: "User not found!" });

    // check if the password is correct
    const checkPassword = await bcrypt.compare(password, checkUser.password);
    if (!checkPassword)
      return res
        .status(400)
        .json({ success: false, message: "Incorrect password!" });

    // generate a new jwt token
    const token = jwt.sign({ _id: checkUser._id }, process.env.secret);

    // If everything is fine then send the jwt token in cookie
    return res
      .status(200)
      .cookie(process.env.TOKEN_NAME, token, cookieObj)
      .json({ success: true, message: "Login Success!", user: checkUser });
      
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error while creating the user", des: err });
  }
};

// user Profile
const userProfile = async (req, res) => {
  try {
    const getUser = await User.findById(req.userId).select("-password"); // default

    if (!getUser)
      return res.status(400).json({ success: true, message: "User not exist" });

    res.status(200).json({
      success: true,
      user: getUser,
    });
  } catch (err) {
    res.status(500).json({
      success: true,
      message: "Error while fetching user profile",
      err,
    });
  }
};

// profile Update
const profileDataUpdate = async (req, res) => {
  const { name, username, bio } = req.body;

  try {
    const getUser = await User.findById(req.userId).select("-password"); // default

    if (!getUser)
      return res.status(400).json({ success: true, message: "User not exist" });

    const checkUser = await User.findOne({ username: username });

    if (
      checkUser &&
      checkUser.username.toString() !== getUser.username.toString()
    )
      res
        .status(400)
        .json({ success: true, message: "username already exist !" });

    const update = {
      name: name,
      username: username,
      bio: bio,
    };

    await User.findOneAndUpdate({ _id: req.userId }, update);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully !",
    });
  } catch (err) {
    res.status(500).json({
      success: true,
      message: "Error while updating user profile",
      err,
    });
  }
};

const updateProfilePicture = async (req, res) => {

  try {
    
    const file = req.file
    console.log(file)

    if (!file)
      return res
        .status(400)
        .json({ success: false, message: "Please send a photo to update !" });

    const result = await uploadFilesToCloudinary([file]);

    const avatar = {
      public_id: result[0].public_id,
      url: result[0].url,
    };

    const update = {
      avatar: avatar,
    };

    await User.findOneAndUpdate({ _id: req.userId }, update);

return res.status(200).json({success: true, message: "Profile picture updated successfully !"})

  } catch (err) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Error while updating profile picture !",
        err,
      });
  }
};

// logout
const logout = async (req, res) => {
  try {
    return res
      .status(200)
      .cookie(process.env.TOKEN_NAME, "", { ...cookieObj, maxAge: 0 }) // remove the cookie from user to logout by sending a new empty cookie with age zero.
      .json({
        success: true,
        message: "log out successfully !",
      });
  } catch (err) {
    res
      .status(400)
      .json({ success: false, message: "error while we trying to logout" });
  }
};

// find a user
const searchUser = async (req, res) => {
  const queryName = req.query.name;

  try {
    const myChats = await Chat.find({ members: req.userId, groupChat: false });

    const friends = myChats
      .map((chat) => chat.members)
      .flat()
      .filter((i) => i.toString() !== req.userId.toString());

    const allUsersExceptMyFriends = await User.find({
      _id: { $nin: friends },
      name: { $regex: queryName, $options: "i" },
    });

    const users = allUsersExceptMyFriends.map(({ name, avatar, _id, bio, username }) => {
      return {
        name,
        _id,
        avatar: avatar.url,
        bio,
        username,
      };
    });

    res.status(200).json({ success: true, users: users });
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
      message: "Error while searching the user: ",
      err,
    });
  }
};

// send friend request
const sendFriendRequest = async (req, res) => {
  const { userId } = req.body;

  try {
    const request = await Request.findOne({
      $or: [
        { sender: req.userId, receiver: userId },
        { sender: userId, receiver: req.userId },
      ],
    });

    if (request)
      return res
        .status(400)
        .json({ success: true, message: "request already sent" });

    await Request.create({
      sender: req.userId,
      receiver: userId,
    });

    emitEvent(req, NEW_REQUEST, [userId]);

    res
      .status(200)
      .json({ success: true, message: "request sent successfully !" });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error while sending friend request !",
    });
  }
};

// accept firend request
const acceptFriendRequest = async (req, res) => {
  const { requestId, accept } = req.body;

  try {
    // fetch req from req id
    const request = await Request.findById(requestId)
      .populate("sender", "name avatar")
      .populate("receiver", "name");

    if (!request) {
      return res
        .status(400)
        .json({ success: false, message: "request not found !" });
    }

    if (request.receiver._id.toString() !== req.userId.toString()) {
      return res
        .status(401)
        .json({ success: false, message: "You are not authorised !" });
    }

    if (!accept) {
      // if user rejected the request
      await request.deleteOne();

      return res
        .status(201)
        .json({ success: true, message: "request rejected !" });
    }

    const members = [request.sender._id, request.receiver._id]; // members will be user itself and the req sende

 
    await Promise.all([
      Chat.create({
        // will create a chat of both members together
        name: request.sender.name,
        members,
        avatar: request.sender.avatar,
      }),
      request.deleteOne(), // will delete the request at the end
    ]);

    emitEvent(req, REFETCH_CHATS, members); // refetch the chats of user

    return res.status(200).json({
      // finally you know what this is ...... ain't you?
      success: true,
      message: "request accepted successfully !",
      senderId: request.sender._id,
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
      message: "Error while accepting friend request !",
    });
  }
};

const getNotifications = async (req, res) => {
  try {
    const allrequests = await Request.find({ receiver: req.userId }).populate(
      "sender",
      "name avatar"
    );

    const notifications = allrequests.map(({ _id, sender }) => {
      return {
        _id: _id,
        sender: {
          _id: sender._id,
          name: sender.name,
          avatar: sender.avatar.url,
        },
      };
    });

    res.status(200).json({ success: true, notifications: notifications });
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
      Message: "Error while fetching the notifications",
    });
  }
};

const getUserFriends = async (req, res) => {
  const chatId = req.query?.chatid;
    const queryName = req.query?.name;


  try {
    const userChats = await Chat.find({
      members: req.userId,
      groupChat: false,
    }).populate("members", "name avatar");

    const allFriends = userChats
      .map((chat) => chat.members)
      .flat()
      .filter((i) => i._id.toString() !== req.userId.toString());

       const searchedFriends = await User.find({
        _id: {$in : allFriends},
         name: { $regex: queryName, $options: "i" },
       });

           const transformSearchedFriends = searchedFriends.map(({ name, avatar, _id }) => {
             return {
               name,
               _id,
               avatar: avatar.url,
             };
           });


    if (chatId) {
      const chatFriends = await Chat.findById(chatId);
      const getfriends = transformSearchedFriends.filter(
        (i) => !chatFriends.members.includes(i._id)
      );

      return res.status(200).json({ success: true, allFriends: getfriends });
    }

    return res
      .status(200)
      .json({ success: true, allFriends: transformSearchedFriends });

  } catch (err) {
    if (err.name === "CastError") {
      const path = err.path;
      err.message = `Invalid format of ${path}`;

      return res.status(400).json({
        success: false,
        message: process.env.NODE_ENV === "DEVELOPMENT" ? err : err.message,
      });
    }

    return res
      .status(400)
      .json({ success: false, Message: "Error while fetching User's friends" });
  }
};

module.exports = {
  createUser,
  userLogin,
  userProfile,
  profileDataUpdate,
  updateProfilePicture,
  logout,
  searchUser,
  sendFriendRequest,
  acceptFriendRequest,
  getNotifications,
  getUserFriends,
};
