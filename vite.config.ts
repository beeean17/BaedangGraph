import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Allow Firebase auth popups to close without COOP warnings in dev
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
});
