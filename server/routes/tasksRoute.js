const fs = require("fs");
const path = require("path");
const router = require("express").Router();
const multer = require("multer");
const { z } = require("zod");
const Task = require("../models/taskModel");
const authMiddleware = require("../middlewares/authMiddleware");
const { validate, objectId } = require("../middlewares/validate");
const { HttpError, asyncHandler } = require("../utils/http");
const {
  MANAGER_ROLES,
  getMember,
  requireProjectManager,
  requireProjectMember,
} = require("../utils/access");
const { notifyUser } = require("../utils/notify");
const { emitToProject } = require("../utils/realtime");
const {
  cloudinary,
  isCloudinaryConfigured,
} = require("../config/cloudinaryConfig");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const USER_FIELDS = "firstName lastName email";
const OPEN_STATUSES = ["pending", "inprogress"];

const status = z.enum(["pending", "inprogress", "completed", "closed"]);
const priority = z.enum(["low", "medium", "high"]);
const dueDate = z.string().datetime({ offset: true }).nullable();
const name = z.string().trim().min(1).max(150);
const description = z.string().trim().min(1).max(5000);

const createSchema = z.object({
  project: objectId,
  name,
  description,
  assignedTo: objectId,
  priority: priority.optional(),
  dueDate: dueDate.optional(),
});
const listSchema = z.object({
  project: objectId,
  status: status.or(z.literal("all")).optional(),
  assignedTo: objectId.or(z.literal("all")).optional(),
  assignedBy: objectId.or(z.literal("all")).optional(),
  priority: priority.or(z.literal("all")).optional(),
});
const updateSchema = z.object({
  _id: objectId,
  name: name.optional(),
  description: description.optional(),
  status: status.optional(),
  priority: priority.optional(),
  dueDate: dueDate.optional(),
  assignedTo: objectId.optional(),
});
const idSchema = z.object({ _id: objectId });
const attachmentSchema = z.object({ _id: objectId, url: z.string().min(1) });

const populateTask = (query) =>
  query
    .populate("assignedTo", USER_FIELDS)
    .populate("assignedBy", USER_FIELDS);

const findTask = async (taskId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new HttpError(404, "Task not found");
  }
  return task;
};

const announceTaskChange = (projectId) =>
  emitToProject(projectId.toString(), "tasks:changed", { projectId });

const requireAssignableMember = (project, userId) => {
  if (!getMember(project, userId)) {
    throw new HttpError(400, "Assignee must be a member of this project");
  }
};

// create a task
router.post(
  "/create-task",
  authMiddleware,
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { project } = await requireProjectManager(
      req.body.project,
      req.userId
    );
    requireAssignableMember(project, req.body.assignedTo);
    const task = await Task.create({ ...req.body, assignedBy: req.userId });

    if (req.body.assignedTo !== req.userId) {
      await notifyUser({
        user: task.assignedTo,
        title: `New task in ${project.name}`,
        description: task.name,
        onClick: `/project/${project._id}`,
      });
    }
    announceTaskChange(project._id);
    res.status(201).send({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  })
);

// get tasks of a project
router.post(
  "/get-all-tasks",
  authMiddleware,
  validate(listSchema),
  asyncHandler(async (req, res) => {
    await requireProjectMember(req.body.project, req.userId);
    const filters = Object.fromEntries(
      Object.entries(req.body).filter(([, value]) => value !== "all")
    );
    const tasks = await populateTask(Task.find(filters)).sort({
      createdAt: -1,
    });
    res.send({
      success: true,
      message: "Tasks fetched successfully",
      data: tasks,
    });
  })
);

// get open tasks assigned to the current user across projects
router.get(
  "/my-tasks",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const tasks = await Task.find({
      assignedTo: req.userId,
      status: { $in: OPEN_STATUSES },
    })
      .populate("project", "name")
      .sort({ dueDate: 1, createdAt: -1 });
    res.send({
      success: true,
      data: tasks.filter((task) => task.project),
    });
  })
);

// update task: managers can change anything, assignees only the status
router.post(
  "/update-task",
  authMiddleware,
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const { _id, ...changes } = req.body;
    const task = await findTask(_id);
    const { project, role } = await requireProjectMember(
      task.project,
      req.userId
    );
    const isManager = MANAGER_ROLES.includes(role);
    const isAssignee = task.assignedTo.toString() === req.userId;
    const onlyStatus = Object.keys(changes).every((key) => key === "status");
    if (!isManager && !(isAssignee && onlyStatus)) {
      throw new HttpError(403, "You can only update the status of your tasks");
    }
    if (changes.assignedTo) {
      requireAssignableMember(project, changes.assignedTo);
    }

    const previousAssignee = task.assignedTo.toString();
    const statusChanged = changes.status && changes.status !== task.status;
    task.set(changes);
    await task.save();

    const onClick = `/project/${project._id}`;
    const assignee = task.assignedTo.toString();
    if (assignee !== previousAssignee && assignee !== req.userId) {
      await notifyUser({
        user: task.assignedTo,
        title: `Task assigned to you in ${project.name}`,
        description: task.name,
        onClick,
      });
    }
    if (statusChanged) {
      const recipients = new Set([task.assignedBy.toString(), assignee]);
      recipients.delete(req.userId);
      await Promise.all(
        [...recipients].map((user) =>
          notifyUser({
            user,
            title: "Task Status Updated",
            description: `${task.name} status has been updated to ${task.status}`,
            onClick,
          })
        )
      );
    }
    announceTaskChange(project._id);
    res.send({ success: true, message: "Task updated successfully" });
  })
);

// delete task
router.post(
  "/delete-task",
  authMiddleware,
  validate(idSchema),
  asyncHandler(async (req, res) => {
    const task = await findTask(req.body._id);
    await requireProjectManager(task.project, req.userId);
    await task.deleteOne();
    announceTaskChange(task.project);
    res.send({ success: true, message: "Task deleted successfully" });
  })
);

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|gif|webp)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new HttpError(400, "Only PNG, JPG, GIF and WEBP images are allowed"));
    }
  },
});

const requireTaskEditor = async (task, userId) => {
  const { role } = await requireProjectMember(task.project, userId);
  if (
    !MANAGER_ROLES.includes(role) &&
    task.assignedTo.toString() !== userId
  ) {
    throw new HttpError(403, "You cannot change attachments on this task");
  }
};

// Uses Cloudinary when configured, otherwise keeps the file in server/uploads
const storeFile = async (file) => {
  if (!isCloudinaryConfigured) {
    return `/uploads/${file.filename}`;
  }
  const result = await cloudinary.uploader.upload(file.path, {
    folder: "tasks",
  });
  await fs.promises.unlink(file.path);
  return result.secure_url;
};

router.post(
  "/upload-image",
  authMiddleware,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new HttpError(400, "Please choose an image");
    }
    try {
      const { taskId } = validateUpload(req.body);
      const task = await findTask(taskId);
      await requireTaskEditor(task, req.userId);
      const imageURL = await storeFile(req.file);
      task.attachments.push(imageURL);
      await task.save();
      announceTaskChange(task.project);
      res.send({
        success: true,
        message: "Image uploaded successfully",
        data: imageURL,
      });
    } catch (error) {
      await fs.promises.rm(req.file.path, { force: true });
      throw error;
    }
  })
);

function validateUpload(body) {
  const result = z.object({ taskId: objectId }).safeParse(body);
  if (!result.success) {
    throw new HttpError(400, "Invalid task id");
  }
  return result.data;
}

router.post(
  "/delete-attachment",
  authMiddleware,
  validate(attachmentSchema),
  asyncHandler(async (req, res) => {
    const task = await findTask(req.body._id);
    await requireTaskEditor(task, req.userId);
    if (!task.attachments.includes(req.body.url)) {
      throw new HttpError(404, "Attachment not found");
    }
    task.attachments = task.attachments.filter((url) => url !== req.body.url);
    await task.save();
    if (req.body.url.startsWith("/uploads/")) {
      const filePath = path.join(UPLOAD_DIR, path.basename(req.body.url));
      await fs.promises.rm(filePath, { force: true });
    }
    announceTaskChange(task.project);
    res.send({ success: true, message: "Attachment removed" });
  })
);

module.exports = router;
