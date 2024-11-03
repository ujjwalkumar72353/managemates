import React, { useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import { Link } from "react-router-dom";
import Divider from "../../components/Divider";


function Login() {
  const onFinish=(values)=>{
    console.log("success",values);
  }

  return (
    <div className="grid grid-cols-2">
      <div className="bg-primary h-screen flex flex-col justify-center items-center">
        <div>
          <h1 className="text-7xl text-white mt-4 ">Manage Mate</h1>
          <span className=" text-white mt-5">
            One place to track all your business records
          </span>
        </div>
      </div>
      <div className="flex justify-center items-center">
        <div className="w-[420px]">
          <h1 className="text-2xl text-gray-700">LOGIN TO YOUR ACCOUNT</h1>
          <Divider />
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Email"
              name="email"
             
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              
            >
              <Input type="password" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
            >Login
            </Button>

            <div className="flex justify-center mt-5">
              <span>
                Don't have an account? <Link to="/register">Register</Link>
              </span>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default Login;