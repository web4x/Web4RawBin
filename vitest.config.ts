import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/vitest/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 15000,
    fileParallelism: false,
  },
});
