import React, { useEffect } from "react";
import { Form, Input, Button, message } from "antd";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Divider from "../../components/Divider";
import { LoginUser } from "../../apicalls/users";
import { useDispatch, useSelector } from "react-redux";
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

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-screen">
      {/* Left Section with Animated Text */}
      <motion.div
        className="bg-gradient-to-r from-blue-500 to-indigo-600 flex flex-col justify-center items-center"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.h1
          className="text-6xl text-white font-bold"
          variants={itemVariants}
        >
          Manage-Mate
        </motion.h1>
        <motion.span
          className="text-white mt-5 text-lg"
          variants={itemVariants}
        >
          One place to track all your business records
        </motion.span>
      </motion.div>

      {/* Right Section with Form */}
      <motion.div
        className="flex justify-center items-center bg-gray-100"
        
      >
        <motion.div
          className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md"
          
          variants={containerVariants}
        >
          <motion.h1
            className="text-2xl font-semibold text-gray-700 mb-4"
            variants={itemVariants}
          >
            LOGIN TO YOUR ACCOUNT
          </motion.h1>
          <Divider />
          <Form layout="vertical" onFinish={onFinish}>
            <motion.div variants={itemVariants}>
              <Form.Item label="Email" name="email" rules={getAntdFormInputRules}>
                <Input className="focus:border-blue-500" />
              </Form.Item>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Form.Item
                label="Password"
                name="password"
                rules={getAntdFormInputRules}
              >
                <Input type="password" className="focus:border-blue-500" />
              </Form.Item>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={buttonLoading}
                className="transition-transform transform hover:scale-105"
              >
                {buttonLoading ? "Loading" : "Login"}
              </Button>
            </motion.div>

            <motion.div
              className="flex justify-center mt-5"
              variants={itemVariants}
            >
              <span>
                Don't have an account? <Link to="/register">Register</Link>
              </span>
            </motion.div>
          </Form>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Login;
