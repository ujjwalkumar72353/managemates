import { App, Button, Form, Input } from "antd";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChangePassword, UpdateProfile } from "../../apicalls/users";
import { SetLoading } from "../../redux/loadersSlice";
import { SetUser } from "../../redux/usersSlice";
import { getAntdFormInputRules, passwordRules } from "../../utils/helpers";

function General() {
  const { user } = useSelector((state) => state.users);
  const [passwordForm] = Form.useForm();
  const dispatch = useDispatch();
  const { message } = App.useApp();

  const onSaveProfile = async (values) => {
    dispatch(SetLoading(true));
    const response = await UpdateProfile(values);
    dispatch(SetLoading(false));
    if (response.success) {
      dispatch(SetUser(response.data));
      message.success(response.message);
    } else {
      message.error(response.message);
    }
  };

  const onChangePassword = async (values) => {
    dispatch(SetLoading(true));
    const response = await ChangePassword(values);
    dispatch(SetLoading(false));
    if (response.success) {
      passwordForm.resetFields();
      message.success(response.message);
    } else {
      message.error(response.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl">
      <div className="card p-5">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <Form
          layout="vertical"
          initialValues={user}
          onFinish={onSaveProfile}
        >
          <Form.Item
            label="First Name"
            name="firstName"
            rules={getAntdFormInputRules}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Last Name"
            name="lastName"
            rules={getAntdFormInputRules}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input disabled />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Save Profile
          </Button>
        </Form>
      </div>

      <div className="card p-5">
        <h2 className="text-lg font-semibold mb-4">
          Change Password
        </h2>
        <Form form={passwordForm} layout="vertical" onFinish={onChangePassword}>
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={getAntdFormInputRules}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            label="New Password"
            name="newPassword"
            rules={passwordRules}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Change Password
          </Button>
        </Form>
      </div>
    </div>
  );
}

export default General;
