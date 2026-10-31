import { Tooltip } from "antd";
import React from "react";
import { memberName } from "../utils/helpers";

const GRADIENTS = [
  "from-violet-500 to-fuchsia-500",
  "from-sky-500 to-indigo-500",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
];

const hash = (text) =>
  [...text].reduce((total, char) => total + char.charCodeAt(0), 0);

export const gradientFor = (text = "") => GRADIENTS[hash(text) % GRADIENTS.length];

export function UserAvatar({ user, size = 28 }) {
  const name = memberName(user);
  return (
    <span
      title={name}
      aria-label={name}
      role="img"
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br ${gradientFor(name)} text-white font-semibold shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {`${user.firstName[0]}${user.lastName[0]}`.toUpperCase()}
    </span>
  );
}

export function AvatarStack({ users, max = 4 }) {
  return (
    <div className="flex items-center">
      {users.slice(0, max).map((user, index) => (
        <span
          key={user._id}
          className={`rounded-full ring-2 ring-[var(--surface)] flex ${index ? "-ml-2" : ""}`}
        >
          <UserAvatar user={user} size={26} />
        </span>
      ))}
      {users.length > max && (
        <span className="text-xs text-muted ml-2">+{users.length - max}</span>
      )}
    </div>
  );
}

const PRIORITIES = {
  low: { icon: "ri-arrow-down-line", tone: "text-muted bg-raised" },
  medium: {
    icon: "ri-subtract-line",
    tone: "text-amber-700 dark:text-amber-300 bg-amber-500/15",
  },
  high: {
    icon: "ri-arrow-up-line",
    tone: "text-red-700 dark:text-red-300 bg-red-500/15",
  },
};

export function PriorityBadge({ priority }) {
  const { icon, tone } = PRIORITIES[priority] || PRIORITIES.medium;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium capitalize ${tone}`}
    >
      <i className={icon} aria-hidden="true"></i>
      {priority}
    </span>
  );
}

export const STATUS_DOTS = {
  pending: "bg-slate-400",
  inprogress: "bg-amber-400",
  completed: "bg-emerald-400",
  closed: "bg-violet-400",
  active: "bg-emerald-400",
  onhold: "bg-amber-400",
};

export function StatusPill({ status, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-solid border-line px-2.5 py-0.5 text-xs font-medium whitespace-nowrap">
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[status]}`}></span>
      {label}
    </span>
  );
}

export function IconButton({ label, icon, onClick, children }) {
  return (
    <Tooltip title={label} placement="bottom">
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className="h-10 w-10 rounded-xl border border-solid border-line bg-surface text-ink cursor-pointer transition-colors duration-150 hover:bg-raised flex items-center justify-center"
      >
        <i className={`${icon} text-lg`} aria-hidden="true"></i>
        {children}
      </button>
    </Tooltip>
  );
}

export function ProgressRing({ percent, size = 112, stroke = 10 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        role="img"
        aria-label={`${percent}% of tasks done`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--raised)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          style={{ transition: "stroke-dashoffset 500ms ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">
        {percent}%
      </span>
    </div>
  );
}
