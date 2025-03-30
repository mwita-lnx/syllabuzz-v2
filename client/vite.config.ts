import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import checker from 'vite-plugin-checker';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),checker({
    typescript: {
      enabled: false, // Only enable in development
      buildMode: true, // Ensure it runs during build in development
    },
    eslint: {
      enabled: false, // Disable eslint if you want
      buildMode: true, 
    },
  })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
