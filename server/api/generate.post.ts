import { z } from 'zod'
import type { ModelTask } from '~/types/model'

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
  const analysis = enhanceForTripo(params.prompt)
  console.log(`[PE] Original: "${params.prompt}" → Enhanced: "${analysis.enhancedPrompt}"`)
  console.log(`[PE] Category: ${analysis.category}, Style: ${analysis.style}`)

  // Create a task with Tripo API
  let taskId: string
  try {
    const taskData = await createTripoTask(analysis.enhancedPrompt, {
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
      const taskStatus = await getTripoTaskStatus(taskId)
      const statusStr = taskStatus.status as string
      // Tripo returns progress as a number (0-100) in the task data
      const tripoProgress = taskStatus.progress ?? parseProgress(statusStr)

      if (attempts === 1 || attempts % 5 === 0) {
        console.log(`[Tripo] Poll #${attempts}: status=${statusStr}, progress=${tripoProgress}`)
      }

      sendSSE({
        type: 'progress',
        progress: tripoProgress,
        status: statusStr,
      })

      if (statusStr === 'success') {
        isComplete = true
        const output = taskStatus.output || {}
        console.log(`[Tripo] Task completed! Output keys: ${Object.keys(output).join(', ')}`)
        console.log(`[Tripo] model URL: ${output.model}`)
        console.log(`[Tripo] pbr_model URL: ${output.pbr_model}`)
        console.log(`[Tripo] rendered_image URL: ${output.rendered_image}`)

        // Tripo returns model URLs in output.model (GLB) and output.pbr_model (PBR GLB)
        // Proxy through our server to avoid CORS issues with Tripo's CDN
        const rawModelUrl = output.pbr_model || output.model
        const modelUrl = rawModelUrl
          ? `/api/proxy-model?url=${encodeURIComponent(rawModelUrl)}`
          : undefined
        const thumbnailUrl = output.rendered_image
          ? `/api/proxy-model?url=${encodeURIComponent(output.rendered_image)}`
          : undefined

        console.log(`[Tripo] Proxied model URL: ${modelUrl}`)

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
        console.error(`[Tripo] Task ${statusStr}: ${JSON.stringify(taskStatus)}`)
        sendSSE({
          type: 'error',
          message: `Model generation ${statusStr}${taskStatus.message ? `: ${taskStatus.message}` : ''}`,
        })
      }
    }
    catch (error) {
      console.error(`[Tripo] Error polling task status (attempt ${attempts}):`, error)
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
  // Tripo status values: queued, running, success, failed, cancelled, banned
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
