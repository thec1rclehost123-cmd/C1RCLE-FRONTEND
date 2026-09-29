import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // src/types.ts is a pure type declarations module — it emits no runtime
      // code (v8 would report it as 0% no matter what), so its correctness is
      // enforced by `tsc` in typecheck, not by statement coverage.
      // src/schemas.ts is a pure re-export barrel: vite/esbuild statically
      // links `export {…} from` bindings, so v8 sees zero executable
      // statements in it either. Same rationale as the src/index.ts exclusion.
      exclude: ['src/**/*.test.ts', 'src/index.ts', 'src/types.ts', 'src/schemas.ts'],
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
    },
  },
});
