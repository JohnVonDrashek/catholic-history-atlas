import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        'dist/',
        '.eslintrc.cjs',
        'src/data/**/index.ts', // Exclude data index files (just imports)
        'src/types/**', // Exclude type definitions
        'src/main.tsx', // Exclude entry point
      ],
      include: ['src/**/*.{ts,tsx}'],
      all: true,
      lines: 60,
      functions: 50,
      branches: 50,
      statements: 60,
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
