const express = require("express");

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const { createServer } = require("http");
const { v4 } = require("uuid");
const cors = require("cors");
const cloudinary = require("cloudinary");
const corsOptions = require("./constants/config.js");

// routes import
const userRoutes = require("./routes/user.routes.js");
const chatRoutes = require("./routes/chat.routes.js");
const adminRoutes = require("./routes/admin.routes.js");

const app = express();
app.use(cookieParser());
app.use(cors(corsOptions));

// socket.io
const { Server } = require("socket.io");
const {
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  START_TYPING,
  STOP_TYPING,
  CHAT_JOINED,
  CHAT_LEAVE,
  ONLINE_USERS,
  CHAT_ONLINE_USERS,
  SCHEDULE_MESSAGE,
  UPDATE_POLL,
} = require("./constants/events.js");
const Message = require("./models/message.model.js");
const { socketAuthenticator } = require("./middlewares/auth.mw.js");
const { errorMiddleWare } = require("./middlewares/error.mw.js");
const { userSocketIds, updateLastSeen } = require("./utils/features.js");
const onlineUsers = new Set();
const chatOnlineUsers = new Map();
const server = createServer(app);
const io = new Server(server, { cors: corsOptions });

// socket.io
app.set("io", io); // saved the io instance to whole app ...

dotenv.config({
  path: "./.env",
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


mongoose
  .connect(process.env.MONGO_URI, { dbName: process.env.name })
  .then(() => {
    console.log("Connected to database successfully!");

    server.listen(process.env.port, () => {
      console.log(
        `Sever is running at port: ${process.env.port} in ${process.env.NODE_ENV} mode`
      );
    });

    app.get("/", (req, res) => {
      res.send("Hello world !");
    });
  })
  .catch((err) => {
    console.log("Error while connecting to db", err);
  });

// cloudinary setup
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/admin", adminRoutes);

// instead of socket.handshake we can use socket middleware api to authenticate the connection
io.use((socket, next) => {
  cookieParser()(
    socket.request,
    socket.request.res,
    async (err) => await socketAuthenticator(err, socket, next)
  );
});

app.use((err, req, res, next) => {
  // socket error middleware
  err.message ||= "Internal Server Error";
  err.statusCode ||= 500;

  const response = {
    success: false,
    message: err.message,
  };

  return res.status(err.statusCode).json(response);
});

// socket.io connection
io.on("connection", async (socket) => {
  const user = socket.user;
  // will get all the users currently connected to socket
  // temp user

  if (!userSocketIds.get(user._id.toString()))
    userSocketIds.set(user._id.toString(), socket.id); // all the socket connected users are in this map

  console.log("a user connected", socket.id);

  onlineUsers.add(user._id.toString());

  io.emit(ONLINE_USERS, Array.from(onlineUsers));

  // await updateLastSeen(user, io);

  socket.on(
    NEW_MESSAGE,
    async ({ message, chatid, members, isPoll, options, otherMember }) => {
      // we got this data from frontend for each chat

      const tempId = v4();

      const messageForRealTime = {
        // this will be the message for real time chatting ...
        content: message,
        attachments: [],
        _id: tempId, // generate a random _id temprary
        tempId,
        isPoll: isPoll || false,
        options: options || [],
        sender: {
          _id: user._id,
          name: user.name,
          chat: chatid,
          createdAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
      };

      const messageForDb = {
        // this format of message will save in our Message model
        content: message,
        attachments: [],
        isPoll: isPoll || false,
        options: options || [],
        sender: user._id,
        chat: chatid,
        tempId,
      };

      try {
        await Message.create(messageForDb);
      } catch (err) {
        console.log("Error while saving message to db:", err);
      }

      io.emit(NEW_MESSAGE, {
        chatId: chatid,
        message: messageForRealTime,
      });

      io.emit(NEW_MESSAGE_ALERT, {
        chatid,
        message: messageForRealTime,
        members,
      });
    }
  );

  // update Poll
  socket.on(
    UPDATE_POLL,
    async ({ tempId, optionIdx, userId, chatId, userData }) => {
      try {
        const messageData = await Message.findOne({ tempId: tempId }).populate(
          "options.members"
        );

        // push user in current option's members
        let ifAlreadyIncludes = false;
        for (
          let i = 0;
          i < messageData.options[optionIdx].members.length;
          i++
        ) {
          if (
            messageData.options[optionIdx].members[i]._id.toString() ===
            user._id.toString()
          ) {
            messageData.options[optionIdx].members.splice(i, 1);
            ifAlreadyIncludes = true;
          }
        }

        // remove user from each option ...
        if(!ifAlreadyIncludes){
        messageData.options.map((option, i) => {
          option.members = option.members.filter((i) => i._id != userId);
        });
        messageData.options[optionIdx].members.push(userData);
      }

        await messageData.save();
        io.emit(UPDATE_POLL, { tempId, messageData, chatId, userId });
      } catch (error) {
        console.log("Error while updating the poll !", error);
      }
    }
  );

  socket.on(
    SCHEDULE_MESSAGE,
    async ({ message, chatid, members, otherMember, scheduleTime }) => {
      // we got this data from frontend for each chat

      const messageForRealTime = {
        // this will be the message for real time chatting ...
        content: message,
        attachments: [],
        _id: v4(), // generate a random _id temprary
        sender: {
          _id: user._id,
          name: user.name,
          chat: chatid,
          createdAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
      };

      const messageForDb = {
        // this format of message will save in our Message model
        content: message,
        attachments: [],
        sender: user._id,
        chat: chatid,
      };

      const time = scheduleTime * 1000 * 60;

      setTimeout(async () => {
        try {
          await Message.create(messageForDb);
        } catch (err) {
          console.log("Error while saving message to db:", err);
        }

        // let membersSockets = [];

        // for (let i = 0; i < members.length; i++) {
        //   if (userSocketIds.has(members[i]._id.toString())) {
        //     membersSockets.push(userSocketIds.get(members[i]._id.toString()));
        //   }
        // }

        io.emit(NEW_MESSAGE, {
          chatId: chatid,
          message: messageForRealTime,
        });

        io.emit(NEW_MESSAGE_ALERT, {
          chatid,
          message: messageForRealTime,
          members,
        });
      }, time);
    }
  );

  socket.on(START_TYPING, ({ filteredMembers, chatid, username }) => {
    // const membersSockets = filteredMembers.map((member) =>
    //   userSocketIds.get(member._id.toString())
    // );

    io.emit(START_TYPING, { chatid, username, filteredMembers });
  });

  socket.on(STOP_TYPING, ({ filteredMembers, chatid }) => {
    // const membersSockets = filteredMembers.map((member) =>
    //   userSocketIds.get(member._id.toString())
    // );
    io.emit(STOP_TYPING, { chatid, filteredMembers });
  });

  socket.on(CHAT_JOINED, async ({ userId, members, chatid }) => {
    chatOnlineUsers.set(`${userId.toString()}`, chatid);
    const membersSockets = members.map((member) =>
      userSocketIds.get(member._id.toString())
    );
    const chatOnlineUsersObj = Object.fromEntries(chatOnlineUsers.entries());
    io.emit(CHAT_ONLINE_USERS, {
      chatOnlineMembers: chatOnlineUsersObj,
      chatId: chatid,
    });
  });

  socket.on(CHAT_LEAVE, async ({ userId, members, chatid }) => {
    chatOnlineUsers.delete(userId.toString());

    const membersSockets = members.map((member) =>
      userSocketIds.get(member._id.toString())
    );

    io.emit(CHAT_ONLINE_USERS, {
      chatOnlineMembers: Object.fromEntries(chatOnlineUsers.entries()),
      chatId: chatid,
    });
  });

  socket.on("disconnect", async () => {
    // await updateLastSeen(user, io);
    userSocketIds.delete(user._id.toString());
    onlineUsers.delete(user._id.toString());
    chatOnlineUsers.delete(user._id.toString());
    io.emit(ONLINE_USERS, Array.from(onlineUsers));
    socket.broadcast.emit(CHAT_ONLINE_USERS, {
      chatOnlineMembers: Object.fromEntries(chatOnlineUsers.entries()),
    });

    userSocketIds.delete(user._id.toString()); // will remove members from map once they dissconnected ...
    console.log("user dissconnected");
  });
});
