/**
 * vite-plugin-figma-assets.ts
 *
 * Resolves Figma Make's proprietary `figma:asset/<hash>.ext` import scheme
 * to real local files in `src/assets/` during Vite builds.
 *
 * Figma Make generates code that uses `figma:asset/...` imports, which only
 * resolve inside Figma's own bundler. When the code is deployed to Vercel via
 * GitHub, Vite cannot resolve these imports and the build fails.
 *
 * This plugin intercepts those imports at the resolver stage and maps them to
 * the corresponding files in `src/assets/`, which Figma Make also writes the
 * raw asset files into. The result: Figma Make can push whatever it wants —
 * the build will always succeed.
 *
 * Usage: imported and registered in vite.config.ts (see that file).
 */

import type { Plugin } from 'vite'
import path from 'path'
import fs from 'fs'

const FIGMA_ASSET_PREFIX = 'figma:asset/'

export function figmaAssets(assetsDir?: string): Plugin {
  // Default to src/assets relative to the project root
  const resolvedAssetsDir = assetsDir ?? path.resolve(process.cwd(), 'src/assets')

  return {
    name: 'vite-plugin-figma-assets',

    // Run before other resolvers so we intercept figma:asset before Vite
    // tries (and fails) to resolve it as a real module path.
    enforce: 'pre',

    resolveId(source: string) {
      if (!source.startsWith(FIGMA_ASSET_PREFIX)) return null

      // Extract the filename portion: "figma:asset/abc123.png" → "abc123.png"
      const filename = source.slice(FIGMA_ASSET_PREFIX.length)
      const localPath = path.join(resolvedAssetsDir, filename)

      if (fs.existsSync(localPath)) {
        // Return the absolute local path — Vite will handle it as a normal asset
        return localPath
      }

      // Asset not found locally — warn but don't hard-fail so other imports
      // in the file can still be resolved. The missing asset will show as a
      // broken image at runtime, which is visible and debuggable.
      console.warn(
        `[figma-assets] Could not resolve "${source}" — ` +
        `expected file at: ${localPath}`
      )
      return null
    },
  }
}
