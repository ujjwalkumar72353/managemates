import { Modal } from "antd";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GetMyTasks } from "../apicalls/tasks";

const PAGES = [
  { label: "Dashboard", hint: "Page", icon: "ri-dashboard-line", to: "/" },
  { label: "Manage projects", hint: "Page", icon: "ri-folder-line", to: "/profile" },
];

function CommandPalette({ open, onClose, projects }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [tasks, setTasks] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    GetMyTasks().then((response) => {
      if (response.success) setTasks(response.data);
    });
  }, [open]);

  const results = useMemo(() => {
    const entries = [
      ...PAGES,
      ...projects.map((project) => ({
        label: project.name,
        hint: "Project",
        icon: "ri-folder-3-line",
        to: `/project/${project._id}`,
      })),
      ...tasks.map((task) => ({
        label: task.name,
        hint: task.project.name,
        icon: "ri-checkbox-circle-line",
        to: `/project/${task.project._id}`,
      })),
    ];
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => entry.label.toLowerCase().includes(needle));
  }, [query, projects, tasks]);

  const choose = (entry) => {
    onClose();
    navigate(entry.to);
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && results[active]) {
      choose(results[active]);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={560}
      style={{ top: "14vh" }}
      afterOpenChange={(visible) => visible && inputRef.current?.focus()}
      styles={{ content: { padding: 0, overflow: "hidden" } }}
    >
      <div className="flex items-center gap-3 px-4 border-0 border-b border-solid border-line">
        <i className="ri-search-line text-muted" aria-hidden="true"></i>
        <input
          ref={inputRef}
          aria-label="Search projects and tasks"
          placeholder="Search projects and tasks"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className="flex-1 h-14 bg-transparent border-0 focus-visible:outline-none text-base text-ink min-w-0 font-[inherit]"
        />
        <kbd className="text-xs text-muted border border-solid border-line rounded px-1.5 py-0.5">
          Esc
        </kbd>
      </div>
      <div className="max-h-80 overflow-y-auto p-2">
        {results.map((entry, index) => (
          <button
            key={`${entry.hint}-${entry.to}-${entry.label}`}
            type="button"
            onMouseEnter={() => setActive(index)}
            onClick={() => choose(entry)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-0 cursor-pointer text-left ${
              index === active ? "bg-accent-soft" : "bg-transparent"
            }`}
          >
            <i className={`${entry.icon} text-muted`} aria-hidden="true"></i>
            <span className="flex-1 truncate text-ink">{entry.label}</span>
            <span className="text-xs text-muted truncate max-w-[40%]">
              {entry.hint}
            </span>
          </button>
        ))}
        {results.length === 0 && (
          <p className="text-center text-muted py-8">Nothing found</p>
        )}
      </div>
    </Modal>
  );
}

export default CommandPalette;
