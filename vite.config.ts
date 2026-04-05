import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages project sites live at /<repo-name>/; absolute "/assets/..." would load from github.io/assets/ (404).
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
