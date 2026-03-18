import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { figmaAssets } from './vite-plugin-figma-assets'

export default defineConfig({
  plugins: [
    // Resolves Figma Make's proprietary figma:asset/... imports (and any
    // future Figma import schemes) to local files in src/assets/.
    // This makes Vercel builds bot-proof: Figma Make can push freely.
    // To update for a new Figma import scheme, see vite-plugin-figma-assets.ts.
    figmaAssets(),

    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    // Raise the chunk size warning threshold — the main bundle is large
    // due to the number of dashboard views. Code splitting is handled via
    // dynamic imports in page-router.tsx.
    chunkSizeWarningLimit: 2000,
  },
})
