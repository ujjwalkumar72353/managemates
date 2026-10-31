/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        raised: "var(--raised)",
        line: "var(--line)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
      },
      boxShadow: {
        card: "var(--shadow)",
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
