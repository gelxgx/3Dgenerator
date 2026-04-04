// Valid Tripo model versions (cheapest first for quota conservation)
const TRIPO_MODEL_VERSIONS: Record<string, string> = {
  'v2.0': 'v2.0-20240919',
  'v2.5': 'v2.5-20250123',
  'v3.0': 'v3.0-20250812',
  'v3.1': 'v3.1-20260211',
  'turbo': 'Turbo-v1.0-20250506',
  'p1': 'P1-20260311',
}

function resolveModelVersion(version?: string): string {
  if (!version) return TRIPO_MODEL_VERSIONS['v2.0']
  // If already a full version string, use as-is
  if (version.includes('-') && version.length > 5) return version
  // Map short names to full versions
  return TRIPO_MODEL_VERSIONS[version] || TRIPO_MODEL_VERSIONS['v2.0']
}

export async function createTripoTask(
  prompt: string,
  options: {
    quality?: 'standard' | 'ultra'
    modelVersion?: string
  } = {},
) {
  const config = useRuntimeConfig()
  const apiKey = config.tripoApiKey as string
  const apiBase = config.tripoApiBase as string

  if (!apiKey) {
    throw new Error('NUXT_TRIPO_API_KEY is not configured')
  }

  const resolvedVersion = resolveModelVersion(options.modelVersion)
  console.log(`[Tripo] Creating task: prompt="${prompt.slice(0, 50)}...", model_version=${resolvedVersion}`)

  const response = await $fetch<{ code: number, data: any }>(`${apiBase}/v2/openapi/task`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      type: 'text_to_model',
      prompt,
      model_version: resolvedVersion,
    },
  })

  if (response.code !== 0) {
    throw new Error(`Tripo API error: ${JSON.stringify(response)}`)
  }

  console.log(`[Tripo] Task created: ${JSON.stringify(response.data)}`)
  return response.data
}

export async function getTripoTaskStatus(taskId: string) {
  const config = useRuntimeConfig()
  const apiKey = config.tripoApiKey as string
  const apiBase = config.tripoApiBase as string

  const response = await $fetch<{ code: number, data: any }>(`${apiBase}/v2/openapi/task/${taskId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (response.code !== 0) {
    throw new Error(`Failed to get task status: ${JSON.stringify(response)}`)
  }

  return response.data
}
