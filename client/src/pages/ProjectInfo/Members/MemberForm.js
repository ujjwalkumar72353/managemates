import { Form, Input, message, Modal } from "antd";
import React from "react";
import { useDispatch } from "react-redux";
import { AddMemberToProject } from "../../../apicalls/projects";
import { SetLoading } from "../../../redux/loadersSlice";
import { getAntdFormInputRules } from "../../../utils/helpers";

function MemberForm({
  showMemberForm,
  setShowMemberForm,
  reloadData,
  project,
}) {
  const formRef = React.useRef(null);
  const dispatch = useDispatch();

  const onFinish = async (values) => {
    try {
      const emailExists = project.members.find(
        (member) => member.user.email === values.email
      );
      if (emailExists) {
        throw new Error("User is already a member of this project");
      }
      dispatch(SetLoading(true));
      const response = await AddMemberToProject({
        projectId: project._id,
        email: values.email,
        role: values.role,
      });
      if (response.success) {
        message.success(response.message);
        reloadData();
        setShowMemberForm(false);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(SetLoading(false));
    }
  };

  return (
    <Modal
      title="ADD MEMBER"
      open={showMemberForm}
      onCancel={() => setShowMemberForm(false)}
      centered
      okText="Add"
      onOk={() => {
        formRef.current.submit();
      }}
    >
      <Form layout="vertical" ref={formRef} onFinish={onFinish}>
        <Form.Item
          label="Email"
          name="email"
          rules={getAntdFormInputRules("Email", true)}
        >
          <Input placeholder="Enter email" />
        </Form.Item>
        <Form.Item
          label="Role"
          name="role"
          rules={getAntdFormInputRules("Role", true)}
        >
          <select className="w-full p-2 border rounded">
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="employee">Employee</option>
          </select>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default MemberForm;
