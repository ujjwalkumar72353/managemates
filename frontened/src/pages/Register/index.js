import React, { useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import Divider from "../../components/Divider";
import "./Register.css"; // Import custom CSS for animations

function Register() {
  const navigate = useNavigate();

  const onFinish = (values) => {
    console.log("Success:", values);
    message.success("Registration successful!");
    navigate("/login");
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-gray-100 to-gray-300">
      {/* Left Section */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 flex-1 flex flex-col justify-center items-center p-8 lg:p-16 register-animation">
        <div className="text-center">
          <h1 className="text-6xl lg:text-7xl text-white font-extrabold animate-bounce">
            Manage Mate
          </h1>
          <p className="text-white mt-4 text-lg lg:text-xl max-w-md leading-relaxed">
            One place to track all your business records
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex-1 flex justify-center items-center p-6 lg:p-20">
        <div className="w-full max-w-md bg-white shadow-2xl rounded-xl p-8 lg:p-10 transform transition duration-500 hover:scale-105 register-form-animation">
          <h1 className="text-3xl font-semibold text-gray-800 text-center mb-6">
            Let’s Get You Started
          </h1>
          <Divider />
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label={<span className="font-medium text-gray-600">First Name</span>}
              name="firstName"
              rules={[{ required: true, message: "Please input your first name!" }]}
            >
              <Input className="rounded-md border-gray-300 focus:border-pink-500 focus:ring-pink-500" />
            </Form.Item>
            <Form.Item
              label={<span className="font-medium text-gray-600">Last Name</span>}
              name="lastName"
              rules={[{ required: true, message: "Please input your last name!" }]}
            >
              <Input className="rounded-md border-gray-300 focus:border-pink-500 focus:ring-pink-500" />
            </Form.Item>
            <Form.Item
              label={<span className="font-medium text-gray-600">Email</span>}
              name="email"
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Please enter a valid email address!" },
              ]}
            >
              <Input className="rounded-md border-gray-300 focus:border-pink-500 focus:ring-pink-500" />
            </Form.Item>
            <Form.Item
              label={<span className="font-medium text-gray-600">Password</span>}
              name="password"
              rules={[{ required: true, message: "Please input your password!" }]}
            >
              <Input.Password className="rounded-md border-gray-300 focus:border-pink-500 focus:ring-pink-500" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              className="bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-md py-2 transition duration-300 shadow-lg hover:shadow-2xl"
            >
              Register
            </Button>

            <div className="flex justify-center mt-6">
              <span className="text-gray-500">
                Already have an account?{" "}
                <Link to="/login" className="text-pink-500 hover:text-pink-600 font-medium transition duration-300">
                  Login
                </Link>
              </span>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default Register;
