import { apiRequest } from ".";

export const CreateTask = async (task) =>
  apiRequest("post", "/api/tasks/create-task", task);

export const GetAllTasks = async (filters) =>
  apiRequest("post", "/api/tasks/get-all-tasks", filters);

export const GetMyTasks = async () => apiRequest("get", "/api/tasks/my-tasks");

export const UpdateTask = async (task) =>
  apiRequest("post", "/api/tasks/update-task", task);

export const DeleteTask = async (id) =>
  apiRequest("post", "/api/tasks/delete-task", { _id: id });

export const UploadImage = async (payload) =>
  apiRequest("post", "/api/tasks/upload-image", payload);

export const DeleteAttachment = async (payload) =>
  apiRequest("post", "/api/tasks/delete-attachment", payload);
