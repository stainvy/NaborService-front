import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // simple-peer (WebRTC) tire `readable-stream` qui importe des modules Node
    // (events/stream/util/buffer) + `global` : sans ces polyfills navigateur,
    // Vite les externalise en modules vides et `new Peer()` casse à l'exécution.
    nodePolyfills({
      include: ['events', 'stream', 'util', 'buffer'],
      globals: { global: true, process: true, Buffer: true },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
