/**
 * Generate sample GLB model files using raw binary GLB format
 * No browser APIs needed - pure Node.js
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outputDir = join(__dirname, '..', 'public', 'models')
mkdirSync(outputDir, { recursive: true })

/**
 * Build a valid GLB (Binary glTF 2.0) file from vertices, indices, and a color
 */
function buildGLB(vertices, indices, baseColor = [0.8, 0.8, 0.8, 1.0]) {
  // Compute bounding box
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < vertices.length; i += 3) {
    for (let j = 0; j < 3; j++) {
      min[j] = Math.min(min[j], vertices[i + j])
      max[j] = Math.max(max[j], vertices[i + j])
    }
  }

  const vertexCount = vertices.length / 3
  const indexCount = indices.length
  const vertexData = new Float32Array(vertices)
  const indexData = indexCount > 65535 ? new Uint32Array(indices) : new Uint16Array(indices)
  const indexComponentType = indexCount > 65535 ? 5125 : 5123

  const vertexBytes = vertexData.buffer.byteLength
  const indexBytes = indexData.buffer.byteLength
  // Pad index bytes to 4-byte alignment
  const indexBytesPadded = Math.ceil(indexBytes / 4) * 4
  const totalBinBytes = vertexBytes + indexBytesPadded

  const gltfJson = {
    asset: { version: '2.0', generator: '3DGenerator Sample' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{
      primitives: [{
        attributes: { POSITION: 0 },
        indices: 1,
        material: 0,
      }],
    }],
    materials: [{
      pbrMetallicRoughness: {
        baseColorFactor: baseColor,
        metallicFactor: 0.3,
        roughnessFactor: 0.6,
      },
    }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126, // FLOAT
        count: vertexCount,
        type: 'VEC3',
        min,
        max,
      },
      {
        bufferView: 1,
        componentType: indexComponentType,
        count: indexCount,
        type: 'SCALAR',
        min: [0],
        max: [vertexCount - 1],
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: vertexBytes, target: 34962 },
      { buffer: 0, byteOffset: vertexBytes, byteLength: indexBytes, target: 34963 },
    ],
    buffers: [{ byteLength: totalBinBytes }],
  }

  // JSON chunk
  let jsonStr = JSON.stringify(gltfJson)
  // Pad to 4-byte alignment with spaces
  while (jsonStr.length % 4 !== 0) jsonStr += ' '
  const jsonBuffer = Buffer.from(jsonStr, 'utf8')

  // BIN chunk
  const binBuffer = Buffer.alloc(totalBinBytes)
  Buffer.from(vertexData.buffer).copy(binBuffer, 0)
  Buffer.from(indexData.buffer).copy(binBuffer, vertexBytes)

  // GLB header: magic(4) + version(4) + length(4) = 12
  // Each chunk: length(4) + type(4) + data
  const totalLength = 12 + 8 + jsonBuffer.length + 8 + binBuffer.length
  const glb = Buffer.alloc(totalLength)
  let offset = 0

  // Header
  glb.writeUInt32LE(0x46546C67, offset); offset += 4 // magic: "glTF"
  glb.writeUInt32LE(2, offset); offset += 4             // version
  glb.writeUInt32LE(totalLength, offset); offset += 4   // total length

  // JSON chunk
  glb.writeUInt32LE(jsonBuffer.length, offset); offset += 4
  glb.writeUInt32LE(0x4E4F534A, offset); offset += 4 // "JSON"
  jsonBuffer.copy(glb, offset); offset += jsonBuffer.length

  // BIN chunk
  glb.writeUInt32LE(binBuffer.length, offset); offset += 4
  glb.writeUInt32LE(0x004E4942, offset); offset += 4 // "BIN\0"
  binBuffer.copy(glb, offset)

  return glb
}

// ---- Geometry helpers ----

function createBox(w, h, d, ox = 0, oy = 0, oz = 0) {
  const hw = w / 2, hh = h / 2, hd = d / 2
  const v = [
    // Front
    -hw + ox, -hh + oy, hd + oz,  hw + ox, -hh + oy, hd + oz,  hw + ox, hh + oy, hd + oz,  -hw + ox, hh + oy, hd + oz,
    // Back
    hw + ox, -hh + oy, -hd + oz,  -hw + ox, -hh + oy, -hd + oz,  -hw + ox, hh + oy, -hd + oz,  hw + ox, hh + oy, -hd + oz,
    // Top
    -hw + ox, hh + oy, hd + oz,  hw + ox, hh + oy, hd + oz,  hw + ox, hh + oy, -hd + oz,  -hw + ox, hh + oy, -hd + oz,
    // Bottom
    -hw + ox, -hh + oy, -hd + oz,  hw + ox, -hh + oy, -hd + oz,  hw + ox, -hh + oy, hd + oz,  -hw + ox, -hh + oy, hd + oz,
    // Right
    hw + ox, -hh + oy, hd + oz,  hw + ox, -hh + oy, -hd + oz,  hw + ox, hh + oy, -hd + oz,  hw + ox, hh + oy, hd + oz,
    // Left
    -hw + ox, -hh + oy, -hd + oz,  -hw + ox, -hh + oy, hd + oz,  -hw + ox, hh + oy, hd + oz,  -hw + ox, hh + oy, -hd + oz,
  ]
  const idx = []
  for (let f = 0; f < 6; f++) {
    const b = f * 4
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3)
  }
  return { vertices: v, indices: idx }
}

function createSphere(radius, segments, ox = 0, oy = 0, oz = 0) {
  const vertices = []
  const indices = []
  for (let lat = 0; lat <= segments; lat++) {
    const theta = (lat * Math.PI) / segments
    const sinT = Math.sin(theta), cosT = Math.cos(theta)
    for (let lon = 0; lon <= segments; lon++) {
      const phi = (lon * 2 * Math.PI) / segments
      const x = radius * sinT * Math.cos(phi) + ox
      const y = radius * cosT + oy
      const z = radius * sinT * Math.sin(phi) + oz
      vertices.push(x, y, z)
    }
  }
  for (let lat = 0; lat < segments; lat++) {
    for (let lon = 0; lon < segments; lon++) {
      const a = lat * (segments + 1) + lon
      const b = a + segments + 1
      indices.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  return { vertices, indices }
}

function createCylinder(rTop, rBot, height, segments, ox = 0, oy = 0, oz = 0) {
  const vertices = []
  const indices = []
  const halfH = height / 2
  // Side
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2
    const cos = Math.cos(a), sin = Math.sin(a)
    vertices.push(rTop * cos + ox, halfH + oy, rTop * sin + oz)
    vertices.push(rBot * cos + ox, -halfH + oy, rBot * sin + oz)
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3
    indices.push(a, b, c, b, d, c)
  }
  // Caps
  const topCenter = vertices.length / 3
  vertices.push(ox, halfH + oy, oz)
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2
    vertices.push(rTop * Math.cos(a) + ox, halfH + oy, rTop * Math.sin(a) + oz)
  }
  for (let i = 0; i < segments - 1; i++) {
    indices.push(topCenter, topCenter + 1 + i, topCenter + 2 + i)
  }
  indices.push(topCenter, topCenter + segments, topCenter + 1)

  const botCenter = vertices.length / 3
  vertices.push(ox, -halfH + oy, oz)
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2
    vertices.push(rBot * Math.cos(a) + ox, -halfH + oy, rBot * Math.sin(a) + oz)
  }
  for (let i = 0; i < segments - 1; i++) {
    indices.push(botCenter, botCenter + 2 + i, botCenter + 1 + i)
  }
  indices.push(botCenter, botCenter + 1, botCenter + segments)

  return { vertices, indices }
}

function mergeGeometries(geos) {
  const vertices = []
  const indices = []
  let vertexOffset = 0
  for (const geo of geos) {
    vertices.push(...geo.vertices)
    for (const idx of geo.indices) {
      indices.push(idx + vertexOffset)
    }
    vertexOffset += geo.vertices.length / 3
  }
  return { vertices, indices }
}

// ---- Model generators ----

function generateCharacter() {
  const body = createBox(0.5, 0.7, 0.3, 0, 0.35, 0)
  const head = createSphere(0.2, 10, 0, 0.9, 0)
  const armL = createBox(0.12, 0.55, 0.12, -0.35, 0.4, 0)
  const armR = createBox(0.12, 0.55, 0.12, 0.35, 0.4, 0)
  const legL = createBox(0.15, 0.55, 0.15, -0.13, -0.28, 0)
  const legR = createBox(0.15, 0.55, 0.15, 0.13, -0.28, 0)
  return mergeGeometries([body, head, armL, armR, legL, legR])
}

function generateCar() {
  const body = createBox(2.0, 0.4, 0.9, 0, 0.35, 0)
  const cabin = createBox(1.0, 0.35, 0.8, -0.1, 0.72, 0)
  const hood = createBox(0.5, 0.1, 0.85, 0.6, 0.6, 0)
  const w1 = createCylinder(0.18, 0.18, 0.1, 12, 0.65, 0.15, 0.5)
  const w2 = createCylinder(0.18, 0.18, 0.1, 12, 0.65, 0.15, -0.5)
  const w3 = createCylinder(0.18, 0.18, 0.1, 12, -0.65, 0.15, 0.5)
  const w4 = createCylinder(0.18, 0.18, 0.1, 12, -0.65, 0.15, -0.5)
  return mergeGeometries([body, cabin, hood, w1, w2, w3, w4])
}

function generateDragon() {
  const body = createSphere(0.5, 10, 0, 0.5, 0)
  const head = createSphere(0.3, 10, 0.7, 0.75, 0)
  const snout = createCylinder(0.15, 0.05, 0.35, 8, 1.05, 0.7, 0)
  const wingL = createBox(0.8, 0.05, 0.5, 0, 0.9, 0.7)
  const wingR = createBox(0.8, 0.05, 0.5, 0, 0.9, -0.7)
  const tail = createCylinder(0.12, 0.04, 0.9, 8, -0.85, 0.4, 0)
  const leg1 = createCylinder(0.08, 0.06, 0.35, 8, 0.25, 0.1, 0.3)
  const leg2 = createCylinder(0.08, 0.06, 0.35, 8, 0.25, 0.1, -0.3)
  const leg3 = createCylinder(0.08, 0.06, 0.35, 8, -0.25, 0.1, 0.3)
  const leg4 = createCylinder(0.08, 0.06, 0.35, 8, -0.25, 0.1, -0.3)
  return mergeGeometries([body, head, snout, wingL, wingR, tail, leg1, leg2, leg3, leg4])
}

function generateHouse() {
  const walls = createBox(1.5, 0.8, 1.2, 0, 0.4, 0)
  const floor2 = createBox(0.9, 0.6, 1.2, -0.3, 1.1, 0)
  const roof1 = createBox(1.6, 0.06, 1.3, 0, 0.82, 0)
  const roof2 = createBox(1.0, 0.06, 1.3, -0.3, 1.42, 0)
  const door = createBox(0.25, 0.45, 0.04, 0.4, 0.22, 0.6)
  const ground = createBox(3, 0.04, 2.5, 0, -0.02, 0)
  return mergeGeometries([walls, floor2, roof1, roof2, door, ground])
}

function generateChair() {
  const seat = createBox(0.5, 0.04, 0.5, 0, 0.45, 0)
  const back = createBox(0.5, 0.45, 0.04, 0, 0.7, -0.23)
  const l1 = createCylinder(0.025, 0.025, 0.44, 8, 0.2, 0.22, 0.2)
  const l2 = createCylinder(0.025, 0.025, 0.44, 8, -0.2, 0.22, 0.2)
  const l3 = createCylinder(0.025, 0.025, 0.44, 8, 0.2, 0.22, -0.2)
  const l4 = createCylinder(0.025, 0.025, 0.44, 8, -0.2, 0.22, -0.2)
  return mergeGeometries([seat, back, l1, l2, l3, l4])
}

function generateSword() {
  const blade = createBox(0.07, 1.1, 0.015, 0, 0.85, 0)
  const tip = createCylinder(0.04, 0.005, 0.2, 4, 0, 1.5, 0)
  const guard = createBox(0.3, 0.04, 0.06, 0, 0.3, 0)
  const handle = createCylinder(0.03, 0.03, 0.25, 8, 0, 0.15, 0)
  const pommel = createSphere(0.04, 6, 0, 0.02, 0)
  return mergeGeometries([blade, tip, guard, handle, pommel])
}

function generateChest() {
  const base = createBox(0.7, 0.35, 0.45, 0, 0.175, 0)
  const lid = createBox(0.7, 0.15, 0.45, 0, 0.42, 0)
  const band1 = createBox(0.04, 0.52, 0.47, -0.25, 0.25, 0)
  const band2 = createBox(0.04, 0.52, 0.47, 0, 0.25, 0)
  const band3 = createBox(0.04, 0.52, 0.47, 0.25, 0.25, 0)
  const lock = createBox(0.08, 0.08, 0.04, 0, 0.35, 0.24)
  return mergeGeometries([base, lid, band1, band2, band3, lock])
}

function generateLion() {
  const body = createSphere(0.45, 10, 0, 0.5, 0)
  const mane = createSphere(0.38, 10, 0.45, 0.65, 0)
  const head = createSphere(0.22, 10, 0.65, 0.7, 0)
  const snout = createSphere(0.1, 8, 0.85, 0.63, 0)
  const l1 = createCylinder(0.08, 0.07, 0.42, 8, 0.25, 0.12, 0.25)
  const l2 = createCylinder(0.08, 0.07, 0.42, 8, 0.25, 0.12, -0.25)
  const l3 = createCylinder(0.08, 0.07, 0.42, 8, -0.25, 0.12, 0.25)
  const l4 = createCylinder(0.08, 0.07, 0.42, 8, -0.25, 0.12, -0.25)
  const tail = createCylinder(0.03, 0.02, 0.65, 8, -0.75, 0.55, 0)
  return mergeGeometries([body, mane, head, snout, l1, l2, l3, l4, tail])
}

function generateAxe() {
  const handle = createCylinder(0.03, 0.035, 1.3, 8, 0, 0.65, 0)
  const axeHead = createBox(0.45, 0.3, 0.04, 0.15, 1.15, 0)
  const edge = createCylinder(0.16, 0.01, 0.04, 4, 0.4, 1.15, 0)
  return mergeGeometries([handle, axeHead, edge])
}

// ---- Generate all models ----

const models = [
  { name: 'character', gen: generateCharacter, color: [0.27, 0.53, 0.8, 1] },
  { name: 'car', gen: generateCar, color: [1.0, 0.2, 0.2, 1] },
  { name: 'dragon', gen: generateDragon, color: [0.13, 0.67, 0.27, 1] },
  { name: 'house', gen: generateHouse, color: [0.93, 0.93, 0.93, 1] },
  { name: 'chair', gen: generateChair, color: [0.71, 0.4, 0.11, 1] },
  { name: 'sword', gen: generateSword, color: [0.8, 0.8, 0.8, 1] },
  { name: 'chest', gen: generateChest, color: [0.55, 0.27, 0.07, 1] },
  { name: 'lion', gen: generateLion, color: [0.8, 0.53, 0.2, 1] },
  { name: 'axe', gen: generateAxe, color: [0.53, 0.53, 0.53, 1] },
]

console.log('🎨 Generating sample GLB models...\n')

for (const { name, gen, color } of models) {
  const { vertices, indices } = gen()
  const glb = buildGLB(vertices, indices, color)
  const filepath = join(outputDir, `${name}.glb`)
  writeFileSync(filepath, glb)
  console.log(`✅ ${name}.glb (${(glb.length / 1024).toFixed(1)} KB) - ${vertices.length / 3} vertices, ${indices.length / 3} triangles`)
}

console.log('\n✅ All models generated!')
