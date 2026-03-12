import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- Did you add this import?

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <-- And add it here?
  ],
})