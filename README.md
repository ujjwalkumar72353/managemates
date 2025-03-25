# 🚀 ManageMate

ManageMate is a comprehensive work management platform designed to enhance collaboration, task tracking, and project management across teams. Built on the MERN stack (MongoDB, Express.js, React, Node.js), this application provides tailored user interfaces for different roles, ensuring efficient access control and task management.

## ✨ Features

- **🔐 Role-Based Access Control**:
  - **👑 Owners**: Full system access, including user deletion and project creation
  - **🛡️ Admins**: Task assignment and progress monitoring capabilities
  - **👤 Employees**: View and update status of assigned tasks

- **📋 Task Management Workflow**:
  - Track tasks through multiple stages: **⏳ Pending**, **🔄 In Progress**, **✅ Completed**, and **🔒 Closed**
  - Real-time monitoring of project progress
  - Detailed task descriptions and priority settings

- **🔔 Real-Time Notifications**:
  - Instant alerts when task statuses change
  - Ensures all team members stay updated on project developments

- **👥 Team Collaboration**:
  - Centralized platform for team communication
  - Shared project visibility based on roles
  - Task comment and feedback system

- **📊 Dashboard Analytics**:
  - Visual representation of project progress
  - Task completion metrics
  - Team performance insights

## 🛠️ Tech Stack

- **🖥️ Frontend**: React.js with Redux Toolkit for state management
- **⚙️ Backend**: Node.js, Express.js
- **🗄️ Database**: MongoDB
- **🔑 Authentication**: JWT (JSON Web Tokens)
- **⚡ Real-time Updates**: Socket.io (WebSockets)

## 💡 Why MongoDB?

We chose MongoDB instead of SQL because in real-world applications like ManageMate, project and task data can change frequently and unpredictably. For instance, tasks may have dynamic statuses, new attributes, or roles that evolve over time. MongoDB's flexible, schema-less design allows us to easily store and update this unstructured data without needing to alter the entire database schema. Additionally, MongoDB is better suited for handling large volumes of data with fast read and write operations, making it more efficient for scalable applications where performance and flexibility are critical.

## 🧩 Challenges Faced & Solutions

### 1. 🔐 Role-Based Access Control (RBAC) Implementation
- **Challenge**: Managing role-based access efficiently while supporting multiple roles (admin, manager, employee)
- **Solution**: Implemented JWT-based authentication with role-based middleware in Node.js
- **Impact**: Improved security and optimized performance by reducing redundant role checks

### 2. 🔔 Real-Time Task Updates & Notifications
- **Challenge**: Traditional API polling increased server load and provided delayed updates
- **Solution**: Integrated WebSockets (Socket.io) to push real-time notifications to users
- **Impact**: Delivered instant updates, improving user experience and reducing server load

### 3. 🛡️ Ensuring Application Security
- **Challenge**: Preventing unauthorized access and CSRF attacks
- **Solution**: Implemented JWT authentication, input validation (express-validator), and CORS policies
- **Impact**: Enhanced security against vulnerabilities like SQL injection and cross-site scripting

### 4. ⚙️ UI Performance & State Management
- **Challenge**: Unoptimized state management led to unnecessary re-renders, slowing down the UI
- **Solution**: Used Redux Toolkit for global state management and memoization to optimize re-renders
- **Impact**: Improved UI responsiveness and reduced API load

## 🔮 Future Features

### 1. 📈 Advanced Reporting and Analytics
Integration of detailed reports and visual analytics about task progress, team performance, and project timelines using Chart.js with MongoDB's aggregation framework to process and visualize data in real time.

### 2. 🔗 Task Dependencies
Implementation of task dependencies allowing users to set preconditions for tasks (e.g., Task B can't start until Task A is completed) by adding dependency tracking to the task schema and leveraging MongoDB's flexible document structure.

### 3. ⏱️ Time Tracking and Invoicing
Addition of time-tracking capabilities for employees to log hours spent on tasks, with an integrated invoicing system to calculate billable hours based on logged data.

### 4. 🤖 AI-Based Task Assignment
Integration of AI to suggest optimal task assignments based on employee performance, task complexity, and skill sets, powered by machine learning models and historical task data stored in MongoDB.

### 5. 🔌 Integration with External Tools
Connection with popular platforms like Slack for notifications and Google Calendar for scheduling through secure OAuth authentication and API integration.

## 📥 Installation

1. Clone the repository:
   ```
   git clone https://github.com/ujjwalkumar72353/managemates.git
   ```

2. Install dependencies for backend:
   ```
   cd managemates/server
   npm install
   ```

3. Install dependencies for frontend:
   ```
   cd ../client
   npm install
   ```

4. Configure environment variables:
   - Create `.env` file in the server directory
   - Add MongoDB connection string, JWT secret, and other required variables

5. Start the development servers:
   - Backend: `npm run dev` in the server directory
   - Frontend: `npm start` in the client directory

## 🚦 Usage

1. Register as an owner to create a new workspace
2. Add team members as admins or employees
3. Create projects and assign tasks to team members
4. Monitor progress through the intuitive dashboard
5. Receive real-time notifications on task updates

## 📁 Project Structure

```
managemates/
├── client/               # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # Context providers
│   │   ├── pages/        # Page components
│   │   ├── utils/        # Utility functions
│   │   └── App.js        # Main application
├── server/               # Node.js backend
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   └── server.js         # Server entry point
└── README.md             # Project documentation
```

## 🌟 What Makes ManageMate Unique?

- **🔄 Flexible Role-Based Access**: Custom permissions for owners, admins, and employees
- **🔄 Comprehensive Task Lifecycle**: Full visibility into task progression
- **⚡ Real-Time Collaboration**: Instant updates and notifications
- **📈 Scalable Architecture**: Designed to grow with your team
- **🛠️ Customizable Workflows**: Adaptable to different team structures and processes
- **🔮 Future-Proof Design**: Built for easy integration of new features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📬 Contact

Project Link: [https://github.com/ujjwalkumar72353/managemates](https://github.com/ujjwalkumar72353/managemates)
