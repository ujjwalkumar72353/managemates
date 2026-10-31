import React, { useState } from "react";
import {
  PriorityBadge,
  STATUS_DOTS,
  UserAvatar,
} from "../../../components/ui";
import {
  getDateFormat,
  isOverdue,
  TASK_STATUSES,
} from "../../../utils/helpers";

function TaskBoard({ tasks, canChangeStatus, onStatusUpdate, onOpen }) {
  const [draggedId, setDraggedId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  const onDrop = (status) => {
    const task = tasks.find((item) => item._id === draggedId);
    setDraggedId(null);
    setOverColumn(null);
    if (task) {
      onStatusUpdate(task, status);
    }
  };

  return (
    <div className="flex xl:grid xl:grid-cols-4 gap-4 overflow-x-auto no-scrollbar snap-x pb-2 -mx-4 px-4 md:mx-0 md:px-0">
      {TASK_STATUSES.map(({ value, label }) => {
        const columnTasks = tasks.filter((task) => task.status === value);
        return (
          <section
            key={value}
            aria-label={label}
            data-column={value}
            className={`snap-start shrink-0 w-[280px] xl:w-auto rounded-2xl p-3 min-h-[420px] border border-solid transition-colors duration-150 ${
              overColumn === value
                ? "border-accent bg-accent-soft"
                : "border-transparent bg-raised/60"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setOverColumn(value);
            }}
            onDragLeave={() => setOverColumn(null)}
            onDrop={() => onDrop(value)}
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold px-1 mb-3">
              <span className={`h-2 w-2 rounded-full ${STATUS_DOTS[value]}`}></span>
              {label}
              <span className="ml-auto text-xs text-muted font-medium">
                {columnTasks.length}
              </span>
            </h3>
            <div className="flex flex-col gap-2.5">
              {columnTasks.map((task) => (
                <article
                  key={task._id}
                  data-task={task.name}
                  tabIndex={0}
                  draggable={canChangeStatus(task)}
                  onDragStart={() => setDraggedId(task._id)}
                  onDragEnd={() => setDraggedId(null)}
                  onClick={() => onOpen(task)}
                  onKeyDown={(event) => event.key === "Enter" && onOpen(task)}
                  className={`card card-link p-3.5 ${
                    canChangeStatus(task) ? "cursor-grab" : ""
                  } ${draggedId === task._id ? "opacity-50" : ""}`}
                >
                  <div className="flex justify-between gap-2 mb-3">
                    <p className="font-medium text-sm leading-snug">
                      {task.name}
                    </p>
                    <UserAvatar user={task.assignedTo} size={24} />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    <span className="flex items-center gap-2.5 text-xs text-muted">
                      {task.attachments.length > 0 && (
                        <span>
                          <i className="ri-attachment-2" aria-hidden="true"></i>{" "}
                          {task.attachments.length}
                        </span>
                      )}
                      {task.dueDate && (
                        <span
                          className={
                            isOverdue(task)
                              ? "text-red-600 dark:text-red-300 font-semibold"
                              : ""
                          }
                        >
                          {getDateFormat(task.dueDate)}
                        </span>
                      )}
                    </span>
                  </div>
                </article>
              ))}
              {columnTasks.length === 0 && (
                <p className="text-xs text-muted text-center py-6 border border-dashed border-line rounded-xl">
                  No tasks here
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default TaskBoard;
