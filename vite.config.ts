import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        today: resolve(import.meta.dirname, 'index.html'),
        rotation: resolve(import.meta.dirname, 'rotation.html'),
        fractals: resolve(import.meta.dirname, 'fractals.html')
      }
    }
  }
});
