const express = require("express");
const router = express.Router();

// controllers
const {
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
} = require("../controllers/user.controller.js");

// middle wares
const { singleAvatar } = require("../middlewares/multer.js");
const {
  verifyLoginBody,
  verifySignUpBody,
} = require("../middlewares/user.mw.js");
const { isAuthenticate } = require("../middlewares/auth.mw.js");
const {
  validateHandler,
  sendFriendRequestValidator,
  acceptFriendRequestValidator,
  profileDataUpdateValidator,
} = require("../lib/validators.js");



// User API
// Create a new user in database and saved in cookie
router.post("/signup", singleAvatar, verifySignUpBody, createUser);
// Login a existing user
router.post("/login", singleAvatar, verifyLoginBody, userLogin);

// after this all routes need authentication that user must be logged in to access these routes ...
router.use(isAuthenticate); // authenticate a user with cookie
router.get("/profile", userProfile);
router.put("/updateprofiledata", profileDataUpdateValidator(), validateHandler, profileDataUpdate);
router.put("/updateprofilepicture", singleAvatar, updateProfilePicture)
router.get("/logout", logout);
router.get("/search", searchUser);

router.put(
  "/sendrequest",
  sendFriendRequestValidator(), 
  validateHandler,
  sendFriendRequest
);

router.put(
  "/acceptrequest",
  acceptFriendRequestValidator(),
  validateHandler,
  acceptFriendRequest,
);

router.get("/notifications", getNotifications);
router.get("/userfriends", getUserFriends);

module.exports = router;
