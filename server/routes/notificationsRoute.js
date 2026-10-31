const router = require("express").Router();
const Notification = require("../models/notificationsModel");
const authMiddleware = require("../middlewares/authMiddleware");
const { asyncHandler } = require("../utils/http");

const findForUser = (userId) =>
  Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50);

// get all notifications
router.get(
  "/get-all-notifications",
  authMiddleware,
  asyncHandler(async (req, res) => {
    res.send({ success: true, data: await findForUser(req.userId) });
  })
);

// mark notifications as read
router.post(
  "/mark-as-read",
  authMiddleware,
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { user: req.userId, read: false },
      { read: true }
    );
    res.send({
      success: true,
      message: "Notifications marked as read",
      data: await findForUser(req.userId),
    });
  })
);

// delete all notifications
router.delete(
  "/delete-all-notifications",
  authMiddleware,
  asyncHandler(async (req, res) => {
    await Notification.deleteMany({ user: req.userId });
    res.send({ success: true, message: "All notifications deleted" });
  })
);

module.exports = router;
