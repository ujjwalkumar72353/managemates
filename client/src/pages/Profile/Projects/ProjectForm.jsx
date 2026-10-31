import { App, Form, Input, Modal, Select } from "antd";
import React from "react";
import { useDispatch } from "react-redux";
import { SetLoading } from "../../../redux/loadersSlice";
import { CreateProject, EditProject } from "../../../apicalls/projects";
import {
  getAntdFormInputRules,
  PROJECT_STATUSES,
} from "../../../utils/helpers";

function ProjectForm({ show, setShow, reloadData, project }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { message } = App.useApp();

  const onFinish = async (values) => {
    dispatch(SetLoading(true));
    const response = project
      ? await EditProject({ ...values, _id: project._id })
      : await CreateProject(values);
    dispatch(SetLoading(false));
    if (response.success) {
      message.success(response.message);
      reloadData();
      setShow(false);
    } else {
      message.error(response.message);
    }
  };

  return (
    <Modal
      title={project ? "Edit Project" : "Create Project"}
      open={show}
      onCancel={() => setShow(false)}
      centered
      width={600}
      onOk={() => form.submit()}
      okText="Save"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={project || undefined}
      >
        <Form.Item
          label="Project Name"
          name="name"
          rules={getAntdFormInputRules}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Project Description"
          name="description"
          rules={getAntdFormInputRules}
        >
          <Input.TextArea rows={3} />
        </Form.Item>
        {project && (
          <Form.Item label="Status" name="status">
            <Select options={PROJECT_STATUSES} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

export default ProjectForm;
