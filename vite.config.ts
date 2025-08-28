import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { ConfigEnv } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import type { ServerOptions as HttpsServerOptions } from 'node:https';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd());
  const enableHttps = env.VITE_HTTPS === 'true';

  const getHttpsConfig = (): HttpsServerOptions | undefined => {
    if (!enableHttps) return undefined;
    const certPath = path.resolve(__dirname, 'certs', 'dev.crt');
    const keyPath = path.resolve(__dirname, 'certs', 'dev.key');
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      return {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
      } as HttpsServerOptions;
    }
    return undefined;
  };

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // HTTPS is only enabled locally when VITE_HTTPS=true and certs exist
      host: env.VITE_DEV_HOST || false,
      https: getHttpsConfig(),
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
        },
      },
    },
    // Ensure vite preview also stays HTTP unless explicitly enabled
    preview: {
      https: getHttpsConfig(),
      host: env.VITE_DEV_HOST || false,
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
