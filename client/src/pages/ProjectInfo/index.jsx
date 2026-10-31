import { App, Tabs } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { GetProjectById } from "../../apicalls/projects";
import { SetLoading } from "../../redux/loadersSlice";
import {
  getDateFormat,
  memberName,
  PROJECT_STATUSES,
} from "../../utils/helpers";
import { getSocket } from "../../utils/socket";
import { AvatarStack, StatusPill } from "../../components/ui";
import Members from "./Members";
import Tasks from "./Tasks";

function ProjectInfo() {
  const { user } = useSelector((state) => state.users);
  const [project, setProject] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { message } = App.useApp();

  const getData = async () => {
    const response = await GetProjectById(id);
    if (response.success) {
      setProject(response.data);
    } else {
      message.error(response.message);
      navigate("/");
    }
  };

  useEffect(() => {
    dispatch(SetLoading(true));
    getData().finally(() => dispatch(SetLoading(false)));

    const socket = getSocket();
    const join = () => socket.emit("project:join", id);
    const onRemoved = ({ projectId }) => {
      if (projectId === id) {
        message.warning("You no longer have access to this project");
        navigate("/");
      }
    };
    join();
    socket.on("connect", join);
    socket.on("project:changed", getData);
    socket.on("project:removed", onRemoved);
    socket.on("project:deleted", onRemoved);
    return () => {
      socket.emit("project:leave", id);
      socket.off("connect", join);
      socket.off("project:changed", getData);
      socket.off("project:removed", onRemoved);
      socket.off("project:deleted", onRemoved);
    };
  }, [id]);

  if (!project) return null;

  const role = project.members.find(
    (member) => member.user._id === user._id
  )?.role;

  return (
    <div>
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {project.name}
            </h1>
            <StatusPill
              status={project.status}
              label={
                PROJECT_STATUSES.find((item) => item.value === project.status)
                  ?.label
              }
            />
            <span className="text-xs font-semibold uppercase tracking-wide text-accent bg-accent-soft rounded-full px-2.5 py-0.5">
              {role}
            </span>
          </div>
          <p className="text-muted mt-2 max-w-2xl">{project.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <AvatarStack
            users={project.members.map((member) => member.user)}
            max={5}
          />
          <p className="text-xs text-muted">
            Created {getDateFormat(project.createdAt)} by{" "}
            {memberName(project.owner)}
          </p>
        </div>
      </div>

      <Tabs
        defaultActiveKey="tasks"
        className="mt-4"
        items={[
          {
            key: "tasks",
            label: "Tasks",
            children: <Tasks project={project} role={role} />,
          },
          {
            key: "members",
            label: `Members (${project.members.length})`,
            children: (
              <Members project={project} role={role} reloadData={getData} />
            ),
          },
        ]}
      />
    </div>
  );
}

export default ProjectInfo;
