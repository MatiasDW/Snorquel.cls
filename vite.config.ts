import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5124,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY ?? "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
