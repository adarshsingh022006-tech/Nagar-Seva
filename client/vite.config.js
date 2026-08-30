import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // So the frontend can call "/api/..." and "/uploads/..." directly —
      // Vite forwards them to the Express server during development.
      "/api": "http://localhost:5000",
      "/uploads": "http://localhost:5000",
    },
  },
});
