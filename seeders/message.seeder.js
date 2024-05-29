const { faker, simpleFaker } = require("@faker-js/faker");
const Chat = require("../models/chat.model");
const Message = require("../models/message.model");
const User = require("../models/user.model");


const createMessages = async (numMessages) => {
  try {
    const users = await User.find().select("_id");
    const chats = await Chat.find().select("_id");

    const messagesPromise = [];

    for (let i = 0; i < numMessages; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomChat = chats[Math.floor(Math.random() * chats.length)];

      messagesPromise.push(
        Message.create({
          chat: randomChat,
          sender: randomUser,
          content: faker.lorem.sentence(),
        })
      );
    }

    await Promise.all(messagesPromise);

    console.log("Messages created successfully");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const createMessagesInAChat = async (chatId, numMessages) => {
  try {
    const users = await User.find().select("_id");
    const messagesPromise = [];

    for (let i = 0; i < numMessages; i++) {
      const randomUser = users[Math.floor(Math.random() * numMessages)];

      messagesPromise.push(
        Message.create({
          chat: chatId,
          sender: randomUser,
          content: faker.lorem.sentence(),
        })
      );
    }
    await Promise.all(messagesPromise);
    console.log("Messages created successfully in a chat !");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = {createMessages, createMessagesInAChat}