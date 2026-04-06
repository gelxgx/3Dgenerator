import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

// Known model metadata — category & faceAngle overrides for existing files
const MODEL_META: Record<string, { category: string, faceAngle?: number }> = {
  'castle.glb': { category: 'architecture', faceAngle: 0 },
  'cat.glb': { category: 'animal', faceAngle: 180 },
  'chair.glb': { category: 'furniture', faceAngle: 180 },
  'cottage.glb': { category: 'architecture', faceAngle: 135 },
  'couch.glb': { category: 'furniture', faceAngle: 0 },
  'dragon.glb': { category: 'animal', faceAngle: 180 },
  'fireplace.glb': { category: 'architecture', faceAngle: 0 },
  'girl.glb': { category: 'character', faceAngle: 180 },
  'micar.glb': { category: 'vehicle', faceAngle: 135 },
  'pm.glb': { category: 'character', faceAngle: 180 },
  'portrait.glb': { category: 'character', faceAngle: 180 },
  'robot.glb': { category: 'character', faceAngle: 180 },
  'threecat.glb': { category: 'animal', faceAngle: 180 },
  'threenewcat.glb': { category: 'animal', faceAngle: 180 },
  'yeye.glb': { category: 'character', faceAngle: 180 },
}

function prettifyName(filename: string): string {
  return filename
    .replace(/\.glb$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

// Stable "random" likes based on filename hash so they don't change on every request
function stableLikes(filename: string): number {
  let hash = 0
  for (let i = 0; i < filename.length; i++)
    hash = ((hash << 5) - hash + filename.charCodeAt(i)) | 0
  return Math.abs(hash % 700) + 100
}

function scanModelsDir(): string[] {
  try {
    const modelsDir = join(process.cwd(), 'public', 'models')
    return readdirSync(modelsDir)
      .filter(f => f.toLowerCase().endsWith('.glb'))
      .sort()
  }
  catch {
    return Object.keys(MODEL_META)
  }
}

function getModels(): GalleryModel[] {
  const files = scanModelsDir()
  return files.map((file) => {
    const meta = MODEL_META[file] || { category: 'props' }
    const name = prettifyName(file)
    return {
      id: `demo-${file.replace(/\.[^.]+$/, '')}`,
      name,
      thumbnailUrl: `/models/${file}`,
      modelUrl: `/models/${file}`,
      author: '3DGenerator',
      likes: stableLikes(file),
      category: meta.category,
      faceAngle: meta.faceAngle ?? 0,
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
