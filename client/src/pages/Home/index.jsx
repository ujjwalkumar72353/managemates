import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { App, Button, Progress, Skeleton } from "antd";
import { useNavigate } from "react-router-dom";
import { GetProjectsByRole } from "../../apicalls/projects";
import { GetMyTasks } from "../../apicalls/tasks";
import {
  AvatarStack,
  PriorityBadge,
  ProgressRing,
  StatusPill,
} from "../../components/ui";
import { SetLoading } from "../../redux/loadersSlice";
import {
  getDateFormat,
  isOverdue,
  PROJECT_STATUSES,
} from "../../utils/helpers";
import { getSocket } from "../../utils/socket";

function Stat({ label, value, icon, tone = "text-accent bg-accent-soft" }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <span
        className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl ${tone}`}
      >
        <i className={icon} aria-hidden="true"></i>
      </span>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

function Home() {
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const { user } = useSelector((state) => state.users);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const getData = async () => {
    const [projectsResponse, tasksResponse] = await Promise.all([
      GetProjectsByRole(),
      GetMyTasks(),
    ]);
    if (projectsResponse.success && tasksResponse.success) {
      setProjects(projectsResponse.data);
      setMyTasks(tasksResponse.data);
    } else {
      message.error(projectsResponse.message || tasksResponse.message);
    }
    setLoaded(true);
  };

  useEffect(() => {
    dispatch(SetLoading(true));
    getData().finally(() => dispatch(SetLoading(false)));

    const socket = getSocket();
    const events = [
      "notification:new",
      "project:added",
      "project:removed",
      "project:deleted",
    ];
    events.forEach((event) => socket.on(event, getData));
    return () => events.forEach((event) => socket.off(event, getData));
  }, []);

  const overdue = myTasks.filter(isOverdue).length;
  const totalTasks = projects.reduce((sum, item) => sum + item.taskCount, 0);
  const doneTasks = projects.reduce((sum, item) => sum + item.doneCount, 0);
  const percent = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Hey {user?.firstName}
          </h1>
          <p className="text-muted mt-1">Here's what needs your attention.</p>
        </div>
        <Button type="primary" onClick={() => navigate("/profile")}>
          Manage Projects
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Projects" value={projects.length} icon="ri-folder-3-line" />
        <Stat
          label="Open tasks"
          value={myTasks.length}
          icon="ri-list-check-2"
          tone="text-sky-600 dark:text-sky-300 bg-sky-500/15"
        />
        <Stat
          label="Overdue"
          value={overdue}
          icon="ri-alarm-warning-line"
          tone={
            overdue
              ? "text-red-600 dark:text-red-300 bg-red-500/15"
              : "text-emerald-600 dark:text-emerald-300 bg-emerald-500/15"
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="card lg:col-span-2 overflow-hidden">
          <h2 className="text-base font-semibold px-5 pt-4 pb-3">My Tasks</h2>
          {!loaded && (
            <div className="px-5 pb-4">
              <Skeleton active paragraph={{ rows: 3 }} title={false} />
            </div>
          )}
          {myTasks.map((task) => (
            <button
              type="button"
              key={task._id}
              className="w-full flex justify-between items-center gap-3 px-5 py-3 bg-transparent border-0 border-t border-solid border-line cursor-pointer text-left transition-colors duration-150 hover:bg-raised"
              onClick={() => navigate(`/project/${task.project._id}`)}
            >
              <span className="min-w-0">
                <span className="block font-medium truncate">{task.name}</span>
                <span className="block text-xs text-muted">
                  {task.project.name}
                </span>
              </span>
              <span className="flex items-center gap-3 shrink-0">
                {task.dueDate && (
                  <span
                    className={`hidden sm:inline text-xs ${
                      isOverdue(task)
                        ? "text-red-600 dark:text-red-300 font-semibold"
                        : "text-muted"
                    }`}
                  >
                    {isOverdue(task) ? "Overdue " : "Due "}
                    {getDateFormat(task.dueDate)}
                  </span>
                )}
                <PriorityBadge priority={task.priority} />
              </span>
            </button>
          ))}
          {loaded && myTasks.length === 0 && (
            <p className="text-muted px-5 pb-5">
              No open tasks. You're all clear.
            </p>
          )}
        </section>

        <section className="card p-5 flex flex-col items-center justify-center gap-3">
          <h2 className="text-base font-semibold self-start">Team progress</h2>
          <ProgressRing percent={percent} />
          <p className="text-sm text-muted">
            {doneTasks} of {totalTasks} tasks done
          </p>
        </section>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project._id}
              role="link"
              tabIndex={0}
              className="card card-link p-5"
              onClick={() => navigate(`/project/${project._id}`)}
              onKeyDown={(event) =>
                event.key === "Enter" && navigate(`/project/${project._id}`)
              }
            >
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold truncate">{project.name}</h3>
                <StatusPill
                  status={project.status}
                  label={
                    PROJECT_STATUSES.find(
                      (status) => status.value === project.status
                    )?.label
                  }
                />
              </div>
              <p className="text-sm text-muted mt-1.5 mb-4 line-clamp-2 min-h-10">
                {project.description}
              </p>
              <Progress
                percent={
                  project.taskCount
                    ? Math.round((project.doneCount / project.taskCount) * 100)
                    : 0
                }
                size="small"
                strokeColor="var(--accent)"
                trailColor="var(--raised)"
              />
              <div className="flex justify-between items-center mt-3">
                <AvatarStack
                  users={project.members.map((member) => member.user)}
                />
                <span className="text-xs text-muted">
                  {project.doneCount}/{project.taskCount} tasks
                </span>
              </div>
            </div>
          ))}
        </div>
        {loaded && projects.length === 0 && (
          <div className="card p-10 text-center">
            <i
              className="ri-folder-add-line text-4xl text-accent"
              aria-hidden="true"
            ></i>
            <p className="font-semibold mt-2">No projects yet</p>
            <p className="text-sm text-muted mt-1 mb-4">
              Create one and invite your team.
            </p>
            <Button type="primary" onClick={() => navigate("/profile")}>
              Create your first project
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
