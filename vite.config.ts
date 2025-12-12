import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    // 'base' must be './' for Electron to load assets from the file system
    base: './',
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    server: {
      port: 5173,
      strictPort: true,
    }
  };
});