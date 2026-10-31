import React from "react";
import ReactDOM from "react-dom/client";
import { App as AntApp } from "antd";
import { Provider } from "react-redux";
import "@fontsource-variable/plus-jakarta-sans";
import "remixicon/fonts/remixicon.css";
import "./index.css";
import App from "./App";
import store from "./redux/store";
import { ThemeProvider } from "./theme";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <ThemeProvider>
      <AntApp>
        <App />
      </AntApp>
    </ThemeProvider>
  </Provider>
);
