export interface ModelTask {
  id: string
  status: 'queued' | 'generating' | 'completed' | 'failed'
  progress: number
  prompt: string
  quality: 'standard' | 'ultra'
  modelUrl?: string
  thumbnailUrl?: string
  faces?: number
  vertices?: number
  createdAt: string
}

export interface GenerateParams {
  prompt: string
  quality: 'standard' | 'ultra'
  textureEnabled: boolean
  modelVersion: string
}

export interface GalleryModel {
  id: string
  name: string
  thumbnailUrl: string
  modelUrl?: string
  author: string
  likes: number
  category: string
  /** 模型 Y 轴旋转角度（度），用于调整正面朝向。默认 0 */
  faceAngle?: number
}
