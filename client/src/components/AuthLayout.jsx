import React from "react";

const PREVIEW = [
  ["Design landing page", "bg-emerald-400", "Done"],
  ["Build pricing page", "bg-amber-400", "In progress"],
  ["Write launch email", "bg-slate-400", "Pending"],
];

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-canvas">
      <div className="mesh text-white p-8 lg:p-14 flex flex-col justify-between gap-8">
        <span className="flex items-center gap-2.5">
          <span className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center">
            <i className="ri-stack-fill text-lg" aria-hidden="true"></i>
          </span>
          <span className="font-bold text-xl tracking-tight">ManageMate</span>
        </span>
        <div>
          <h1 className="text-3xl lg:text-5xl font-bold tracking-tight leading-tight">
            Your team's work,
            <br />
            moving in real time.
          </h1>
          <p className="text-white/80 mt-4 max-w-md leading-relaxed">
            Plan projects, assign tasks and watch progress update live for
            everyone.
          </p>
        </div>
        <div className="hidden lg:flex flex-col gap-2 max-w-md rounded-2xl bg-white/10 border border-solid border-white/15 p-4 backdrop-blur">
          {PREVIEW.map(([name, dot, status]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-3 rounded-lg bg-black/25 px-3 py-2.5 text-sm"
            >
              <span>{name}</span>
              <span className="flex items-center gap-2 text-xs text-white/80">
                <span className={`h-1.5 w-1.5 rounded-full ${dot}`}></span>
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center items-center p-6">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted mt-1 mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
