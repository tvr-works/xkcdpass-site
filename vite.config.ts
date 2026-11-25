import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'privacy-dev-entry',
      apply: 'serve',
      transformIndexHtml(_html, { filename }) {
        if (filename === resolve('privacy.html')) {
          return [
            {
              tag: 'script',
              attrs: { type: 'module', src: '/src/entry-privacy-dev.tsx' },
              injectTo: 'body',
            },
          ];
        }
      },
    },
  ],
  build: isSsrBuild
    ? undefined
    : { rolldownOptions: { input: [resolve('index.html'), resolve('privacy.html')] } },
  resolve: { alias: { '@': resolve(import.meta.dirname, 'src') } },
  server: { host: '127.0.0.1' },
}));
