// const errorMiddleWare = (err, req, res, next) => {

//    err.message || 'Internal Server Error!'
//    err.statuscode ||= 500

//   return res.status(err.status).json({success: false, message: err.message,})
// }
// // I'm not using it ! for now but we can use it if we want ...

// module.exports = errorMiddleWare

const errorMiddleware = (err, req, res, next) => {
  err.message ||= "Internal Server Error";
  err.statusCode ||= 500;

  if (err.code === 11000) {
    const error = Object.keys(err.keyPattern).join(",");
    err.message = `Duplicate field - ${error}`;
    err.statusCode = 400;
  }

  if (err.name === "CastError") {
    const errorPath = err.path;
    err.message = `Invalid Format of ${errorPath}`;
    err.statusCode = 400;
  }

  const response = {
    success: false,
    message: err.message,
  };

  return res.status(err.statusCode).json(response);
};

const TryCatch = (passedFunc) => async (req, res, next) => {
  try {
    await passedFunc(req, res, next);
  } catch (error) {
    next(error);
  }
};

module.exports = { errorMiddleware, TryCatch };
