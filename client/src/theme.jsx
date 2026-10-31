import { ConfigProvider, theme as antdTheme } from "antd";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "theme";
const ThemeContext = createContext(null);

const readTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || "dark";
  } catch {
    return "dark";
  }
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  const value = useMemo(
    () => ({ theme, toggleTheme: () => setTheme(isDark ? "light" : "dark") }),
    [theme, isDark]
  );

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider
        theme={{
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: "#6d4aff",
            colorBgContainer: isDark ? "#14141b" : "#ffffff",
            colorBgElevated: isDark ? "#1c1c25" : "#ffffff",
            colorBorder: isDark ? "#2a2a35" : "#e3e3ea",
            colorBorderSecondary: isDark ? "#2a2a35" : "#e3e3ea",
            controlHeight: 40,
            borderRadius: 10,
            fontFamily: '"Plus Jakarta Sans Variable", sans-serif',
          },
          components: {
            Table: { headerBg: "transparent" },
            Button: { primaryShadow: "none" },
            Segmented: {
              trackBg: isDark ? "#1c1c25" : "#ececf2",
              itemSelectedBg: isDark ? "#343442" : "#ffffff",
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
