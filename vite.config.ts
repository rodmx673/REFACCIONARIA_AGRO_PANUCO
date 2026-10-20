import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        // Redirigir todas las llamadas de Firebase a nuestro Stub para que Vercel no truene
        'firebase/app': path.resolve(__dirname, './src/lib/firebase.ts'),
        'firebase/auth': path.resolve(__dirname, './src/lib/firebase.ts'),
        'firebase/firestore': path.resolve(__dirname, './src/lib/firebase.ts'),
      },
    },
    optimizeDeps: {
      include: [],
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      chunkSizeWarningLimit: 1500,
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});