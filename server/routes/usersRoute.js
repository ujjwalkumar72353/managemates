const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const User = require("../models/userModel");
const authMiddleware = require("../middlewares/authMiddleware");
const { validate } = require("../middlewares/validate");
const { HttpError, asyncHandler } = require("../utils/http");

const email = z.string().trim().toLowerCase().email();
const password = z.string().min(8, "must be at least 8 characters").max(72);
const name = z.string().trim().min(1).max(50);

const registerSchema = z.object({
  firstName: name,
  lastName: name,
  email,
  password,
});
const loginSchema = z.object({ email, password: z.string().min(1) });
const profileSchema = z.object({ firstName: name, lastName: name });
const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

const hashPassword = async (value) =>
  bcrypt.hash(value, await bcrypt.genSalt(10));

// register a new user
router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    if (await User.findOne({ email: req.body.email })) {
      throw new HttpError(409, "User already exists");
    }
    await User.create({
      ...req.body,
      password: await hashPassword(req.body.password),
    });
    res.status(201).send({
      success: true,
      message: "User registered successfully",
    });
  })
);

// login a user
router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    const passwordCorrect =
      user && (await bcrypt.compare(req.body.password, user.password));
    if (!passwordCorrect) {
      throw new HttpError(401, "Invalid email or password");
    }

    const token = jwt.sign({ userId: user._id }, process.env.jwt_secret, {
      expiresIn: "1d",
    });

    res.send({
      success: true,
      data: token,
      message: "User logged in successfully",
    });
  })
);

// get logged in user
router.get(
  "/get-logged-in-user",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      throw new HttpError(401, "Please log in again");
    }
    res.send({
      success: true,
      data: user,
      message: "User fetched successfully",
    });
  })
);

// update name
router.post(
  "/update-profile",
  authMiddleware,
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.userId, req.body, {
      new: true,
    }).select("-password");
    res.send({
      success: true,
      data: user,
      message: "Profile updated successfully",
    });
  })
);

// change password
router.post(
  "/change-password",
  authMiddleware,
  validate(passwordSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    const correct = await bcrypt.compare(
      req.body.currentPassword,
      user.password
    );
    if (!correct) {
      throw new HttpError(400, "Current password is incorrect");
    }
    user.password = await hashPassword(req.body.newPassword);
    await user.save();
    res.send({ success: true, message: "Password changed successfully" });
  })
);

module.exports = router;
