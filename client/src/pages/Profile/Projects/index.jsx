import { App, Button, Popconfirm, Table } from "antd";
import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DeleteProject, GetAllProjects } from "../../../apicalls/projects";
import { SetLoading } from "../../../redux/loadersSlice";
import { getDateFormat, PROJECT_STATUSES } from "../../../utils/helpers";
import { StatusPill } from "../../../components/ui";
import ProjectForm from "./ProjectForm";

function Projects() {
  const [selectedProject, setSelectedProject] = React.useState(null);
  const [projects, setProjects] = React.useState([]);
  const [show, setShow] = React.useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const getData = async () => {
    dispatch(SetLoading(true));
    const response = await GetAllProjects();
    dispatch(SetLoading(false));
    if (response.success) {
      setProjects(response.data);
    } else {
      message.error(response.message);
    }
  };

  const onDelete = async (id) => {
    dispatch(SetLoading(true));
    const response = await DeleteProject(id);
    dispatch(SetLoading(false));
    if (response.success) {
      message.success(response.message);
      getData();
    } else {
      message.error(response.message);
    }
  };

  React.useEffect(() => {
    getData();
  }, []);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (text, record) => (
        <button
          type="button"
          className="bg-transparent border-0 p-0 font-semibold cursor-pointer text-left hover:text-accent"
          onClick={() => navigate(`/project/${record._id}`)}
        >
          {text}
        </button>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text) => (
        <StatusPill
          status={text}
          label={PROJECT_STATUSES.find((status) => status.value === text)?.label}
        />
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      render: getDateFormat,
    },
    {
      title: "Action",
      key: "action",
      render: (text, record) => (
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedProject(record);
              setShow(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this project and all its tasks?"
            okText="Delete"
            onConfirm={() => onDelete(record._id)}
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <Button
          type="primary"
          onClick={() => {
            setSelectedProject(null);
            setShow(true);
          }}
        >
          Add Project
        </Button>
      </div>
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={projects}
        className="card overflow-hidden"
        scroll={{ x: true }}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
      />
      {show && (
        <ProjectForm
          show={show}
          setShow={setShow}
          reloadData={getData}
          project={selectedProject}
        />
      )}
    </div>
  );
}

export default Projects;
