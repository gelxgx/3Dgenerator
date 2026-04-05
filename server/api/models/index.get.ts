import type { GalleryModel } from '~/types/model'

// Static model registry — works on all platforms (Vercel, local, etc.)
// Add new models here when you add .glb files to public/models/
// faceAngle: Y 轴旋转角度（度），让模型正面朝向相机
const MODEL_REGISTRY: { file: string, category: string, faceAngle?: number }[] = [
  { file: 'castle.glb', category: 'architecture', faceAngle: 0 },
  { file: 'cat.glb', category: 'animal', faceAngle: 180 },
  { file: 'chair.glb', category: 'furniture', faceAngle: 180 },
  { file: 'cottage.glb', category: 'architecture', faceAngle: 135 },
  { file: 'couch.glb', category: 'furniture', faceAngle: 0 },
  { file: 'dragon.glb', category: 'animal', faceAngle: 180 },
  { file: 'fireplace.glb', category: 'architecture', faceAngle: 0 },
  { file: 'girl.glb', category: 'character', faceAngle: 180 },
  { file: 'micar.glb', category: 'vehicle', faceAngle: 135 },
  { file: 'pm.glb', category: 'character', faceAngle: 180 },
  { file: 'portrait.glb', category: 'character', faceAngle: 180 },
  { file: 'robot.glb', category: 'character', faceAngle: 180 },
  { file: 'threecat.glb', category: 'animal', faceAngle: 180 },
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
      faceAngle: entry.faceAngle ?? 0,
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
