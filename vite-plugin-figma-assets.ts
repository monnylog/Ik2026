/**
 * vite-plugin-figma-assets.ts
 *
 * Resolves Figma Make's proprietary asset import schemes to real local files
 * in `src/assets/` during Vite builds.
 *
 * Figma Make generates code using `figma:asset/<hash>.ext` imports (and
 * potentially other schemes in future versions) that only resolve inside
 * Figma's own bundler. When deployed to Vercel via GitHub, Vite cannot
 * resolve these imports and the build fails.
 *
 * This plugin intercepts those imports at the resolver stage and maps them
 * to the corresponding hash-named files in `src/assets/`, which Figma Make
 * also writes the raw asset files into. The result: Figma Make can push
 * whatever import scheme it uses — the build will always succeed.
 *
 * --- UPDATING THIS PLUGIN ---
 * If Figma changes its import scheme, add the new prefix to FIGMA_PREFIXES:
 *
 *   const FIGMA_PREFIXES = ['figma:asset/', 'figma://asset/', '@figma/asset/']
 *
 * If Figma changes where it writes asset files, pass the new path to figmaAssets():
 *
 *   figmaAssets(path.resolve(__dirname, './src/figma-assets'))
 *
 * That's it. No other changes needed.
 */

import type { Plugin } from 'vite'
import path from 'path'
import fs from 'fs'

/**
 * All known Figma Make asset import prefixes.
 * Add new ones here if Figma changes their bundler scheme.
 */
const FIGMA_PREFIXES = [
  'figma:asset/',
  'figma://asset/',
  '@figma/asset/',
]

/**
 * Strips a known Figma prefix from an import string.
 * Returns the filename portion, or null if no prefix matched.
 */
function stripFigmaPrefix(source: string): string | null {
  for (const prefix of FIGMA_PREFIXES) {
    if (source.startsWith(prefix)) {
      return source.slice(prefix.length)
    }
  }
  return null
}

export interface FigmaAssetsOptions {
  /**
   * Absolute path to the directory containing Figma's hash-named asset files.
   * Defaults to `<projectRoot>/src/assets`.
   */
  assetsDir?: string
  /**
   * Whether to throw a build error when a figma:asset import cannot be
   * resolved locally. Defaults to false (warn only) to avoid hard-failing
   * on assets that are referenced but not yet exported from Figma.
   */
  strict?: boolean
}

export function figmaAssets(options: FigmaAssetsOptions = {}): Plugin {
  const resolvedAssetsDir =
    options.assetsDir ?? path.resolve(process.cwd(), 'src/assets')
  const strict = options.strict ?? false

  return {
    name: 'vite-plugin-figma-assets',

    // Run before other resolvers so we intercept figma:asset before Vite
    // tries (and fails) to resolve it as a real module path.
    enforce: 'pre',

    resolveId(source: string) {
      const filename = stripFigmaPrefix(source)
      if (filename === null) return null

      const localPath = path.join(resolvedAssetsDir, filename)

      if (fs.existsSync(localPath)) {
        return localPath
      }

      const message =
        `[figma-assets] Could not resolve "${source}" — ` +
        `expected file at: ${localPath}\n` +
        `  Export the asset from Figma to add it to src/assets/.`

      if (strict) {
        this.error(message)
      } else {
        this.warn(message)
      }

      return null
    },
  }
}
