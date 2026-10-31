// End-to-end check of the production build in real Chrome, with two users side by side.
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright");
const { MongoMemoryServer } = require("mongodb-memory-server");

const PORT = 5199;
const BASE = `http://localhost:${PORT}`;
const PASSWORD = "password123";
const SHOTS = process.env.E2E_SHOTS || path.join(__dirname, "..", "test-results");
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

const steps = [];
const step = async (name, fn) => {
  await fn();
  steps.push(name);
  console.log(`  ok  ${name}`);
};

const waitForServer = async () => {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`${BASE}/api/health`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Server did not start");
};

const newUser = async (browser, errors, label) => {
  const context = await browser.newContext({ viewport: { width: 1360, height: 850 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(`${label}: ${error.message}`));
  page.on("console", (entry) => {
    const expected = /status of 40[0-9]/.test(entry.text());
    if (entry.type() === "error" && !expected) {
      errors.push(`${label}: ${entry.text()}`);
    }
  });
  return page;
};

const register = async (page, firstName, email) => {
  await page.goto(`${BASE}/register`);
  await page.getByLabel("First Name").fill(firstName);
  await page.getByLabel("Last Name").fill("Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Register" }).click();
  await page.waitForURL("**/login");
};

const login = async (page, email, password = PASSWORD) => {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();
};

const pickOption = async (page, field, option) => {
  await page
    .locator(".ant-select")
    .filter({ has: page.getByLabel(field, { exact: true }) })
    .last()
    .click();
  await page.waitForTimeout(350);
  await page
    .locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option")
    .filter({ hasText: option })
    .first()
    .click();
};

const column = (page, name) => page.locator(`[data-column="${name}"]`);
const card = (page, name) => page.locator(`[data-task="${name}"]`);

const run = async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const uploads = path.join(__dirname, "..", "server", "uploads");
  const before = new Set(fs.existsSync(uploads) ? fs.readdirSync(uploads) : []);
  const mongo = await MongoMemoryServer.create();
  const server = spawn("node", ["server/server.js"], {
    cwd: path.join(__dirname, ".."),
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT,
      mongo_url: mongo.getUri("e2e"),
      jwt_secret: "e2e-secret",
      AUTH_RATE_LIMIT: "1000",
    },
    stdio: ["ignore", "ignore", "inherit"],
  });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const errors = [];

  try {
    await waitForServer();
    const owner = await newUser(browser, errors, "owner");
    const employee = await newUser(browser, errors, "employee");
    const stranger = await newUser(browser, errors, "stranger");
    const ownerMail = "arjun@e2e.com";
    const employeeMail = "karan@e2e.com";
    let projectUrl;

    await step("short passwords are stopped on the form", async () => {
      await owner.goto(`${BASE}/register`);
      await owner.getByLabel("Password").fill("short");
      await owner.getByRole("button", { name: "Register" }).click();
      await owner.getByText("Use at least 8 characters").waitFor();
    });

    await step("three users register and log in", async () => {
      await register(owner, "Arjun", ownerMail);
      await login(owner, ownerMail);
      await owner.getByText("Hey Arjun").waitFor();
      await register(employee, "Karan", employeeMail);
      await login(employee, employeeMail);
      await employee.getByText("Hey Karan").waitFor();
      await register(stranger, "Sam", "sam@e2e.com");
      await login(stranger, "sam@e2e.com");
      await stranger.getByText("Hey Sam").waitFor();
    });

    await step("wrong password shows an error", async () => {
      const page = await newUser(browser, errors, "guest");
      await page.goto(`${BASE}/login`);
      await login(page, ownerMail, "wrong-password");
      await page.getByText("Invalid email or password").waitFor();
      await page.context().close();
    });

    await step("owner creates a project", async () => {
      await owner.getByRole("button", { name: "Manage Projects" }).click();
      await owner.getByRole("button", { name: "Add Project" }).click();
      await owner.getByLabel("Project Name").fill("Launch");
      await owner.getByLabel("Project Description").fill("Ship the site");
      await owner.getByRole("button", { name: "Save" }).click();
      await owner.getByRole("button", { name: "Launch" }).click();
      await owner.waitForURL("**/project/*");
      projectUrl = owner.url();
    });

    await step("add member opens and works (crashed before)", async () => {
      await owner.getByRole("tab", { name: /Members/ }).click();
      await owner.getByRole("button", { name: "Add Member" }).click();
      await owner.getByLabel("Email").fill(employeeMail);
      await owner.getByRole("button", { name: "Add", exact: true }).click();
      await owner.getByRole("cell", { name: employeeMail }).waitFor();
    });

    await step("new member sees the project live, no reload", async () => {
      await employee.getByRole("heading", { name: "Launch" }).waitFor();
      await employee.getByText("You were added to a project").first().waitFor();
    });

    await step("owner creates a task with priority and due date", async () => {
      await owner.getByRole("tab", { name: "Tasks" }).click();
      await owner.getByRole("button", { name: "Add Task" }).click();
      await owner.getByLabel("Task Name").fill("Write copy");
      await owner.getByLabel("Task Description").fill("Homepage text");
      await pickOption(owner, "Assign To", "Karan Tester");
      await pickOption(owner, "Priority", "High");
      await owner.getByLabel("Due Date").fill("15 Nov 2030");
      await owner.getByLabel("Due Date").press("Enter");
      await owner.getByRole("button", { name: "Create" }).click();
      await card(owner, "Write copy").getByText("15 Nov 2030").waitFor();
      await card(owner, "Write copy").getByText("high").waitFor();
      assert.equal(await column(owner, "pending").locator("article").count(), 1);
    });

    await step("assignee gets notification and task live", async () => {
      await employee.getByText("New task in Launch").first().waitFor();
      await employee.getByText("Write copy").first().waitFor();
    });

    await step("notification modal does not loop requests", async () => {
      let calls = 0;
      const count = (request) => {
        if (request.url().includes("mark-as-read")) calls += 1;
      };
      employee.on("request", count);
      await employee.getByRole("button", { name: "Notifications" }).click();
      await employee.getByRole("dialog").getByText("New task in Launch").waitFor();
      await employee.waitForTimeout(1500);
      employee.off("request", count);
      assert.equal(calls, 1);
      await employee.getByRole("dialog").getByText("New task in Launch").click();
      await employee.waitForURL("**/project/*");
    });

    await step("employee cannot add tasks", async () => {
      await card(employee, "Write copy").waitFor();
      assert.equal(await employee.getByRole("button", { name: "Add Task" }).count(), 0);
    });

    await step("drag to In Progress updates the other user live", async () => {
      await card(employee, "Write copy").dragTo(column(employee, "inprogress"));
      await column(employee, "inprogress").getByText("Write copy").waitFor();
      await column(owner, "inprogress").getByText("Write copy").waitFor();
      await owner.getByText("Task Status Updated").first().waitFor();
    });

    await step("editing a task works (crashed before)", async () => {
      await owner.getByText("List", { exact: true }).click();
      await owner.getByRole("button", { name: "Edit" }).click();
      await owner.getByLabel("Task Name").fill("Write final copy");
      await owner.getByRole("button", { name: "Update" }).click();
      await owner.getByRole("button", { name: "Write final copy" }).waitFor();
      await card(employee, "Write final copy").waitFor();
    });

    await step("add task after edit starts empty (kept old task before)", async () => {
      await owner.getByRole("button", { name: "Add Task" }).click();
      assert.equal(await owner.getByLabel("Task Name").inputValue(), "");
      await owner.getByRole("button", { name: "Cancel" }).click();
    });

    await step("attachment uploads and displays without Cloudinary", async () => {
      await owner.getByRole("button", { name: "Edit" }).click();
      await owner.getByRole("tab", { name: "Attachments" }).click();
      const file = path.join(os.tmpdir(), "managemate-e2e.png");
      fs.writeFileSync(file, PIXEL);
      await owner.locator('input[type="file"]').setInputFiles(file);
      await owner.getByRole("button", { name: "Upload", exact: true }).click();
      const image = owner.getByRole("dialog").getByAltText("Task attachment");
      await image.waitFor();
      await owner.waitForFunction(
        () => document.querySelector('img[alt="Task attachment"]')?.naturalWidth > 0
      );
      fs.rmSync(file);
      await owner.getByRole("button", { name: "Close" }).click();
    });

    await step("filters work", async () => {
      await pickOption(owner, "Filter by status", "Completed");
      await owner.locator(".ant-empty-description").waitFor();
      await pickOption(owner, "Filter by status", "All statuses");
      await owner.getByRole("button", { name: "Write final copy" }).waitFor();
    });

    await step("Cmd+K search finds a task and opens its project", async () => {
      await employee.goto(BASE);
      await employee.getByText("Hey Karan").waitFor();
      await employee.keyboard.press("ControlOrMeta+k");
      const search = employee.getByLabel("Search projects and tasks");
      await search.waitFor();
      await search.fill("final copy");
      await employee.getByRole("button", { name: "Write final copy Launch", exact: true }).waitFor();
      await search.press("Enter");
      await employee.waitForURL("**/project/*");
    });

    await step("status can be changed without dragging", async () => {
      await card(employee, "Write final copy").click();
      await pickOption(employee, "Task status", "Completed");
      await employee.locator('[data-column="completed"] [data-task="Write final copy"]').waitFor();
      await employee.getByRole("button", { name: "Close" }).click();
    });

    await step("light and dark themes switch and persist", async () => {
      const dark = () => stranger.evaluate(() => document.documentElement.dataset.theme);
      assert.equal(await dark(), "dark");
      await stranger.getByRole("button", { name: "Switch to light mode" }).click();
      assert.equal(await dark(), "light");
      await stranger.reload();
      await stranger.getByText("Hey Sam").waitFor();
      assert.equal(await dark(), "light");
      await stranger.screenshot({ path: path.join(SHOTS, "light-empty.png") });
    });

    await step("a stranger with the link is sent away", async () => {
      await stranger.goto(projectUrl);
      await stranger.getByText("Project not found").waitFor();
      await stranger.getByText("Hey Sam").waitFor();
    });

    await step("dashboard screenshot and progress", async () => {
      await owner.screenshot({ path: path.join(SHOTS, "list.png") });
      await owner.getByText("Board", { exact: true }).click();
      await owner.waitForTimeout(300);
      await owner.screenshot({ path: path.join(SHOTS, "board.png") });
    });

    await step("removed member is pushed out live", async () => {
      await owner.getByRole("tab", { name: /Members/ }).click();
      await owner.getByRole("button", { name: "Remove" }).click();
      await owner.locator(".ant-popconfirm").getByRole("button", { name: "Remove" }).click();
      await employee.getByText("You no longer have access").first().waitFor();
      await employee.getByText("Hey Karan").waitFor();
      await employee.screenshot({ path: path.join(SHOTS, "home.png") });
    });

    await step("profile and password can be changed", async () => {
      await owner.getByRole("button", { name: "Profile" }).click();
      await owner.getByRole("tab", { name: "General" }).click();
      await owner.getByLabel("First Name").fill("Arjun2");
      await owner.getByRole("button", { name: "Save Profile" }).click();
      await owner.getByRole("button", { name: "Profile" }).getByText("Arjun2").waitFor();
      await owner.getByLabel("Current Password").fill(PASSWORD);
      await owner.getByLabel("New Password").fill("newpassword1");
      await owner.getByRole("button", { name: "Change Password" }).click();
      await owner.getByText("Password changed successfully").waitFor();
    });

    await step("logout, then login with the new password", async () => {
      await owner.getByRole("button", { name: "Log out" }).click();
      await owner.waitForURL("**/login");
      await login(owner, ownerMail, "newpassword1");
      await owner.getByText("Hey Arjun2").waitFor();
    });

    await step("deleting a project works and clears it", async () => {
      await owner.getByRole("button", { name: "Manage Projects" }).click();
      await owner.getByRole("button", { name: "Delete" }).click();
      await owner.locator(".ant-popconfirm").getByRole("button", { name: "Delete" }).click();
      await owner.getByText("Project deleted successfully").waitFor();
    });

    await step("mobile layout has no sideways scroll", async () => {
      await owner.setViewportSize({ width: 390, height: 800 });
      await owner.goto(BASE);
      await owner.getByText("Hey Arjun2").waitFor();
      const overflow = await owner.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      );
      assert.ok(overflow <= 0, `overflow ${overflow}px`);
    });

    assert.deepEqual(errors, [], "browser console must stay clean");
    console.log(`\n${steps.length} steps passed, no browser errors`);
  } finally {
    await browser.close();
    server.kill();
    await mongo.stop();
    if (fs.existsSync(uploads)) {
      fs.readdirSync(uploads)
        .filter((file) => !before.has(file))
        .forEach((file) => fs.rmSync(path.join(uploads, file)));
    }
  }
};

run().catch((error) => {
  console.error(`\nFAILED after: ${steps.at(-1) || "start"}\n`, error.message);
  process.exit(1);
});
