import { App, Badge } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { GetLoggedInUser } from "../apicalls/users";
import { GetAllNotifications } from "../apicalls/notifications";
import { GetProjectsByRole } from "../apicalls/projects";
import { AddNotification, SetNotifications, SetUser } from "../redux/usersSlice";
import { SetLoading } from "../redux/loadersSlice";
import { useTheme } from "../theme";
import { disconnectSocket, getSocket } from "../utils/socket";
import { memberName } from "../utils/helpers";
import CommandPalette from "./CommandPalette";
import Notifications from "./Notifications";
import { IconButton, STATUS_DOTS, UserAvatar } from "./ui";

const NAV = [
  { to: "/", label: "Dashboard", icon: "ri-dashboard-line" },
  { to: "/profile", label: "Projects", icon: "ri-folder-line" },
];

const navClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
    isActive
      ? "bg-accent-soft !text-accent"
      : "!text-muted hover:!text-ink hover:bg-raised"
  }`;

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="h-8 w-8 rounded-[10px] bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-white">
        <i className="ri-stack-fill" aria-hidden="true"></i>
      </span>
      <span className="font-bold text-lg tracking-tight">ManageMate</span>
    </span>
  );
}

function ProtectedPage({ children }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const { theme, toggleTheme } = useTheme();
  const { user, notifications } = useSelector((state) => state.users);

  const logout = () => {
    localStorage.removeItem("token");
    disconnectSocket();
    dispatch(SetUser(null));
    dispatch(SetNotifications([]));
    navigate("/login");
  };

  const getUser = async () => {
    dispatch(SetLoading(true));
    const response = await GetLoggedInUser();
    dispatch(SetLoading(false));
    if (response.success) {
      dispatch(SetUser(response.data));
    } else {
      message.error(response.message);
      logout();
    }
  };

  const getNotifications = async () => {
    const response = await GetAllNotifications();
    if (response.success) {
      dispatch(SetNotifications(response.data));
    }
  };

  const getProjects = async () => {
    const response = await GetProjectsByRole();
    if (response.success) {
      setProjects(response.data);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    } else if (!user) {
      getUser();
    }
  }, []);

  useEffect(() => {
    if (!user?._id) return undefined;
    getNotifications();
    getProjects();
    const socket = getSocket();
    const onNotification = (notification) => {
      dispatch(AddNotification(notification));
      message.info(notification.title);
    };
    const projectEvents = [
      "project:added",
      "project:removed",
      "project:deleted",
      "project:changed",
    ];
    socket.on("notification:new", onNotification);
    projectEvents.forEach((event) => socket.on(event, getProjects));
    return () => {
      socket.off("notification:new", onNotification);
      projectEvents.forEach((event) => socket.off(event, getProjects));
    };
  }, [user?._id]);

  useEffect(() => {
    if (user) getProjects();
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setShowPalette((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!user) return null;

  const unread = notifications.filter((item) => !item.read).length;

  return (
    <div className="min-h-screen md:pl-64">
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col border-0 border-r border-solid border-line bg-surface p-4">
        <button
          type="button"
          aria-label="Go to dashboard"
          className="bg-transparent border-0 p-1 cursor-pointer text-left"
          onClick={() => navigate("/")}
        >
          <Logo />
        </button>

        <nav aria-label="Main" className="flex flex-col gap-1 mt-6">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end className={navClass}>
              <i className={`${item.icon} text-lg`} aria-hidden="true"></i>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <p className="text-xs font-semibold text-muted uppercase tracking-wider mt-7 mb-2 px-3">
          Your projects
        </p>
        <nav
          aria-label="Projects"
          className="flex flex-col gap-1 flex-1 overflow-y-auto no-scrollbar"
        >
          {projects.map((project) => (
            <NavLink
              key={project._id}
              to={`/project/${project._id}`}
              className={navClass}
            >
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  STATUS_DOTS[project.status] || STATUS_DOTS.completed
                }`}
              ></span>
              <span className="truncate">{project.name}</span>
            </NavLink>
          ))}
          {projects.length === 0 && (
            <p className="text-sm text-muted px-3">No projects yet</p>
          )}
        </nav>

        <div className="flex items-center gap-1 pt-3 mt-3 border-0 border-t border-solid border-line">
          <button
            type="button"
            aria-label="Profile"
            onClick={() => navigate("/profile")}
            className="flex-1 min-w-0 flex items-center gap-2.5 bg-transparent border-0 p-1.5 rounded-lg cursor-pointer text-left transition-colors duration-150 hover:bg-raised"
          >
            <UserAvatar user={user} size={32} />
            <span className="min-w-0">
              <span className="block text-sm font-semibold truncate">
                {user.firstName}
              </span>
              <span className="block text-xs text-muted truncate">
                {user.email}
              </span>
            </span>
          </button>
          <button
            type="button"
            aria-label="Log out"
            onClick={logout}
            className="h-10 w-10 shrink-0 bg-transparent border-0 rounded-lg text-muted cursor-pointer transition-colors duration-150 hover:text-ink hover:bg-raised"
          >
            <i className="ri-logout-box-r-line text-lg" aria-hidden="true"></i>
          </button>
        </div>
      </aside>

      <div className="flex flex-col min-h-screen pb-20 md:pb-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 md:px-8 py-3 bg-canvas/80 backdrop-blur border-0 border-b border-solid border-line">
          <span className="md:hidden">
            <Logo />
          </span>
          <button
            type="button"
            onClick={() => setShowPalette(true)}
            aria-label="Search"
            className="hidden md:flex items-center gap-3 h-10 w-80 max-w-full px-3 rounded-xl border border-solid border-line bg-surface text-muted cursor-pointer text-sm transition-colors duration-150 hover:text-ink"
          >
            <i className="ri-search-line" aria-hidden="true"></i>
            <span className="flex-1 text-left">Search projects and tasks</span>
            <kbd className="text-xs border border-solid border-line rounded px-1.5">
              ⌘K
            </kbd>
          </button>
          <div className="flex items-center gap-2">
            <IconButton
              label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              icon={theme === "dark" ? "ri-sun-line" : "ri-moon-line"}
              onClick={toggleTheme}
            />
            <Badge count={unread} size="small">
              <IconButton
                label="Notifications"
                icon="ri-notification-3-line"
                onClick={() => setShowNotifications(true)}
              />
            </Badge>
          </div>
        </header>

        <main
          key={location.pathname}
          className="page-enter flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6"
        >
          {children}
        </main>
      </div>

      <nav
        aria-label="Mobile"
        className="md:hidden fixed bottom-0 inset-x-0 z-20 grid grid-cols-4 bg-surface border-0 border-t border-solid border-line"
      >
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-xs ${
                isActive ? "!text-accent" : "!text-muted"
              }`
            }
          >
            <i className={`${item.icon} text-xl`} aria-hidden="true"></i>
            {item.label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setShowPalette(true)}
          className="flex flex-col items-center gap-0.5 py-2 text-xs text-muted bg-transparent border-0 cursor-pointer"
        >
          <i className="ri-search-line text-xl" aria-hidden="true"></i>
          Search
        </button>
        <button
          type="button"
          onClick={logout}
          className="flex flex-col items-center gap-0.5 py-2 text-xs text-muted bg-transparent border-0 cursor-pointer"
        >
          <i className="ri-logout-box-r-line text-xl" aria-hidden="true"></i>
          Log out
        </button>
      </nav>

      <CommandPalette
        open={showPalette}
        onClose={() => setShowPalette(false)}
        projects={projects}
      />

      {showNotifications && (
        <Notifications
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
        />
      )}
    </div>
  );
}

export default ProtectedPage;
