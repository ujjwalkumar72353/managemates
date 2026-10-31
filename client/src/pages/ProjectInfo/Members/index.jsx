import { App, Button, Popconfirm, Select, Table } from "antd";
import React from "react";
import { useDispatch } from "react-redux";
import { RemoveMemberFromProject } from "../../../apicalls/projects";
import { SetLoading } from "../../../redux/loadersSlice";
import { UserAvatar } from "../../../components/ui";
import MemberForm from "./MemberForm";

function Members({ project, role, reloadData }) {
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [showMemberForm, setShowMemberForm] = React.useState(false);
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const isOwner = role === "owner";

  const deleteMember = async (memberId) => {
    dispatch(SetLoading(true));
    const response = await RemoveMemberFromProject({
      projectId: project._id,
      memberId,
    });
    dispatch(SetLoading(false));
    if (response.success) {
      message.success(response.message);
      reloadData();
    } else {
      message.error(response.message);
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "user",
      render: (user) => (
        <span className="flex items-center gap-2.5">
          <UserAvatar user={user} />
          {user.firstName} {user.lastName}
        </span>
      ),
    },
    {
      title: "Email",
      dataIndex: "user",
      key: "email",
      render: (user) => user.email,
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (text) => <span className="capitalize">{text}</span>,
    },
  ];

  if (isOwner) {
    columns.push({
      title: "Action",
      key: "action",
      render: (text, record) =>
        record.role !== "owner" && (
          <Popconfirm
            title="Remove this member?"
            okText="Remove"
            onConfirm={() => deleteMember(record._id)}
          >
            <Button type="link" danger>
              Remove
            </Button>
          </Popconfirm>
        ),
    });
  }

  return (
    <div>
      <div className="flex justify-between items-end gap-3 flex-wrap mb-4">
        <Select
          aria-label="Filter by role"
          className="w-44"
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: "all", label: "All roles" },
            { value: "owner", label: "Owner" },
            { value: "admin", label: "Admin" },
            { value: "employee", label: "Employee" },
          ]}
        />
        {isOwner && (
          <Button type="primary" onClick={() => setShowMemberForm(true)}>
            Add Member
          </Button>
        )}
      </div>
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={project.members.filter(
          (member) => roleFilter === "all" || member.role === roleFilter
        )}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: true }}
        className="card overflow-hidden"
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
