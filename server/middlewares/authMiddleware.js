const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const { userId } = jwt.verify(token, process.env.jwt_secret);
    req.userId = userId;
    next();
  } catch (error) {
    res.status(401).send({
      success: false,
      message: "Please log in again",
    });
  }
};
