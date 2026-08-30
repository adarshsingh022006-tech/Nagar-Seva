/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10233d",
        "ink-soft": "#1c3a5e",
        paper: "#f6f4ee",
        marigold: "#f2a93b",
        "marigold-deep": "#d98f1f",
        teal: "#1f8a70",
        clay: "#c1512f",
        line: "#ded8c8",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
