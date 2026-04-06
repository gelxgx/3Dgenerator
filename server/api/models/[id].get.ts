export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing model ID',
    })
  }

  try {
    const taskData = await get3DTaskStatus(id)
    const statusStr = taskData.status as string
    const output = taskData.output || {}

    // Proxy CDN URLs through our server to avoid CORS issues
    const rawModelUrl = output.pbr_model || output.model
    const rawThumbnailUrl = output.rendered_image

    const model: ModelTask = {
      id,
      status: statusStr === 'success' ? 'completed' : statusStr === 'failed' ? 'failed' : 'generating',
      progress: statusStr === 'success' ? 100 : 0,
      prompt: taskData.prompt || '',
      quality: 'standard',
      modelUrl: rawModelUrl ? `/api/proxy-model?url=${encodeURIComponent(rawModelUrl)}` : undefined,
      thumbnailUrl: rawThumbnailUrl ? `/api/proxy-model?url=${encodeURIComponent(rawThumbnailUrl)}` : undefined,
      faces: output.face_count || 0,
      vertices: output.vertex_count || 0,
      createdAt: taskData.create_time
        ? (typeof taskData.create_time === 'number'
            ? new Date(taskData.create_time * 1000).toISOString()
            : taskData.create_time)
        : new Date().toISOString(),
    }

    return model
  }
  catch {
    throw createError({
      statusCode: 404,
      statusMessage: `Model not found: ${id}`,
    })
  }
})
