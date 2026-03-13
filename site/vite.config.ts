import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Develop the docs site against the SDK source in this repo.
      'clinical-table-search-sdk': fileURLToPath(
        new URL('../src/index.ts', import.meta.url),
      ),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
