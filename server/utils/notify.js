const Notification = require("../models/notificationsModel");
const { emitToUser } = require("./realtime");

const notifyUser = async ({ user, title, description, onClick }) => {
  const notification = await Notification.create({
    user,
    title,
    description,
    onClick,
  });
  emitToUser(user.toString(), "notification:new", notification);
  return notification;
};

module.exports = { notifyUser };
