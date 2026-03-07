import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  resolve: {
    alias: process.env.VITE_USE_LOCAL_AUTH_MOCK === 'true'
      ? {
          '@auth0/auth0-react': '/src/mocks/localAuth0.tsx',
        }
      : undefined,
  },
  plugins: [react(), tsconfigPaths()],
  server: { port: 3000 },
  build: { outDir: 'build' },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.*', 'src/types/**', 'src/**/*.d.ts'],
    },
  },
})
