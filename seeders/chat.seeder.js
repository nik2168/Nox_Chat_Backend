const { faker, simpleFaker } = require("@faker-js/faker");
const Chat = require("../models/chat.model");
const User = require("../models/user.model");


const tempavatar = {
  public_id: "asd8a797",
  url: "akjshdgiaerhg",
};

// single chat seeder
const createSingleChats = async (chatsCount) => {
  try {
    const users = await User.find().select("_id");

    const chatsPromise = [];

    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        chatsPromise.push(
          Chat.create({
            name: faker.lorem.words(2),
            members: [users[i], users[j]],
            avatar: tempavatar
          })
        );
      }
    }

    await Promise.all(chatsPromise);

    console.log("chat created successfully !");
    process.exit();
  } catch (err) {
    console.log("Error while creating fake Single Chats : ", err);
    process.exit(1);
  }
};

const createGroupChats = async (numChats) => {
  try {
    const users = await User.find().select("_id");

    const chatsPromise = [];

    for (let i = 0; i < numChats; i++) {
      const numMembers = simpleFaker.number.int({ min: 3, max: users.length });
      const members = [];

      for (let i = 0; i < numMembers; i++) {
        const randomIndex = Math.floor(Math.random() * users.length);
        const randomUser = users[randomIndex];

        // Ensure the same user not added twice
        if (!members.includes(randomUser)) {
          members.push(randomUser);
        }
      }

      const chat = Chat.create({
        groupChat: true,
        name: faker.lorem.words(1),
        members,
        creator: members[0],
        avatar: tempavatar,
      });
      chatsPromise.push(chat);
    }

    await Promise.all(chatsPromise);

    console.log("groupChats created successfully !");
    process.exit();
  } catch (err) {
    console.error("Error while creating fake Single Chats : ", err);
    process.exit(1);
  }
};

module.exports = {createSingleChats, createGroupChats}