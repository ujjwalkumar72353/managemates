import React, { useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion"; // Import Framer Motion for animations
import Divider from "../../components/Divider";
import { LoginUser } from "../../apicalls/users";
import { SetButtonLoading } from "../../redux/loadersSlice";
import { getAntdFormInputRules } from "../../utils/helpers";

function Login() {
  const { buttonLoading } = useSelector((state) => state.loaders);
  const dispatch = useDispatch();

  const onFinish = async (values) => {
    try {
      dispatch(SetButtonLoading(true));
      const response = await LoginUser(values);
      dispatch(SetButtonLoading(false));
      if (response.success) {
        localStorage.setItem("token", response.data);
        message.success(response.message);
        window.location.href = "/";
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch(SetButtonLoading(false));
      message.error(error.message);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) {
      window.location.href = "/";
    }
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Left Section with Animation */}
      <motion.div
        className="bg-gradient-to-r from-blue-700 to-indigo-800 flex-1 flex flex-col justify-center items-center p-6 md:p-0"
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.h1
          className="text-4xl md:text-6xl text-white font-bold text-center"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          Manage-Mate
        </motion.h1>
        <motion.span
          className="text-white mt-3 md:mt-5 text-center text-base md:text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          One place to track all your business records
        </motion.span>
      </motion.div>

      {/* Right Section with Form */}
      <motion.div
        className="flex flex-1 justify-center items-center bg-gray-100 p-6 md:p-0"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="bg-white p-8 md:p-10 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-700 mb-4 text-center md:text-left">
            LOGIN TO YOUR ACCOUNT
          </h1>
          <Divider />
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Email"
              name="email"
              rules={getAntdFormInputRules}
            >
              <Input className="focus:border-blue-500" />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              rules={getAntdFormInputRules}
            >
              <Input type="password" className="focus:border-blue-500" />
            </Form.Item>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={buttonLoading}
                className="transition-transform"
              >
                {buttonLoading ? "Loading" : "Login"}
              </Button>
            </motion.div>

            <div className="flex justify-center mt-5">
              <span>
                Don't have an account?{" "}
                <Link to="/register" className="text-blue-500 hover:underline">
                  Register
                </Link>
              </span>
            </div>
          </Form>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
