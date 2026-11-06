import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: command === 'build' ? './' : '/',
    plugins: [
      {
        name: 'serve-ort-wasm-static',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const cleanUrl = req.url?.split('?')[0] ?? '';
            if (cleanUrl.startsWith('/ort/')) {
              const filePath = path.join(process.cwd(), 'public', cleanUrl);
              if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                if (cleanUrl.endsWith('.mjs') || cleanUrl.endsWith('.js')) {
                  res.setHeader('Content-Type', 'application/javascript');
                } else if (cleanUrl.endsWith('.wasm')) {
                  res.setHeader('Content-Type', 'application/wasm');
                }
                fs.createReadStream(filePath).pipe(res);
                return;
              }
            }
            next();
          });
        },
      },
      react(),
      tailwindcss(),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(
        env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ''
      ),
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});
