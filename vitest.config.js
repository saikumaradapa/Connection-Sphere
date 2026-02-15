import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['web/js/__tests__/**/*.test.js'],
  },
});
