import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Puerto distinto al de la app de fans (5173) para poder correr las dos juntas.
export default defineConfig({
  plugins: [react()],
  server: { port: 5175 },
});
