import React, { useEffect, useState } from "react";
import { App, Button, Form, Input } from "antd";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import { RegisterUser } from "../../apicalls/users";
import {
  emailRules,
  getAntdFormInputRules,
  passwordRules,
} from "../../utils/helpers";

function Register() {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { message } = App.useApp();

  const onFinish = async (values) => {
    setSubmitting(true);
    const response = await RegisterUser(values);
    setSubmitting(false);
    if (response.success) {
      message.success(response.message);
      navigate("/login");
    } else {
      message.error(response.message);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/");
    }
  }, []);

  return (
    <AuthLayout title="Create your account" subtitle="Get your team moving in a minute">
      <Form layout="vertical" onFinish={onFinish}>
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
        <Form.Item label="Email" name="email" rules={emailRules}>
          <Input autoComplete="email" />
        </Form.Item>
        <Form.Item label="Password" name="password" rules={passwordRules}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={submitting}>
          Register
        </Button>
        <p className="text-center mt-5 mb-0 text-muted">
          Already have an account? <Link to="/login" className="text-accent font-semibold">
            Login
          </Link>
        </p>
      </Form>
    </AuthLayout>
  );
}

export default Register;
