import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Separate from vite.config.js so test-only settings (jsdom env, coverage scope)
// never leak into the production build config.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Scoped to only the files with genuine new/changed logic this session —
      // the rest of src/ has no tests yet and would make "100%" meaningless.
      include: [
        'src/components/Footer.jsx',
        'src/pages/PrivacyPage.jsx',
        'src/pages/AdminPanel.jsx',
        'src/pages/SteamGamePage.jsx',
        'src/utils/imageFallback.js',
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
