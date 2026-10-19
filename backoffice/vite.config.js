import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Puerto distinto al de la app de fans (5173) para poder correr las dos juntas.
// Build igual que la app de fans: sin source maps, comentarios ni console.*
// (ver vite.config.js de la raíz).
export default defineConfig({
  plugins: [react()],
  server: { port: 5175 },
  build: {
    sourcemap: false,
    rolldownOptions: {
      output: {
        comments: false,
        minify: {
          compress: { dropConsole: true, dropDebugger: true },
          mangle: true,
        },
      },
    },
  },
});
