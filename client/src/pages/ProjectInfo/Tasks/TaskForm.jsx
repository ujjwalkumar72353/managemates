import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Tabs,
  Upload,
} from "antd";
import dayjs from "dayjs";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  CreateTask,
  DeleteAttachment,
  UpdateTask,
  UploadImage,
} from "../../../apicalls/tasks";
import { SetLoading } from "../../../redux/loadersSlice";
import {
  getAntdFormInputRules,
  memberName,
  TASK_PRIORITIES,
} from "../../../utils/helpers";

function TaskForm({
  showTaskForm,
  setShowTaskForm,
  project,
  task,
  reloadData,
}) {
  const [form] = Form.useForm();
  const [selectedTab, setSelectedTab] = useState("details");
  const [file, setFile] = useState(null);
  const dispatch = useDispatch();
  const { message } = App.useApp();

  const onFinish = async (values) => {
    const payload = {
      ...values,
      dueDate: values.dueDate ? values.dueDate.toISOString() : null,
    };
    dispatch(SetLoading(true));
    const response = task
      ? await UpdateTask({ ...payload, _id: task._id })
      : await CreateTask({ ...payload, project: project._id });
    dispatch(SetLoading(false));
    if (response.success) {
      message.success(response.message);
      reloadData();
      setShowTaskForm(false);
    } else {
      message.error(response.message);
    }
  };

  const uploadImage = async () => {
    const formData = new FormData();
    formData.append("taskId", task._id);
    formData.append("file", file);
    dispatch(SetLoading(true));
    const response = await UploadImage(formData);
    dispatch(SetLoading(false));
    if (response.success) {
      message.success(response.message);
      setFile(null);
      reloadData();
    } else {
      message.error(response.message);
    }
  };

  const deleteImage = async (url) => {
    const response = await DeleteAttachment({ _id: task._id, url });
    if (response.success) {
      message.success(response.message);
      reloadData();
    } else {
      message.error(response.message);
    }
  };

  return (
    <Modal
      title={task ? "Update Task" : "Create Task"}
      open={showTaskForm}
      onCancel={() => setShowTaskForm(false)}
      centered
      onOk={() => form.submit()}
      okText={task ? "Update" : "Create"}
      width={700}
      {...(selectedTab === "attachments" && { footer: null })}
    >
      <Tabs
        activeKey={selectedTab}
        onChange={setSelectedTab}
        items={[
          {
            key: "details",
            label: "Task Details",
            children: (
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                  name: task?.name,
                  description: task?.description,
                  assignedTo: task?.assignedTo._id,
                  priority: task?.priority || "medium",
                  dueDate: task?.dueDate ? dayjs(task.dueDate) : null,
                }}
              >
                <Form.Item
                  label="Task Name"
                  name="name"
                  rules={getAntdFormInputRules}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Task Description"
                  name="description"
                  rules={getAntdFormInputRules}
                >
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item
                  label="Assign To"
                  name="assignedTo"
                  rules={getAntdFormInputRules}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="Choose a team member"
                    options={project.members.map((member) => ({
                      value: member.user._id,
                      label: `${memberName(member.user)} (${member.role})`,
                    }))}
                  />
                </Form.Item>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  <Form.Item label="Priority" name="priority">
                    <Select options={TASK_PRIORITIES} />
                  </Form.Item>
                  <Form.Item label="Due Date" name="dueDate">
                    <DatePicker className="w-full" format="D MMM YYYY" />
                  </Form.Item>
                </div>
              </Form>
            ),
          },
          {
            key: "attachments",
            label: "Attachments",
            disabled: !task,
            children: task && (
              <div>
                <div className="flex flex-wrap gap-4 mb-4">
                  {task.attachments.map((image) => (
                    <div
                      key={image}
                      className="flex flex-col gap-1 p-2 border border-solid rounded border-line items-center"
                    >
                      <img
                        src={image}
                        alt="Task attachment"
                        className="w-20 h-20 object-cover"
                      />
                      <Button
                        type="link"
                        danger
                        aria-label="Delete attachment"
                        icon={<i className="ri-delete-bin-line"></i>}
                        onClick={() => deleteImage(image)}
                      />
                    </div>
                  ))}
                </div>
                <Upload
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  maxCount={1}
                  beforeUpload={(selected) => {
                    setFile(selected);
                    return false;
                  }}
                  onRemove={() => setFile(null)}
                  fileList={file ? [file] : []}
                  listType="picture"
                >
                  <Button>Choose Image</Button>
                </Upload>
                <div className="flex justify-end mt-4">
                  <Button type="primary" onClick={uploadImage} disabled={!file}>
                    Upload
                  </Button>
                </div>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
}

export default TaskForm;
