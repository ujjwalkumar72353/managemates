const router = require("express").Router();
const { z } = require("zod");
const Project = require("../models/projectModel");
const Task = require("../models/taskModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationsModel");
const authMiddleware = require("../middlewares/authMiddleware");
const { validate, objectId } = require("../middlewares/validate");
const { HttpError, asyncHandler } = require("../utils/http");
const {
  getMember,
  requireProjectMember,
  requireProjectOwner,
} = require("../utils/access");
const { notifyUser } = require("../utils/notify");
const {
  emitToProject,
  emitToUser,
  removeUserFromProjectRoom,
} = require("../utils/realtime");

const USER_FIELDS = "firstName lastName email";

const name = z.string().trim().min(1).max(100);
const description = z.string().trim().min(1).max(2000);

const createSchema = z.object({ name, description });
const idSchema = z.object({ _id: objectId });
const editSchema = z.object({
  _id: objectId,
  name,
  description,
  status: z.enum(["active", "onhold", "completed"]).optional(),
});
const addMemberSchema = z.object({
  projectId: objectId,
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["admin", "employee"]),
});
const removeMemberSchema = z.object({
  projectId: objectId,
  memberId: objectId,
});

const announceProjectChange = (projectId) =>
  emitToProject(projectId.toString(), "project:changed", { projectId });

const countTasks = async (projects) => {
  const counts = await Task.aggregate([
    { $match: { project: { $in: projects.map((p) => p._id) } } },
    {
      $group: {
        _id: "$project",
        total: { $sum: 1 },
        done: {
          $sum: { $cond: [{ $in: ["$status", ["completed", "closed"]] }, 1, 0] },
        },
      },
    },
  ]);
  const byProject = new Map(counts.map((c) => [c._id.toString(), c]));
  return projects.map((project) => {
    const count = byProject.get(project._id.toString());
    return {
      ...project.toObject(),
      taskCount: count ? count.total : 0,
      doneCount: count ? count.done : 0,
    };
  });
};

// create a project
router.post(
  "/create-project",
  authMiddleware,
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const project = await Project.create({
      ...req.body,
      owner: req.userId,
      members: [{ user: req.userId, role: "owner" }],
    });
    res.status(201).send({
      success: true,
      data: project,
      message: "Project created successfully",
    });
  })
);

// get projects owned by the current user
router.post(
  "/get-all-projects",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const projects = await Project.find({ owner: req.userId }).sort({
      createdAt: -1,
    });
    res.send({ success: true, data: projects });
  })
);

// get project by id
router.post(
  "/get-project-by-id",
  authMiddleware,
  validate(idSchema),
  asyncHandler(async (req, res) => {
    await requireProjectMember(req.body._id, req.userId);
    const project = await Project.findById(req.body._id)
      .populate("owner", USER_FIELDS)
      .populate("members.user", USER_FIELDS);
    res.send({ success: true, data: project });
  })
);

// get every project the current user belongs to
router.post(
  "/get-projects-by-role",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const projects = await Project.find({ "members.user": req.userId })
      .sort({ createdAt: -1 })
      .populate("owner", USER_FIELDS)
      .populate("members.user", USER_FIELDS);
    res.send({ success: true, data: await countTasks(projects) });
  })
);

// edit a project
router.post(
  "/edit-project",
  authMiddleware,
  validate(editSchema),
  asyncHandler(async (req, res) => {
    const { _id, ...changes } = req.body;
    const { project } = await requireProjectOwner(_id, req.userId);
    project.set(changes);
    await project.save();
    announceProjectChange(_id);
    res.send({ success: true, message: "Project updated successfully" });
  })
);

// delete a project and everything in it
router.post(
  "/delete-project",
  authMiddleware,
  validate(idSchema),
  asyncHandler(async (req, res) => {
    const { project } = await requireProjectOwner(req.body._id, req.userId);
    const onClick = `/project/${project._id}`;
    await Promise.all([
      Task.deleteMany({ project: project._id }),
      Notification.deleteMany({ onClick }),
      project.deleteOne(),
    ]);
    project.members.forEach((member) =>
      emitToUser(member.user.toString(), "project:deleted", {
        projectId: project._id,
      })
    );
    res.send({ success: true, message: "Project deleted successfully" });
  })
);

// add a member to a project
router.post(
  "/add-member",
  authMiddleware,
  validate(addMemberSchema),
  asyncHandler(async (req, res) => {
    const { email, role, projectId } = req.body;
    const { project } = await requireProjectOwner(projectId, req.userId);
    const user = await User.findOne({ email });
    if (!user) {
      throw new HttpError(404, "No registered user has this email");
    }
    if (getMember(project, user._id)) {
      throw new HttpError(409, "User is already a member of this project");
    }
    project.members.push({ user: user._id, role });
    await project.save();

    await notifyUser({
      user: user._id,
      title: "You were added to a project",
      description: `You joined ${project.name} as ${role}`,
      onClick: `/project/${project._id}`,
    });
    emitToUser(user._id.toString(), "project:added", { projectId });
    announceProjectChange(projectId);
    res.send({ success: true, message: "Member added successfully" });
  })
);

// remove a member from a project
router.post(
  "/remove-member",
  authMiddleware,
  validate(removeMemberSchema),
  asyncHandler(async (req, res) => {
    const { memberId, projectId } = req.body;
    const { project } = await requireProjectOwner(projectId, req.userId);
    const member = project.members.id(memberId);
    if (!member) {
      throw new HttpError(404, "Member not found");
    }
    if (member.role === "owner") {
      throw new HttpError(400, "The project owner cannot be removed");
    }
    const userId = member.user.toString();
    project.members.pull(memberId);
    await project.save();

    removeUserFromProjectRoom(userId, projectId);
    emitToUser(userId, "project:removed", { projectId });
    announceProjectChange(projectId);
    res.send({ success: true, message: "Member removed successfully" });
  })
);

module.exports = router;
