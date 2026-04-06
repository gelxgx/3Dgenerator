import { Buffer } from 'node:buffer'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = query.url as string

  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing url parameter',
    })
  }

  // Only allow downloading from known CDN domains
  const allowedDomains = ['tripo3d.ai', 'tripo-data', 'amazonaws.com']
  const urlObj = new URL(url)
  const isAllowed = allowedDomains.some(d => urlObj.hostname.includes(d))

  if (!isAllowed) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Download not allowed from this domain',
    })
  }

  console.log(`[Download] Proxying: ${url}`)

  const response = await fetch(url)

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: `Failed to fetch model: ${response.statusText}`,
    })
  }

  const buffer = await response.arrayBuffer()
  const contentType = response.headers.get('content-type') || 'model/gltf-binary'

  setResponseHeader(event, 'Content-Type', contentType)
  setResponseHeader(event, 'Content-Disposition', 'attachment; filename="model.glb"')
  setResponseHeader(event, 'Content-Length', buffer.byteLength)

  return Buffer.from(buffer)
})
