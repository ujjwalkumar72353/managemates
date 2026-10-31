const path = require("path");
const express = require("express");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { isProduction } = require("./config/env");
const usersRoute = require("./routes/usersRoute");
const projectsRoute = require("./routes/projectsRoute");
const tasksRoute = require("./routes/tasksRoute");
const notificationsRoute = require("./routes/notificationsRoute");
const errorHandler = require("./middlewares/errorHandler");

const createApp = () => {
  const app = express();
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
          connectSrc: ["'self'", "ws:", "wss:"],
          upgradeInsecureRequests: null,
        },
      },
    })
  );
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (req, res) => res.send({ success: true }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT) || 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, message: "Too many attempts, try again later" },
  });
  app.use("/api/users/login", authLimiter);
  app.use("/api/users/register", authLimiter);

  app.use("/api/users", usersRoute);
  app.use("/api/projects", projectsRoute);
  app.use("/api/tasks", tasksRoute);
  app.use("/api/notifications", notificationsRoute);
  app.use("/api", (req, res) =>
    res.status(404).send({ success: false, message: "Route not found" })
  );

  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  if (isProduction) {
    const clientBuild = path.join(__dirname, "..", "client", "dist");
    app.use(express.static(clientBuild));
    app.get("*", (req, res) =>
      res.sendFile(path.join(clientBuild, "index.html"))
    );
  }

  app.use(errorHandler);
  return app;
};

module.exports = createApp;
