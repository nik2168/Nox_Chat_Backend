const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { ErrorHandler } = require("../utils/utility");


const isAuthenticate = (req, res, next) => {
  try {
    const token = req.cookies[process.env.TOKEN_NAME];

    // If there is no token
    if (!token)
      return res
        .status(400)
        .json({ success: false, message: "Please login to access this route" });

    const decode = jwt.verify(token, process.env.secret);
    req.userId = decode._id;

    next();
  } catch (err) {
    res
      .status(400)
      .json({
        success: false,
        message: "error while authenticating the user !",
      });
  }
};

const adminAuthenticate = (req, res, next) => {
  const adminSecretKey = process.env.ADMIN_SECRET_KEY || "noKey";

  try {
    const token = req.cookies[process.env.ADMIN_TOKEN_NAME];

    // If there is no token
    if (!token)
      return res.status(400).json({
        success: false,
        message: "Please login to access this route, token not here",
      });

    const decode = jwt.verify(token, process.env.secret);
    const isMatch = adminSecretKey === decode.key;

    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "You are not authorized !" });

    next();
  } catch (err){
    res.status(400).json({success: false, message: "error while authenticating the admin !"});
  }
};

const socketAuthenticator = async (err, socket, next) => {
  try {
    if (err) return next(err);

    const authToken = socket.request.cookies[process.env.TOKEN_NAME];

    if (!authToken)
      return next(new ErrorHandler("Please login to access this route", 401));

    const decodedData = jwt.verify(authToken, process.env.secret);

    const user = await User.findById(decodedData._id);

    if (!user)
      return next(new ErrorHandler("Please login to access this route", 401));

    socket.user = user;

    return next();
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler("Please login to access this route", 401));
  }
};

module.exports = { isAuthenticate, adminAuthenticate, socketAuthenticator  };
