import React from "react";
import { Tabs } from "antd";
import General from "./General";
import Projects from "./Projects";

function Profile() {
  return (
    <Tabs
      defaultActiveKey="projects"
      items={[
        { key: "projects", label: "My Projects", children: <Projects /> },
        { key: "general", label: "General", children: <General /> },
      ]}
    />
  );
}

export default Profile;
