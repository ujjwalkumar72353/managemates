import {
  App,
  Button,
  Image,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Table,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { DeleteTask, GetAllTasks, UpdateTask } from "../../../apicalls/tasks";
import {
  getDateFormat,
  isOverdue,
  memberName,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "../../../utils/helpers";
import { getSocket } from "../../../utils/socket";
import { PriorityBadge, UserAvatar } from "../../../components/ui";
import TaskBoard from "./TaskBoard";
import TaskForm from "./TaskForm";

const withAll = (label, options) => [{ value: "all", label }, ...options];

function Tasks({ project, role }) {
  const [filters, setFilters] = useState({
    status: "all",
    assignedTo: "all",
    assignedBy: "all",
    priority: "all",
  });
  const [view, setView] = useState("Board");
  const [tasks, setTasks] = useState([]);
  const [viewTaskId, setViewTaskId] = useState(null);
  const [formTaskId, setFormTaskId] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const { user } = useSelector((state) => state.users);
  const { message } = App.useApp();
  const isManager = role === "owner" || role === "admin";

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const getTasks = async () => {
    const response = await GetAllTasks({
      project: project._id,
      ...filtersRef.current,
    });
    if (response.success) {
      setTasks(response.data);
    } else {
      message.error(response.message);
    }
  };

  useEffect(() => {
    getTasks();
  }, [filters]);

  useEffect(() => {
    const socket = getSocket();
    socket.on("tasks:changed", getTasks);
    return () => socket.off("tasks:changed", getTasks);
  }, []);

  const canChangeStatus = (task) =>
    isManager || task.assignedTo._id === user._id;

  const onStatusUpdate = async (task, status) => {
    if (task.status === status) return;
    setTasks((current) =>
      current.map((item) =>
        item._id === task._id ? { ...item, status } : item
      )
    );
    const response = await UpdateTask({ _id: task._id, status });
    if (!response.success) {
      message.error(response.message);
    }
    getTasks();
  };

  const onDelete = async (id) => {
    const response = await DeleteTask(id);
    if (response.success) {
      message.success(response.message);
      getTasks();
    } else {
      message.error(response.message);
    }
  };

  const openForm = (task) => {
    setFormTaskId(task ? task._id : null);
    setShowTaskForm(true);
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (text, record) => (
        <button
          type="button"
          className="bg-transparent border-0 p-0 underline cursor-pointer text-left"
          onClick={() => setViewTaskId(record._id)}
        >
          {text}
        </button>
      ),
    },
    {
      title: "Assigned To",
      dataIndex: "assignedTo",
      render: (user) => (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <UserAvatar user={user} size={24} />
          {memberName(user)}
        </span>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      render: (text) => <PriorityBadge priority={text} />,
    },
    {
      title: "Due",
      dataIndex: "dueDate",
      render: (text, record) =>
        text ? (
          <span className={isOverdue(record) ? "text-red-500" : ""}>
            {getDateFormat(text)}
          </span>
        ) : (
          "-"
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text, record) => (
        <Select
          aria-label={`Status of ${record.name}`}
          className="w-36"
          value={text}
          options={TASK_STATUSES}
          onChange={(status) => onStatusUpdate(record, status)}
          disabled={!canChangeStatus(record)}
        />
      ),
    },
  ];

  if (isManager) {
    columns.push({
      title: "Action",
      key: "action",
      render: (text, record) => (
        <div className="flex gap-2">
          <Button onClick={() => openForm(record)}>Edit</Button>
          <Popconfirm
            title="Delete this task?"
            okText="Delete"
            onConfirm={() => onDelete(record._id)}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </div>
      ),
    });
  }

  const memberOptions = project.members.map((member) => ({
    value: member.user._id,
    label: memberName(member.user),
  }));
  const managerOptions = project.members
    .filter((member) => member.role !== "employee")
    .map((member) => ({
      value: member.user._id,
      label: memberName(member.user),
    }));

  const setFilter = (key) => (value) =>
    setFilters({ ...filters, [key]: value });

  const viewTask = tasks.find((item) => item._id === viewTaskId);
  const formTask = tasks.find((item) => item._id === formTaskId) || null;

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
        <div className="flex flex-wrap gap-3">
          <Segmented
            options={["Board", "List"]}
            value={view}
            onChange={setView}
          />
          <Select
            aria-label="Filter by status"
            className="w-40"
            value={filters.status}
            onChange={setFilter("status")}
            options={withAll("All statuses", TASK_STATUSES)}
          />
          <Select
            aria-label="Filter by priority"
            className="w-40"
            value={filters.priority}
            onChange={setFilter("priority")}
            options={withAll("All priorities", TASK_PRIORITIES)}
          />
          <Select
            aria-label="Filter by assignee"
            className="w-44"
            value={filters.assignedTo}
            onChange={setFilter("assignedTo")}
            options={withAll("All assignees", memberOptions)}
          />
          <Select
            aria-label="Filter by assigner"
            className="w-44"
            value={filters.assignedBy}
            onChange={setFilter("assignedBy")}
            options={withAll("Assigned by anyone", managerOptions)}
          />
        </div>
        {isManager && (
          <Button type="primary" onClick={() => openForm(null)}>
            Add Task
          </Button>
        )}
      </div>

      {view === "Board" ? (
        <TaskBoard
          tasks={tasks}
          canChangeStatus={canChangeStatus}
          onStatusUpdate={onStatusUpdate}
          onOpen={(task) => setViewTaskId(task._id)}
        />
      ) : (
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={tasks}
          scroll={{ x: true }}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          className="card overflow-hidden"
        />
      )}

      {showTaskForm && (
        <TaskForm
          showTaskForm={showTaskForm}
          setShowTaskForm={setShowTaskForm}
          project={project}
          reloadData={getTasks}
          task={formTask}
        />
      )}

      {viewTask && (
        <Modal
          title="Task Details"
          open
          onCancel={() => setViewTaskId(null)}
          centered
          footer={
            isManager ? (
              <Button
                onClick={() => {
                  setViewTaskId(null);
                  openForm(viewTask);
                }}
              >
                Edit
              </Button>
            ) : null
          }
          width={640}
        >
          <h3 className="text-lg font-semibold mt-3">{viewTask.name}</h3>
          <p className="text-muted whitespace-pre-wrap mt-2">
            {viewTask.description}
          </p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mt-4 mb-0">
            <div>
              <dt className="text-xs text-muted mb-1">Status</dt>
              <dd className="m-0">
                <Select
                  aria-label="Task status"
                  className="w-full"
                  value={viewTask.status}
                  options={TASK_STATUSES}
                  disabled={!canChangeStatus(viewTask)}
                  onChange={(status) => onStatusUpdate(viewTask, status)}
                />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted mb-1">Priority</dt>
              <dd className="m-0 pt-2">
                <PriorityBadge priority={viewTask.priority} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted mb-1">Assigned to</dt>
              <dd className="m-0">{memberName(viewTask.assignedTo)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted mb-1">Assigned by</dt>
              <dd className="m-0">{memberName(viewTask.assignedBy)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted mb-1">Created</dt>
              <dd className="m-0">{getDateFormat(viewTask.createdAt)}</dd>
            </div>
            {viewTask.dueDate && (
              <div>
                <dt className="text-xs text-muted mb-1">Due</dt>
                <dd className="m-0">{getDateFormat(viewTask.dueDate)}</dd>
              </div>
            )}
          </dl>
          {viewTask.attachments.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-3">
              <Image.PreviewGroup>
                {viewTask.attachments.map((image) => (
                  <Image
                    key={image}
                    src={image}
                    alt="Task attachment"
                    width={120}
                    height={120}
                    className="object-cover rounded"
                  />
                ))}
              </Image.PreviewGroup>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

export default Tasks;
