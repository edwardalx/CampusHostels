import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load all env variables from the project root
  const env = loadEnv(mode, path.resolve(__dirname, "../../"), "");

  // Merge into process.env so Vite can access them
  process.env = { ...process.env, ...env };

  return {
    plugins: [tailwindcss(), react()],
    server: {
      https: false,
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false, // allow self-signed HTTPS
        },
      },
    },
    define: {
      // Optional: expose env variables to React code
      "process.env.VITE_GOOGLE_CLIENT_ID": JSON.stringify(
        env.VITE_GOOGLE_CLIENT_ID,
      ),
      // 'process.env': process.env,
    },
  };
});
