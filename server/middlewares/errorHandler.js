const multer = require("multer");

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  if (error instanceof multer.MulterError) {
    return res.status(400).send({ success: false, message: error.message });
  }
  if (error.status) {
    return res
      .status(error.status)
      .send({ success: false, message: error.message });
  }
  if (error.code === 11000) {
    return res
      .status(409)
      .send({ success: false, message: "This record already exists" });
  }
  console.error(error);
  res.status(500).send({ success: false, message: "Something went wrong" });
};

module.exports = errorHandler;
