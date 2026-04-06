import { Buffer } from 'node:buffer'

/**
 * Proxies external 3D model files through this server so the browser can load them
 * without cross-origin restrictions (e.g. GLB/GLTF for Three.js).
 *
 * Usage: /api/proxy-model?url=<encoded-url>
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = query.url as string

  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing url parameter',
    })
  }

  // Security: only allow proxying from known CDN domains
  let urlObj: URL
  try {
    urlObj = new URL(url)
  }
  catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid URL',
    })
  }

  const allowedDomains = ['tripo3d.ai', 'tripo-data', 'amazonaws.com', 'cloudfront.net']
  const isAllowed = allowedDomains.some(d => urlObj.hostname.includes(d))

  if (!isAllowed) {
    throw createError({
      statusCode: 403,
      statusMessage: `Domain not allowed: ${urlObj.hostname}`,
    })
  }

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Upstream error: ${response.statusText}`,
      })
    }

    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    // Set appropriate headers for GLB/GLTF files
    setResponseHeader(event, 'Content-Type', contentType)
    setResponseHeader(event, 'Content-Length', buffer.byteLength)
    setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
    setResponseHeader(event, 'Cache-Control', 'public, max-age=86400') // Cache 24h

    return Buffer.from(buffer)
  }
  catch (err: any) {
    if (err.statusCode)
      throw err
    console.error('[Proxy] Failed to fetch model:', err.message)
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to proxy model: ${err.message}`,
    })
  }
})
