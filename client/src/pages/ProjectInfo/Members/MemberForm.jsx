import { App, Form, Input, Modal, Select } from "antd";
import React from "react";
import { useDispatch } from "react-redux";
import { AddMemberToProject } from "../../../apicalls/projects";
import { SetLoading } from "../../../redux/loadersSlice";
import { emailRules, getAntdFormInputRules } from "../../../utils/helpers";

function MemberForm({
  showMemberForm,
  setShowMemberForm,
  reloadData,
  project,
}) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { message } = App.useApp();

  const onFinish = async (values) => {
    dispatch(SetLoading(true));
    const response = await AddMemberToProject({
      ...values,
      projectId: project._id,
    });
    dispatch(SetLoading(false));
    if (response.success) {
      message.success(response.message);
      reloadData();
      setShowMemberForm(false);
    } else {
      message.error(response.message);
    }
  };

  return (
    <Modal
      title="Add Member"
      open={showMemberForm}
      onCancel={() => setShowMemberForm(false)}
      centered
      okText="Add"
      onOk={() => form.submit()}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ role: "employee" }}
      >
        <Form.Item label="Email" name="email" rules={emailRules}>
          <Input placeholder="Email of a registered user" />
        </Form.Item>
        <Form.Item label="Role" name="role" rules={getAntdFormInputRules}>
          <Select
            options={[
              { value: "admin", label: "Admin" },
              { value: "employee", label: "Employee" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default MemberForm;
