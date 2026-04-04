import type { GalleryModel } from '~/types/model'

// Static model registry — works on all platforms (Vercel, local, etc.)
// Add new models here when you add .glb files to public/models/
const MODEL_REGISTRY: { file: string, category: string }[] = [
  { file: 'castle.glb', category: 'architecture' },
  { file: 'cat.glb', category: 'animal' },
  { file: 'chair.glb', category: 'furniture' },
  { file: 'cottage.glb', category: 'architecture' },
  { file: 'couch.glb', category: 'furniture' },
  { file: 'dragon.glb', category: 'animal' },
  { file: 'fireplace.glb', category: 'architecture' },
  { file: 'girl.glb', category: 'character' },
  { file: 'micar.glb', category: 'vehicle' },
  { file: 'pm.glb', category: 'character' },
  { file: 'portrait.glb', category: 'character' },
  { file: 'robot.glb', category: 'character' },
  { file: 'threecat.glb', category: 'animal' },
]

// Prettify filename into a display name
function prettifyName(filename: string): string {
  return filename
    .replace(/\.glb$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function getModels(): GalleryModel[] {
  return MODEL_REGISTRY.map((entry) => {
    const name = prettifyName(entry.file)
    return {
      id: `demo-${entry.file.replace(/\.[^.]+$/, '')}`,
      name,
      thumbnailUrl: `/models/${entry.file}`,
      modelUrl: `/models/${entry.file}`,
      author: '3DGenerator',
      likes: Math.floor(Math.random() * 800 + 100),
      category: entry.category,
    }
  })
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const category = query.category as string | undefined
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20))

  const allModels = getModels()
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
