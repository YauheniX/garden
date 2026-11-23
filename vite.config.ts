import tailwindcss from '@tailwindcss/vite'
import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/garden/',
  plugins: [tailwindcss(), react(), babel({ presets: [reactCompilerPreset()] })],
})
