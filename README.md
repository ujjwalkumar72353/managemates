# Manage-Mate

A team work management app. Owners create projects, add people with roles, and assign tasks. Everyone sees changes live on a Kanban board, without refreshing.

## Features

- **Roles enforced on the server:** owner, admin and employee, checked on every API call.
- **Modern interface:** sidebar layout, light and dark themes, and Cmd+K search across projects and tasks.
- **Kanban board and list view:** drag tasks between statuses, filter by status, priority, assignee and assigner.
- **Live updates with Socket.IO:** tasks, members and notifications update for everyone in the project.
- **Dashboard:** your open tasks, overdue count, and progress on each project.
- **Tasks:** priority, due date and image attachments.
- **Account:** edit your profile and change your password.

## Permissions

| Action | Owner | Admin | Employee |
| --- | --- | --- | --- |
| View project and tasks | Yes | Yes | Yes |
| Edit or delete project, manage members | Yes | No | No |
| Create, edit or delete tasks | Yes | Yes | No |
| Change task status | Yes | Yes | Own tasks only |
| Add or remove attachments | Yes | Yes | Own tasks only |

## Tech stack

React 18, Vite, Redux Toolkit, Ant Design, Tailwind CSS, Node.js, Express, MongoDB, Mongoose, Socket.IO, JWT, Zod, Helmet, Playwright.

## Run locally

You need Node.js 20 or newer. MongoDB and Cloudinary are optional for local development.

```bash
npm run setup
npm run dev
```

Open http://localhost:3000 and pick a demo account on the login page: Owner, Admin or Employee.

Open two browsers with different accounts to see live updates.

Local data is stored in `.data/`, and uploads in `server/uploads/`. To use your own services, copy `.env.example` to `.env` and fill it in.

## Tests

```bash
npm test            # 20 API, permission and realtime tests
npm run build       # needed once before the browser test
npm run test:e2e    # 25 step, multi-user flow in Chrome
```

## Deploy

Set `mongo_url` and `jwt_secret` in the environment. Add the Cloudinary variables too, because most hosts wipe local files on each deploy.

```bash
npm install --omit=dev
npm run build
npm start
```

The server hosts the built client on one port. Run a single instance, since Socket.IO rooms are kept in memory.
