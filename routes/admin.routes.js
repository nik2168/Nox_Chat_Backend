const express = require("express");
const router = express.Router();

// controllers
const {
  getAllChats,
  getAllMessages,
  getAllUsers,
  getDashboard,
  adminLogin,
  adminLogout,
  adminVerify,
} = require("../controllers/admin.controller");


// middlewares
const { adminValidator, validateHandler } = require("../lib/validators");
const { adminAuthenticate } = require("../middlewares/auth.mw");


// routes

router.put("/login", adminValidator(), validateHandler, adminLogin);
router.get("/logout", adminLogout);

// only accessable if admin is loggedIn
router.use(adminAuthenticate)
router.get("/", adminVerify);
router.get("/users", getAllUsers);
router.get("/chats", getAllChats);
router.get("/messages", getAllMessages);
router.get("/stats", getDashboard);

module.exports = router;
