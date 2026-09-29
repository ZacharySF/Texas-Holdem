import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import mdx from '@mdx-js/rollup';
export default defineConfig({
  base: './',
  // DOM component tests mount the same Svelte client components as the browser.
  resolve: { conditions: ['browser'] },
  plugins: [
    svelte(),
    { enforce: 'pre', ...mdx() },
    react({ include: /\.(mdx|jsx|tsx)$/ }),
  ],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    testTimeout: 180000,
    coverage: {
      provider: 'v8',
      include: ['src/engine/**/*.ts'],
      exclude: ['src/engine/**/*.test.ts'],
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
});
