const bcrypt = require("bcryptjs");
const User = require("./models/userModel");
const Project = require("./models/projectModel");
const Task = require("./models/taskModel");
const Notification = require("./models/notificationsModel");

const DEMO_PASSWORD = "demo12345";
const DAY = 24 * 60 * 60 * 1000;

// Only ever fills an empty database
const seedDemoData = async () => {
  if ((await User.countDocuments()) > 0) {
    return;
  }
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const [owner, admin, employee] = await User.create([
    { firstName: "Arjun", lastName: "Mehta", email: "owner@demo.com", password },
    { firstName: "Rohan", lastName: "Verma", email: "admin@demo.com", password },
    {
      firstName: "Karan",
      lastName: "Singh",
      email: "employee@demo.com",
      password,
    },
  ]);
  const project = await Project.create({
    name: "Website Launch",
    description: "Redesign and ship the new company website",
    owner: owner._id,
    members: [
      { user: owner._id, role: "owner" },
      { user: admin._id, role: "admin" },
      { user: employee._id, role: "employee" },
    ],
  });
  const task = (name, status, priority, assignedTo, dueInDays) => ({
    name,
    description: `${name} for the website launch`,
    status,
    priority,
    assignedTo,
    assignedBy: owner._id,
    project: project._id,
    dueDate: new Date(Date.now() + dueInDays * DAY),
  });
  await Task.create([
    task("Design landing page", "completed", "high", employee._id, -3),
    task("Build pricing page", "inprogress", "high", employee._id, 2),
    task("Write launch email", "pending", "medium", employee._id, -1),
    task("Review analytics setup", "pending", "low", admin._id, 6),
  ]);
  await Notification.create({
    user: employee._id,
    title: "Welcome to Manage-Mate",
    description: "You have tasks waiting in Website Launch",
    onClick: `/project/${project._id}`,
  });
  console.log(`Demo users ready: owner@demo.com / ${DEMO_PASSWORD}`);
};

module.exports = { seedDemoData, DEMO_PASSWORD };
