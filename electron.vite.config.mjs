import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    build: {
      lib: {
        entry: 'electron/main.ts',
        formats: ['cjs'],
      },
      outDir: 'out/main',
      rollupOptions: {
        output: {
          entryFileNames: 'main.cjs',
        },
      },
    },
  },
  preload: {
    build: {
      lib: {
        entry: 'electron/preload.ts',
        formats: ['cjs'],
      },
      outDir: 'out/preload',
      rollupOptions: {
        output: {
          entryFileNames: 'preload.cjs',
        },
      },
    },
  },
  renderer: {
    root: '.',
    plugins: [react()],
    build: {
      rollupOptions: {
        input: 'index.html',
      },
    },
  },
});
