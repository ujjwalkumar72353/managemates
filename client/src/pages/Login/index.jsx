import React, { useEffect, useState } from "react";
import { App, Button, Form, Input } from "antd";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import { LoginUser } from "../../apicalls/users";
import { emailRules, getAntdFormInputRules } from "../../utils/helpers";

function Login() {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { message } = App.useApp();

  const onFinish = async (values) => {
    setSubmitting(true);
    const response = await LoginUser(values);
    setSubmitting(false);
    if (response.success) {
      localStorage.setItem("token", response.data);
      message.success(response.message);
      navigate("/");
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
    <AuthLayout title="Welcome back" subtitle="Log in to continue to your workspace">
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item label="Email" name="email" rules={emailRules}>
          <Input autoComplete="email" />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={getAntdFormInputRules}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={submitting}>
          Login
        </Button>
        <p className="text-center mt-5 mb-0 text-muted">
          Don't have an account? <Link to="/register" className="text-accent font-semibold">
            Register
          </Link>
        </p>
        {import.meta.env.DEV && (
          <div className="mt-4">
            <p className="text-center text-xs text-muted mt-0 mb-2">
              Try a demo account
            </p>
            <div className="grid grid-cols-3 gap-2">
              {["owner", "admin", "employee"].map((role) => (
                <Button
                  key={role}
                  className="capitalize"
                  disabled={submitting}
                  onClick={() =>
                    onFinish({
                      email: `${role}@demo.com`,
                      password: "demo12345",
                    })
                  }
                >
                  {role}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Form>
    </AuthLayout>
  );
}

export default Login;
