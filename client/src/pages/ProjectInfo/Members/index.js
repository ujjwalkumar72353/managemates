import { Button, message, Table } from "antd";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RemoveMemberFromProject } from "../../../apicalls/projects";
import { SetLoading } from "../../../redux/loadersSlice";
import MemberForm from "./MemberForm";

function Members({ project, reloadData }) {
  const [role, setRole] = React.useState("");
  const [showMemberForm, setShowMemberForm] = React.useState(false);
  const { user } = useSelector((state) => state.users);

  const dispatch = useDispatch();
  const isOwner = project.owner._id === user._id;

  const deleteMember = async (memberId) => {
    try {
      dispatch(SetLoading(true));
      const response = await RemoveMemberFromProject({
        projectId: project._id,
        memberId,
      });
      if (response.success) {
        reloadData();
        message.success(response.message);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(SetLoading(false));
    }
  };

  const columns = [
    {
      title: "First Name",
      dataIndex: "firstName",
      render: (text, record) => record.user.firstName,
      responsive: ["sm"], // Show on small devices and up
    },
    {
      title: "Last Name",
      dataIndex: "lastName",
      render: (text, record) => record.user.lastName,
      responsive: ["sm"],
    },
    {
      title: "Email",
      dataIndex: "email",
      render: (text, record) => record.user.email,
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (text, record) => record.role.toUpperCase(),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (text, record) => (
        <Button type="link" danger onClick={() => deleteMember(record._id)}>
          Remove
        </Button>
      ),
      responsive: ["sm"],
    },
  ];

  // Remove "Action" column if the user is not the owner
  if (!isOwner) {
    columns.pop();
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        {isOwner && (
          <Button type="default" onClick={() => setShowMemberForm(true)}>
            Add Member
          </Button>
        )}
        <div className="w-48">
          <span>Select Role</span>
          <select
            className="w-full p-2 border rounded"
            onChange={(e) => setRole(e.target.value)}
            value={role}
          >
            <option value="">All</option>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={project.members.filter((member) => {
          if (role === "") {
            return true;
          }
          return member.role === role;
        })}
        className="mt-4"
        pagination={{ pageSize: 5 }}
        scroll={{ x: true }}
      />
      {showMemberForm && (
        <MemberForm
          showMemberForm={showMemberForm}
          setShowMemberForm={setShowMemberForm}
          reloadData={reloadData}
          project={project}
        />
      )}
    </div>
  );
}

export default Members;
