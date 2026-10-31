const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const request = require("supertest");
const mongoose = require("mongoose");
const { io: connectSocket } = require("socket.io-client");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.jwt_secret = "test-secret";
process.env.AUTH_RATE_LIMIT = "10000";

const createApp = require("../app");
const { initRealtime, closeRealtime } = require("../utils/realtime");

let mongo, app, httpServer, port, owner, admin, employee, stranger, projectId;

const api = (token) => ({
  post: (url, body) =>
    request(app)
      .post(url)
      .set("Authorization", `Bearer ${token}`)
      .send(body),
  get: (url) =>
    request(app).get(url).set("Authorization", `Bearer ${token}`),
});

const register = async (name) => {
  const email = `${name}@test.com`;
  const password = "password123";
  await request(app)
    .post("/api/users/register")
    .send({ firstName: name, lastName: "T", email, password })
    .expect(201);
  const login = await request(app)
    .post("/api/users/login")
    .send({ email, password })
    .expect(200);
  const client = api(login.body.data);
  const me = await client.get("/api/users/get-logged-in-user").expect(200);
  return { client, token: login.body.data, id: me.body.data._id, email };
};

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();
  httpServer = http.createServer(app);
  initRealtime(httpServer);
  await new Promise((resolve) => httpServer.listen(0, resolve));
  port = httpServer.address().port;
});

after(async () => {
  await closeRealtime();
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.model("users").syncIndexes();
  owner = await register("owner");
  admin = await register("admin");
  employee = await register("employee");
  stranger = await register("stranger");
  const project = await owner.client
    .post("/api/projects/create-project", { name: "P", description: "D" })
    .expect(201);
  projectId = project.body.data._id;
  await owner.client
    .post("/api/projects/add-member", {
      projectId,
      email: admin.email,
      role: "admin",
    })
    .expect(200);
  await owner.client
    .post("/api/projects/add-member", {
      projectId,
      email: employee.email,
      role: "employee",
    })
    .expect(200);
});

const createTask = (client = owner.client, overrides = {}) =>
  client.post("/api/tasks/create-task", {
    project: projectId,
    name: "T",
    description: "D",
    assignedTo: employee.id,
    ...overrides,
  });

test("auth: rejects bad input, wrong password and missing token", async () => {
  await request(app)
    .post("/api/users/register")
    .send({ firstName: "A", lastName: "B", email: "bad", password: "x" })
    .expect(400);
  await request(app)
    .post("/api/users/login")
    .send({ email: owner.email, password: "wrong" })
    .expect(401);
  await request(app)
    .post("/api/users/login")
    .send({ email: { $gt: "" }, password: { $gt: "" } })
    .expect(400);
  await request(app).get("/api/users/get-logged-in-user").expect(401);
});

test("auth: duplicate email is rejected, case-insensitively", async () => {
  await request(app)
    .post("/api/users/register")
    .send({
      firstName: "A",
      lastName: "B",
      email: "OWNER@test.com",
      password: "password123",
    })
    .expect(409);
});

test("profile: name and password can be changed", async () => {
  await owner.client
    .post("/api/users/update-profile", { firstName: "New", lastName: "Name" })
    .expect(200);
  await owner.client
    .post("/api/users/change-password", {
      currentPassword: "nope",
      newPassword: "newpassword1",
    })
    .expect(400);
  await owner.client
    .post("/api/users/change-password", {
      currentPassword: "password123",
      newPassword: "newpassword1",
    })
    .expect(200);
  await request(app)
    .post("/api/users/login")
    .send({ email: owner.email, password: "newpassword1" })
    .expect(200);
});

test("projects: non-members can't read, edit or delete", async () => {
  const id = { _id: projectId };
  await stranger.client.post("/api/projects/get-project-by-id", id).expect(404);
  await stranger.client
    .post("/api/projects/edit-project", { ...id, name: "x", description: "y" })
    .expect(404);
  await stranger.client.post("/api/projects/delete-project", id).expect(404);
  await stranger.client
    .post("/api/tasks/get-all-tasks", { project: projectId })
    .expect(404);
});

test("projects: only the owner can edit, delete or manage members", async () => {
  await admin.client
    .post("/api/projects/edit-project", {
      _id: projectId,
      name: "x",
      description: "y",
    })
    .expect(403);
  await admin.client
    .post("/api/projects/delete-project", { _id: projectId })
    .expect(403);
  await employee.client
    .post("/api/projects/add-member", {
      projectId,
      email: stranger.email,
      role: "admin",
    })
    .expect(403);
});

test("projects: responses never contain password hashes", async () => {
  const res = await owner.client
    .post("/api/projects/get-project-by-id", { _id: projectId })
    .expect(200);
  assert.equal(JSON.stringify(res.body).includes("password"), false);
  await createTask().expect(201);
  const tasks = await owner.client
    .post("/api/tasks/get-all-tasks", { project: projectId })
    .expect(200);
  assert.equal(JSON.stringify(tasks.body).includes("password"), false);
});

test("members: duplicates and owner removal are blocked", async () => {
  await owner.client
    .post("/api/projects/add-member", {
      projectId,
      email: employee.email,
      role: "admin",
    })
    .expect(409);
  const project = await owner.client
    .post("/api/projects/get-project-by-id", { _id: projectId })
    .expect(200);
  const ownerMember = project.body.data.members.find(
    (m) => m.role === "owner"
  );
  await owner.client
    .post("/api/projects/remove-member", {
      projectId,
      memberId: ownerMember._id,
    })
    .expect(400);
});

test("members: a removed member loses access", async () => {
  const project = await owner.client
    .post("/api/projects/get-project-by-id", { _id: projectId })
    .expect(200);
  const member = project.body.data.members.find(
    (m) => m.user._id === employee.id
  );
  await owner.client
    .post("/api/projects/remove-member", { projectId, memberId: member._id })
    .expect(200);
  await employee.client
    .post("/api/projects/get-project-by-id", { _id: projectId })
    .expect(404);
});

test("tasks: employees can't create, edit or delete", async () => {
  await createTask(employee.client).expect(403);
  const task = await createTask().expect(201);
  const _id = task.body.data._id;
  await employee.client
    .post("/api/tasks/update-task", { _id, name: "x" })
    .expect(403);
  await employee.client.post("/api/tasks/delete-task", { _id }).expect(403);
});

test("tasks: assignee can change status, other employees can't", async () => {
  const other = await register("other");
  await owner.client
    .post("/api/projects/add-member", {
      projectId,
      email: other.email,
      role: "employee",
    })
    .expect(200);
  const task = await createTask().expect(201);
  const _id = task.body.data._id;
  await other.client
    .post("/api/tasks/update-task", { _id, status: "completed" })
    .expect(403);
  await employee.client
    .post("/api/tasks/update-task", { _id, status: "completed" })
    .expect(200);
});

test("tasks: assignee must belong to the project", async () => {
  await createTask(owner.client, { assignedTo: stranger.id }).expect(400);
});

test("tasks: status filter and all work", async () => {
  const task = await createTask().expect(201);
  await createTask().expect(201);
  await owner.client
    .post("/api/tasks/update-task", {
      _id: task.body.data._id,
      status: "completed",
    })
    .expect(200);
  const all = await owner.client
    .post("/api/tasks/get-all-tasks", { project: projectId, status: "all" })
    .expect(200);
  assert.equal(all.body.data.length, 2);
  const done = await owner.client
    .post("/api/tasks/get-all-tasks", {
      project: projectId,
      status: "completed",
    })
    .expect(200);
  assert.equal(done.body.data.length, 1);
});

test("tasks: filter can't be used for query injection", async () => {
  await owner.client
    .post("/api/tasks/get-all-tasks", {
      project: projectId,
      assignedTo: { $ne: null },
    })
    .expect(400);
});

test("tasks: my-tasks returns only open tasks of the current user", async () => {
  const task = await createTask().expect(201);
  await createTask().expect(201);
  await createTask(owner.client, { assignedTo: admin.id }).expect(201);
  await employee.client
    .post("/api/tasks/update-task", {
      _id: task.body.data._id,
      status: "completed",
    })
    .expect(200);
  const mine = await employee.client.get("/api/tasks/my-tasks").expect(200);
  assert.equal(mine.body.data.length, 1);
  assert.equal(mine.body.data[0].project.name, "P");
});

test("attachments: upload, type check and delete", async () => {
  const task = await createTask().expect(201);
  const _id = task.body.data._id;
  const pixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64"
  );
  const uploaded = await request(app)
    .post("/api/tasks/upload-image")
    .set("Authorization", `Bearer ${employee.token}`)
    .field("taskId", _id)
    .attach("file", pixel, { filename: "a.png", contentType: "image/png" })
    .expect(200);
  const url = uploaded.body.data;
  await request(app).get(url).expect(200);

  await request(app)
    .post("/api/tasks/upload-image")
    .set("Authorization", `Bearer ${employee.token}`)
    .field("taskId", _id)
    .attach("file", Buffer.from("<script>"), {
      filename: "a.html",
      contentType: "text/html",
    })
    .expect(400);

  await request(app)
    .post("/api/tasks/upload-image")
    .set("Authorization", `Bearer ${stranger.token}`)
    .field("taskId", _id)
    .attach("file", pixel, { filename: "b.png", contentType: "image/png" })
    .expect(404);

  await employee.client
    .post("/api/tasks/delete-attachment", { _id, url })
    .expect(200);
  await request(app).get(url).expect(404);
});

test("project delete also removes its tasks and notifications", async () => {
  await createTask().expect(201);
  await owner.client
    .post("/api/projects/delete-project", { _id: projectId })
    .expect(200);
  const mine = await employee.client.get("/api/tasks/my-tasks").expect(200);
  assert.equal(mine.body.data.length, 0);
  const notifications = await employee.client
    .get("/api/notifications/get-all-notifications")
    .expect(200);
  assert.equal(notifications.body.data.length, 0);
});

test("notifications: users only see their own and can mark them read", async () => {
  await createTask().expect(201);
  const own = await employee.client
    .get("/api/notifications/get-all-notifications")
    .expect(200);
  assert.ok(own.body.data.some((n) => n.title.startsWith("New task")));
  const others = await stranger.client
    .get("/api/notifications/get-all-notifications")
    .expect(200);
  assert.equal(others.body.data.length, 0);
  const read = await employee.client
    .post("/api/notifications/mark-as-read")
    .expect(200);
  assert.ok(read.body.data.every((n) => n.read));
});

const openSocket = (token) =>
  new Promise((resolve, reject) => {
    const socket = connectSocket(`http://localhost:${port}`, {
      auth: { token },
      transports: ["websocket"],
    });
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", reject);
  });

const nextEvent = (socket, event) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`No ${event}`)), 2000);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });

test("realtime: bad tokens are refused", async () => {
  await assert.rejects(openSocket("bad-token"), /Unauthorized/);
});

test("realtime: assignee gets a live notification and task change", async () => {
  const socket = await openSocket(employee.token);
  try {
    const joined = await socket.emitWithAck("project:join", projectId);
    assert.equal(joined.success, true);
    const notification = nextEvent(socket, "notification:new");
    const changed = nextEvent(socket, "tasks:changed");
    await createTask().expect(201);
    assert.match((await notification).title, /New task/);
    assert.equal((await changed).projectId, projectId);
  } finally {
    socket.close();
  }
});

test("realtime: non-members can't join a project room", async () => {
  const socket = await openSocket(stranger.token);
  try {
    const joined = await socket.emitWithAck("project:join", projectId);
    assert.equal(joined.success, false);
  } finally {
    socket.close();
  }
});
