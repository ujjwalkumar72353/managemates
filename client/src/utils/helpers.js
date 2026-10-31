import dayjs from "dayjs";

export const getAntdFormInputRules = [
  {
    required: true,
    message: "Required",
  },
];

export const emailRules = [
  { required: true, message: "Required" },
  { type: "email", message: "Enter a valid email" },
];

export const passwordRules = [
  { required: true, message: "Required" },
  { min: 8, message: "Use at least 8 characters" },
];

export const getDateFormat = (date) => dayjs(date).format("D MMM YYYY");

export const memberName = (user) => `${user.firstName} ${user.lastName}`;

export const TASK_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "inprogress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "closed", label: "Closed" },
];

export const TASK_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const PROJECT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "onhold", label: "On Hold" },
  { value: "completed", label: "Completed" },
];

export const isOverdue = (task) =>
  Boolean(task.dueDate) &&
  ["pending", "inprogress"].includes(task.status) &&
  dayjs(task.dueDate).isBefore(dayjs(), "day");
