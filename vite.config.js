import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// plugin-react inline pour éviter une dépendance en plus
const fakeReactPlugin = {
  ...react?.() ?? {},
};

export default defineConfig({
  plugins: [fakeReactPlugin],
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development")
  },
  server: { host: true, port: 5173 }
});
