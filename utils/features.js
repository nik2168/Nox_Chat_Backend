const jwt = require("jsonwebtoken");
const { v4 } = require("uuid");
const cloudinary = require("cloudinary");
const { getBase64 } = require("../lib/helper.js");

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

module.exports = { sendToken, emitEvent, uploadFilesToCloudinary, userSocketIds };
