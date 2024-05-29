const { body, validationResult, param, query} = require("express-validator");

const validateHandler = (req, res, next) => {
  const errors = validationResult(req);

  const errorMessages = errors
    .array()
    .map((err) => err.msg)
    .join(", ");

  if (errors.isEmpty())  next();
  else {
    res.status(400).json({ success: false, message: errorMessages });
  }
};

const registerValidator = () => [
  body("name", "please enter name").notEmpty(),
  body("usermane", "please enter usermane").notEmpty(),
  body("password", "please enter password").notEmpty(),
  body("bio", "please enter bio").notEmpty(),
];

const createGroupValidator = () => [
  body("name", "please provide a name for the group").notEmpty(),
  body("members", "please provide members").notEmpty()
];

const addMembersValidator = () => [
  body("chatId", "please provide a chatId").notEmpty(),
  body("new_members", "please provide new_members")
    .notEmpty()
    .withMessage("Please provide new_members")
    .isArray({ min: 1})
    .withMessage("Please provide atleast 1 new_member"),
];

const removeMembersValidator = () => [
  body("chatId", "please provide a chatId").notEmpty(),
  body("remove_members", "please provide remove_members")
    .notEmpty()
    .withMessage("Please provide remove_members")
    .isArray({ min: 1 })
    .withMessage("Please provide atleast 1 remove_members"),
];

const leaveGroupValidator = () => [
  param("id", "please provide a id in params").notEmpty(),
]

const sendAttachmentsValidator = () => [
  body("chatId", "please provide a chatId").notEmpty(),
  // check("files", "please provide attachment")  // check didn't caught the files error so will use in controller itself
  //   .notEmpty()
  //   .withMessage("Please provide attachment")
  //   .isArray({ min: 1, max: 5 })
  //   .withMessage("Please provide atleast 1-5 file"),
];

const renameGroupValidator = () => [
  param("id", "please provide a id in params").notEmpty(),
  body("name", "please provide a name").notEmpty(),
];


const deleteChatValidator = () => [
  param("id", "please provide a id in params").notEmpty(),
];

const getMessagesValidator = () => [
  param("id", "please provide a id in params").notEmpty(),
  query("page", "please provide a query for page no").notEmpty(),
];

const sendFriendRequestValidator = () => [
  body("userId", "please provide a userId in body").notEmpty(),
];

const acceptFriendRequestValidator = () => [
  body("requestId", "please provide a requestId in body").notEmpty(),
  body("accept", "please provide a accept in body").notEmpty().isBoolean()
];

const adminValidator = () => [
  body("secretKey", "Please enter secret key").notEmpty()
]

const profileDataUpdateValidator = () => [
  body("username", "please provide a username in body").notEmpty(),
  body("bio", "please provide a bio in body").notEmpty(),
  body("name", "please provide a name in body").notEmpty(),
];


module.exports = {
  registerValidator,
  validateHandler,
  createGroupValidator,
  addMembersValidator,
  removeMembersValidator,
  leaveGroupValidator,
  sendAttachmentsValidator,
  renameGroupValidator,
  deleteChatValidator,
  getMessagesValidator,
  sendFriendRequestValidator,
  acceptFriendRequestValidator,
  profileDataUpdateValidator,
  adminValidator,
};
