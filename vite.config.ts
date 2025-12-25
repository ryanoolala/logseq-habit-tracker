import { defineConfig, Plugin } from 'vite'
import logseqPlugin from 'vite-plugin-logseq'
import { copyFileSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

// Plugin to copy package.json and icon.svg to dist directory
function copyFilesPlugin(): Plugin {
  return {
    name: 'copy-files',
    writeBundle() {
      // Copy icon.svg
      try {
        copyFileSync(
          resolve(process.cwd(), 'icon.svg'),
          resolve(process.cwd(), 'dist', 'icon.svg')
        )
        console.log('✓ Copied icon.svg to dist/')
      } catch (err) {
        console.warn('Could not copy icon.svg:', err)
      }

      // Copy and modify package.json
      try {
        const packageJson = JSON.parse(
          readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8')
        )
        // Update the main field to point to index.js in the same directory
        packageJson.main = 'index.js'
        writeFileSync(
          resolve(process.cwd(), 'dist', 'package.json'),
          JSON.stringify(packageJson, null, 2)
        )
        console.log('✓ Copied package.json to dist/ (with updated main field)')
      } catch (err) {
        console.warn('Could not copy package.json:', err)
      }
    }
  }
}

export default defineConfig({
  plugins: [logseqPlugin(), copyFilesPlugin()],
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
