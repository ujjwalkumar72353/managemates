const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Project = require("../models/projectModel");
const { getMember } = require("./access");

let io = null;

const userRoom = (userId) => `user:${userId}`;
const projectRoom = (projectId) => `project:${projectId}`;

const initRealtime = (httpServer) => {
  io = new Server(httpServer);

  io.use((socket, next) => {
    try {
      const { userId } = jwt.verify(
        socket.handshake.auth.token,
        process.env.jwt_secret
      );
      socket.data.userId = userId;
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(userRoom(socket.data.userId));

    socket.on("project:join", async (projectId, ack) => {
      try {
        const project = await Project.findById(projectId);
        const allowed = project && getMember(project, socket.data.userId);
        if (allowed) {
          socket.join(projectRoom(projectId));
        }
        if (ack) ack({ success: Boolean(allowed) });
      } catch (error) {
        if (ack) ack({ success: false });
      }
    });

    socket.on("project:leave", (projectId) => {
      socket.leave(projectRoom(projectId));
    });
  });

  return io;
};

const emitToUser = (userId, event, payload) => {
  if (io) io.to(userRoom(userId)).emit(event, payload);
};

const emitToProject = (projectId, event, payload) => {
  if (io) io.to(projectRoom(projectId)).emit(event, payload);
};

const removeUserFromProjectRoom = (userId, projectId) => {
  if (io) io.in(userRoom(userId)).socketsLeave(projectRoom(projectId));
};

const closeRealtime = async () => {
  if (io) await io.close();
  io = null;
};

module.exports = {
  initRealtime,
  closeRealtime,
  emitToUser,
  emitToProject,
  removeUserFromProjectRoom,
};
