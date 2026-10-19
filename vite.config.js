import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build de producción (lo que se sube a Vercel): sin source maps, sin
// comentarios y sin console.*, así en "Sources" del navegador solo queda el
// bundle minificado y no el código fuente. Ojo: el código del frontend
// siempre llega al navegador; nada secreto puede vivir acá (las claves y las
// reglas están en el backend). En `npm run dev` Vite sirve los archivos
// originales a propósito, para poder depurar.
export default defineConfig({
  plugins: [react()],
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
})
