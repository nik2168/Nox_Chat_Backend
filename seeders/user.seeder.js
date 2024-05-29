const Chat = require("../models/chat.model.js");
const User = require("../models/user.model.js");
const { faker, simpleFaker } = require("@faker-js/faker");

const createUser = async (numUsers) => {
  try {
    const userPromise = [];

    for (let i = 0; i < numUsers; i++) {
      const tempUser = User.create({
        name: faker.person.fullName(),
        username: faker.internet.userName(),
        bio: faker.lorem.sentence(1),
        password: "password",
        avatar: {
          url: faker.image.avatar(),
          public_id: faker.system.fileName(),
        },
      });

      userPromise.push(tempUser);
    }

    await Promise.all(userPromise);

    console.log("Users Created", numUsers);

    process.exit(1); // to exit the server
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};





module.exports = { createUser };
