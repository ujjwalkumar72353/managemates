const Project = require("../models/projectModel");
const { HttpError } = require("./http");

const MANAGER_ROLES = ["owner", "admin"];

const getMember = (project, userId) =>
  project.members.find((member) => {
    const id = member.user._id || member.user;
    return id.toString() === userId.toString();
  });

// Non-members get the same 404 as a missing project, so ids can't be probed
const requireProjectMember = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  const member = project && getMember(project, userId);
  if (!member) {
    throw new HttpError(404, "Project not found");
  }
  return { project, role: member.role };
};

const requireProjectManager = async (projectId, userId) => {
  const access = await requireProjectMember(projectId, userId);
  if (!MANAGER_ROLES.includes(access.role)) {
    throw new HttpError(403, "Only owners and admins can do this");
  }
  return access;
};

const requireProjectOwner = async (projectId, userId) => {
  const access = await requireProjectMember(projectId, userId);
  if (access.role !== "owner") {
    throw new HttpError(403, "Only the project owner can do this");
  }
  return access;
};

module.exports = {
  MANAGER_ROLES,
  getMember,
  requireProjectMember,
  requireProjectManager,
  requireProjectOwner,
};
