import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Standalone Vitest config kept separate from `vite.config.ts` so the Laravel /
// Inertia / Wayfinder build plugins never run during unit tests. Only the React
// plugin and the `@` alias are needed to render components.
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        // jsdom-based `axe` accessibility audits are legitimately slow on a
        // cold run; raise the default 5s ceiling so the a11y suite is not
        // intermittently killed by a timeout.
        testTimeout: 30000,
        // Single shared setup file (jest-dom matchers + DOM cleanup between
        // renders). Covers both the Property 19 state test and the a11y audit.
        setupFiles: ['./resources/js/test/setup.ts'],
        // Matches every frontend test, including the `*.property.test.tsx`
        // naming used by the Property 19 suite (it still ends in `.test.tsx`).
        include: ['resources/js/**/*.test.{ts,tsx}'],
    },
});
