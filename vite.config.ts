import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

/**
 * GitHub Pages doesn't rewrite unknown paths to index.html. Copying the built
 * entry point to 404.html keeps client-side routes working on a project site.
 */
function githubPagesFallback(): Plugin {
  return {
    name: 'edueines-github-pages-fallback',
    apply: 'build',
    closeBundle() {
      const dist = path.join(root, 'dist')
      const index = path.join(dist, 'index.html')
      if (fs.existsSync(index)) {
        fs.copyFileSync(index, path.join(dist, '404.html'))
      }
      fs.writeFileSync(path.join(dist, '.nojekyll'), '')
    },
  }
}

const firebaseSideEffect = (id: string) => id.includes('firebase')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '')

  return {
    base: env.VITE_BASE_PATH || '/',
    optimizeDeps: {
      rolldownOptions: {
        treeshake: {
          moduleSideEffects: firebaseSideEffect,
        },
      },
    },
    build: {
      target: 'es2022',
      sourcemap: false,
      rollupOptions: {
        treeshake: {
          moduleSideEffects: firebaseSideEffect,
        },
      },
    },
    plugins: [react(), tailwindcss(), githubPagesFallback()],
    resolve: {
      dedupe: ['firebase', 'firebase/app', 'firebase/auth', 'firebase/firestore', '@firebase/app', '@firebase/firestore', '@firebase/auth'],
      alias: {
        '@': path.join(root, 'src'),
      },
    },
  }
})