const express = require("express");
const router = express.Router();

// controllers
const {
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
  changeMessagesToOnline,
  changeMessagesToSeen,
} = require("../controllers/chat.controller.js");

// middle wares
const { isAuthenticate } = require("../middlewares/auth.mw.js");
const { attachmentsMulter, singleAvatar } = require("../middlewares/multer.js");
const {
  createGroupValidator,
  validateHandler,
  addMembersValidator,
  removeMembersValidator,
  leaveGroupValidator,
  sendAttachmentsValidator,
  renameGroupValidator,
  deleteChatValidator,
  getMessagesValidator,
} = require("../lib/validators.js");

// after this all routes need authentication that user must be logged in to access these routes ...

router.use(isAuthenticate); // authenticate a user with cookie

router.post(
  "/creategroup",
  singleAvatar,
  createGroupValidator(),
  validateHandler,
  newGroupChat
);

router.put("/addmembers", addMembersValidator(), validateHandler, addMembers);

router.delete(
  "/removemembers",
  removeMembersValidator(),
  validateHandler,
  removeMembers
);

router.get("/chats", getMyChats);

router.get("/groups", getMyGroups);

router.get("/leave/:id", leaveGroupValidator(), validateHandler, leaveGroup);

router.get("/getchatprofiledata/:id", getChatProfileData);
router.get("/changemessagetoonline", changeMessagesToOnline);
router.get("/changemessagetoseen/:id", changeMessagesToSeen);

router.post(
  "/sendattachments",
  attachmentsMulter,
  sendAttachmentsValidator(),
  validateHandler,
  sendAttachments
); // attachments

router.get(
  "/messages/:id",
  getMessagesValidator(),
  validateHandler,
  getMessages
);

router.get("/getlastmessagetime/:id", getLastMessageTime);

router
  .route("/:id")
  .get(getChatDetails)
  .post(singleAvatar, renameGroupValidator(), validateHandler, updateGroupInfo)
  .delete(deleteChatValidator(), validateHandler, deleteChat);

module.exports = router;
