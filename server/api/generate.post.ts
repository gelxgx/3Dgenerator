import { z } from 'zod'

const GenerateSchema = z.object({
  prompt: z.string().min(1).max(1000),
  quality: z.enum(['standard', 'ultra']).default('standard'),
  textureEnabled: z.boolean().default(true),
  modelVersion: z.string().default('v2.0'),
})

export default defineEventHandler(async (event) => {
  // Parse and validate request body
  const body = await readBody(event)

  let params
  try {
    params = GenerateSchema.parse(body)
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid parameters',
        data: error.errors,
      })
    }
    throw error
  }

  // Set SSE headers
  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')

  const res = event.node.res

  function sendSSE(data: Record<string, any>) {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }
  }

  // Enhance prompt using PE system
  const analysis = enhancePrompt(params.prompt)
  console.log(`[PE] Original: "${params.prompt}" → Enhanced: "${analysis.enhancedPrompt}"`)
  console.log(`[PE] Category: ${analysis.category}, Style: ${analysis.style}`)

  // Create a generation task
  let taskId: string
  try {
    const taskData = await create3DTask(analysis.enhancedPrompt, {
      quality: params.quality,
      modelVersion: params.modelVersion,
    })
    taskId = taskData.task_id || taskData.id
  }
  catch (error) {
    sendSSE({
      type: 'error',
      message: error instanceof Error ? error.message : 'Failed to create task',
    })
    res.end()
    return
  }

  // Send initial response
  sendSSE({ type: 'started', taskId })

  // Poll for progress
  let isComplete = false
  let attempts = 0
  const maxAttempts = 600 // 10 minutes with 1 second polling

  while (!isComplete && attempts < maxAttempts) {
    attempts++

    try {
      const taskStatus = await get3DTaskStatus(taskId)
      const statusStr = taskStatus.status as string
      // Progress is returned as a number (0-100) in the task data
      const apiProgress = taskStatus.progress ?? parseProgress(statusStr)

      if (attempts === 1 || attempts % 5 === 0) {
        console.log(`[3DGen] Poll #${attempts}: status=${statusStr}, progress=${apiProgress}`)
      }

      sendSSE({
        type: 'progress',
        progress: apiProgress,
        status: statusStr,
      })

      if (statusStr === 'success') {
        isComplete = true
        const output = taskStatus.output || {}
        console.log(`[3DGen] Task completed! Output keys: ${Object.keys(output).join(', ')}`)
        console.log(`[3DGen] model URL: ${output.model}`)
        console.log(`[3DGen] pbr_model URL: ${output.pbr_model}`)
        console.log(`[3DGen] rendered_image URL: ${output.rendered_image}`)

        // Model URLs are in output.model (GLB) and output.pbr_model (PBR GLB)
        // Proxy through our server to avoid CORS issues
        const rawModelUrl = output.pbr_model || output.model
        const modelUrl = rawModelUrl
          ? `/api/proxy-model?url=${encodeURIComponent(rawModelUrl)}`
          : undefined
        const thumbnailUrl = output.rendered_image
          ? `/api/proxy-model?url=${encodeURIComponent(output.rendered_image)}`
          : undefined

        console.log(`[3DGen] Proxied model URL: ${modelUrl}`)

        const modelTask: ModelTask = {
          id: taskId,
          status: 'completed',
          progress: 100,
          prompt: params.prompt,
          quality: params.quality,
          modelUrl,
          thumbnailUrl,
          faces: output.face_count || 0,
          vertices: output.vertex_count || 0,
          createdAt: new Date().toISOString(),
        }

        sendSSE({ type: 'complete', task: modelTask })
      }
      else if (statusStr === 'failed' || statusStr === 'cancelled' || statusStr === 'banned') {
        isComplete = true
        console.error(`[3DGen] Task ${statusStr}: ${JSON.stringify(taskStatus)}`)
        sendSSE({
          type: 'error',
          message: `Model generation ${statusStr}${taskStatus.message ? `: ${taskStatus.message}` : ''}`,
        })
      }
    }
    catch (error) {
      console.error(`[3DGen] Error polling task status (attempt ${attempts}):`, error)
      // Continue polling on transient error
    }

    if (!isComplete) {
      // Poll every 2s for first 30 attempts, then every 3s
      const delay = attempts < 30 ? 2000 : 3000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  if (!isComplete) {
    sendSSE({ type: 'error', message: 'Generation timeout' })
  }

  res.end()
})

function parseProgress(status: string): number {
  // Status values: queued, running, success, failed, cancelled, banned
  const progressMap: Record<string, number> = {
    queued: 5,
    running: 50,
    success: 100,
    failed: 0,
    cancelled: 0,
    banned: 0,
  }
  return progressMap[status] ?? 10
}
