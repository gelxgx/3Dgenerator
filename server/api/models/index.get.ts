import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import type { GalleryModel } from '~/types/model'

// Category guesses based on filename keywords
function guessCategory(name: string): string {
  const n = name.toLowerCase()
  const map: Record<string, string[]> = {
    character: ['girl', 'boy', 'man', 'woman', 'portrait', 'soldier', 'knight', 'warrior', 'wizard', 'ninja', 'samurai', 'person', 'pm'],
    animal: ['cat', 'dog', 'dragon', 'bird', 'fish', 'fox', 'wolf', 'bear', 'rabbit', 'horse', 'threecat'],
    vehicle: ['car', 'truck', 'bike', 'ship', 'plane', 'tank', 'micar'],
    architecture: ['castle', 'cottage', 'house', 'tower', 'temple', 'bridge', 'fireplace'],
    furniture: ['chair', 'couch', 'table', 'desk', 'sofa', 'bed', 'shelf', 'lamp'],
    weapon: ['sword', 'gun', 'axe', 'bow', 'shield', 'staff'],
  }
  for (const [category, keywords] of Object.entries(map)) {
    if (keywords.some(kw => n.includes(kw))) return category
  }
  return 'props'
}

// Prettify filename into a display name
function prettifyName(filename: string): string {
  return filename
    .replace(/\.glb$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

// Scan public/models at startup, cache the result
let cachedModels: GalleryModel[] | null = null

function scanModels(): GalleryModel[] {
  if (cachedModels) return cachedModels

  try {
    // In Nuxt, public/ is served as static. On the server, resolve to the actual directory.
    // Try multiple possible paths (dev vs production)
    const possiblePaths = [
      resolve(process.cwd(), 'public/models'),
      resolve(process.cwd(), '.output/public/models'),
    ]

    let files: string[] = []
    for (const dir of possiblePaths) {
      try {
        files = readdirSync(dir)
        if (files.length > 0) break
      }
      catch { /* try next */ }
    }

    cachedModels = files
      .filter(f => f.endsWith('.glb') || f.endsWith('.gltf'))
      .map((filename, index) => {
        const name = prettifyName(filename)
        const category = guessCategory(filename)
        return {
          id: `demo-${filename.replace(/\.[^.]+$/, '')}`,
          name,
          thumbnailUrl: `/models/${filename}`,
          modelUrl: `/models/${filename}`,
          author: '3DGenerator',
          likes: Math.floor(Math.random() * 800 + 100), // random for display
          category,
        }
      })

    console.log(`[Models] Scanned ${cachedModels.length} models from public/models/`)
    return cachedModels
  }
  catch (err) {
    console.error('[Models] Failed to scan public/models:', err)
    return []
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const category = query.category as string | undefined
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20))
  const refresh = query.refresh === 'true'

  // Allow cache busting
  if (refresh) cachedModels = null

  const allModels = scanModels()
  let filtered = allModels

  if (category && category !== 'all') {
    filtered = allModels.filter(m => m.category === category)
  }

  const total = filtered.length
  const start = (page - 1) * limit
  const items = filtered.slice(start, start + limit)

  return {
    items,
    total,
    page,
    limit,
  }
})
