import { defineConfig } from 'vite'
import logseqPlugin from 'vite-plugin-logseq'

export default defineConfig({
  plugins: [logseqPlugin()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      formats: ['iife'],
      name: 'logseqHabitTracker',
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['@logseq/libs'],
      output: {
        globals: {
          '@logseq/libs': 'logseq',
        },
      },
    },
  },
})
