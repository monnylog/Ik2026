import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { figmaAssets } from './vite-plugin-figma-assets'

export default defineConfig({
  plugins: [
    // Resolves Figma Make's proprietary figma:asset/... imports to local
    // files in src/assets/. This makes Vercel builds bot-proof: Figma Make
    // can push figma:asset imports freely and they will always resolve.
    // Must run before React and Tailwind plugins (enforce: 'pre' in plugin).
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
})
