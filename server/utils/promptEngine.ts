/**
 * Prompt Engineering (PE) for 3D Model Generation
 *
 * Based on reverse-engineering Tripo's approach:
 * - Tripo auto-classifies prompts into category, style, project_name
 * - Tripo Studio uses two-step: text→image→3D for high-precision models
 * - The API text_to_model accepts free-form prompts directly
 *
 * This PE system enhances user prompts for better 3D model generation results,
 * both for Tripo API and for Codex (text→image→3D) fallback.
 */

// Categories based on Tripo's auto-classification
const CATEGORIES = [
  'creatures & animals',
  'characters & humanoids',
  'vehicles & transportation',
  'architecture & buildings',
  'furniture & interior',
  'weapons & tools',
  'food & beverage',
  'nature & environment',
  'electronics & gadgets',
  'fashion & accessories',
  'abstract & artistic',
  'mechanical & industrial',
] as const

const STYLES = [
  'realistic',
  'cartoon',
  'low-poly',
  'stylized',
  'anime',
  'voxel',
  'miniature',
  'sci-fi',
  'fantasy',
  'hand-painted',
] as const

export interface PromptAnalysis {
  originalPrompt: string
  enhancedPrompt: string
  category: string
  style: string
  projectName: string
  imagePrompt?: string // For text→image→3D pipeline
}

/**
 * Enhance a user prompt for Tripo's text_to_model API.
 * Tripo works best with clear, descriptive prompts that specify:
 * - What the object is
 * - Its style/aesthetic
 * - Key visual details
 * - Pose/orientation (for characters/creatures)
 */
export function enhanceForTripo(userPrompt: string): PromptAnalysis {
  const trimmed = userPrompt.trim()
  const lower = trimmed.toLowerCase()

  // Detect category
  const category = detectCategory(lower)

  // Detect style
  const style = detectStyle(lower)

  // Generate project name (simplified version)
  const projectName = generateProjectName(trimmed)

  // Enhance the prompt for Tripo
  // Tripo does well with concise, specific prompts. Don't over-engineer.
  let enhanced = trimmed

  // If the prompt is very short (< 20 chars), add helpful context
  if (trimmed.length < 20) {
    enhanced = addContextualDetail(trimmed, category, style)
  }

  return {
    originalPrompt: trimmed,
    enhancedPrompt: enhanced,
    category,
    style,
    projectName,
  }
}

/**
 * Generate an image prompt for Codex text→image→3D pipeline.
 * This creates a prompt optimized for generating a reference image
 * that can then be used to create a 3D model.
 *
 * Key principles:
 * - Single object, centered, clean background
 * - 3/4 view angle for maximum 3D information
 * - Clean lighting, no complex scenes
 * - Specify materials and textures
 */
export function enhanceForCodexImage(userPrompt: string): PromptAnalysis {
  const analysis = enhanceForTripo(userPrompt)

  // Create an image prompt specifically designed for 3D reconstruction
  const imagePrompt = buildImagePrompt(analysis)

  return {
    ...analysis,
    imagePrompt,
  }
}

function detectCategory(lower: string): string {
  const categoryKeywords: Record<string, string[]> = {
    'creatures & animals': ['cat', 'dog', 'animal', 'creature', 'dragon', 'bird', 'fish', 'monster', 'pet', 'wolf', 'bear', 'rabbit', 'fox', 'dinosaur', 'horse', 'lion', 'tiger', 'elephant', 'snake', 'insect'],
    'characters & humanoids': ['character', 'person', 'human', 'warrior', 'knight', 'wizard', 'robot', 'android', 'soldier', 'hero', 'villain', 'girl', 'boy', 'man', 'woman', 'elf', 'dwarf', 'samurai', 'ninja'],
    'vehicles & transportation': ['car', 'vehicle', 'truck', 'ship', 'airplane', 'plane', 'boat', 'motorcycle', 'bike', 'tank', 'train', 'spaceship', 'helicopter', 'bus'],
    'architecture & buildings': ['house', 'building', 'castle', 'tower', 'temple', 'church', 'bridge', 'gate', 'wall', 'ruins', 'cabin', 'mansion', 'palace'],
    'furniture & interior': ['chair', 'table', 'desk', 'lamp', 'sofa', 'bed', 'shelf', 'cabinet', 'bookcase', 'stool', 'bench', 'couch'],
    'weapons & tools': ['sword', 'weapon', 'gun', 'axe', 'hammer', 'shield', 'bow', 'staff', 'wand', 'dagger', 'spear', 'tool', 'wrench'],
    'food & beverage': ['food', 'cake', 'fruit', 'drink', 'cup', 'bottle', 'pizza', 'burger', 'coffee', 'tea', 'bread', 'candy'],
    'nature & environment': ['tree', 'rock', 'mountain', 'flower', 'plant', 'mushroom', 'crystal', 'island', 'forest', 'garden', 'grass', 'stone'],
    'electronics & gadgets': ['phone', 'computer', 'laptop', 'camera', 'tv', 'monitor', 'keyboard', 'mouse', 'headphone', 'speaker', 'console', 'gamepad'],
    'fashion & accessories': ['hat', 'shoe', 'boot', 'ring', 'necklace', 'crown', 'helmet', 'mask', 'glasses', 'bag', 'backpack', 'armor'],
  }

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category
    }
  }

  return 'abstract & artistic'
}

function detectStyle(lower: string): string {
  const styleKeywords: Record<string, string[]> = {
    'cartoon': ['cartoon', 'cute', 'chibi', 'toon', 'funny', 'playful', 'adorable', 'kawaii'],
    'realistic': ['realistic', 'real', 'photorealistic', 'detailed', 'lifelike', 'natural'],
    'low-poly': ['low-poly', 'lowpoly', 'low poly', 'polygon', 'geometric', 'minimalist'],
    'anime': ['anime', 'manga', 'japanese', 'otaku'],
    'voxel': ['voxel', 'pixel', 'blocky', 'minecraft'],
    'sci-fi': ['sci-fi', 'scifi', 'futuristic', 'cyberpunk', 'space', 'mech', 'neon'],
    'fantasy': ['fantasy', 'magical', 'enchanted', 'mythical', 'medieval', 'ancient'],
    'stylized': ['stylized', 'artistic', 'painterly', 'illustrated'],
    'miniature': ['miniature', 'tiny', 'diorama', 'figurine', 'tabletop'],
    'hand-painted': ['hand-painted', 'handpainted', 'watercolor', 'painted'],
  }

  for (const [style, keywords] of Object.entries(styleKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return style
    }
  }

  return 'stylized'
}

function generateProjectName(prompt: string): string {
  // Generate a short project name from the prompt (like Tripo does)
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .slice(0, 5)
    .join(' ')
    .trim()
    + ' 3d model'
}

function addContextualDetail(prompt: string, category: string, style: string): string {
  // For very short prompts, add helpful detail
  const styleDescriptor = style !== 'stylized' ? `, ${style} style` : ''
  return `${prompt}${styleDescriptor}, high quality 3D model, clean geometry`
}

function buildImagePrompt(analysis: PromptAnalysis): string {
  // Create an image generation prompt optimized for 3D reconstruction
  const parts: string[] = []

  // Main subject
  parts.push(analysis.enhancedPrompt)

  // 3D-friendly image requirements
  parts.push('3/4 view angle')
  parts.push('single object centered')
  parts.push('clean white background')
  parts.push('soft studio lighting')
  parts.push('high detail')

  // Style-specific additions
  if (analysis.style === 'cartoon' || analysis.style === 'anime') {
    parts.push('solid colors')
    parts.push('clean edges')
  }
  else if (analysis.style === 'realistic') {
    parts.push('PBR materials')
    parts.push('physically based textures')
  }

  // Category-specific pose/orientation
  if (analysis.category === 'creatures & animals' || analysis.category === 'characters & humanoids') {
    parts.push('full body visible')
    parts.push('standing pose')
  }
  else if (analysis.category === 'vehicles & transportation') {
    parts.push('full vehicle visible')
    parts.push('slight above perspective')
  }

  return parts.join(', ')
}
