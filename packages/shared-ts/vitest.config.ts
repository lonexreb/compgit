import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/aggregate.ts',
        'src/cache.ts',
        'src/storage.ts',
        'src/auth.ts',
        'src/time.ts',
        'src/github/graphql.ts',
        'src/github/errors.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 75,
      },
    },
  },
});
