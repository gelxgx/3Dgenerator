<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'

const containerRef = ref<HTMLDivElement | null>(null)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let particleSystem1: THREE.Points
let particleSystem2: THREE.Points
let animationId: number
let resizeObserver: ResizeObserver | null = null

const mouse = { x: 0, y: 0 }
let time = 0

// Vertex shader with floating motion and mouse repulsion
const vertexShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uRepulsionStrength;

  attribute float aSize;
  attribute float aPhase;

  varying float vAlpha;

  void main() {
    vec3 pos = position;

    // Floating sine-wave motion
    pos.y += sin(uTime * 0.5 + aPhase) * 0.3;
    pos.x += cos(uTime * 0.3 + aPhase * 1.5) * 0.2;
    pos.z += sin(uTime * 0.4 + aPhase * 0.8) * 0.15;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Mouse repulsion in screen space
    vec2 screenPos = mvPosition.xy / mvPosition.w;
    vec2 diff = screenPos - uMouse;
    float dist = length(diff);
    float repulsion = exp(-dist * dist * 2.0) * uRepulsionStrength;
    mvPosition.xy += normalize(diff) * repulsion * 0.15;

    // Size attenuation
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    // Alpha varies with particle size
    vAlpha = smoothstep(0.0, 0.5, aSize / 8.0);
  }
`

// Fragment shader with circular particles and glow effect
const fragmentShader = `
  uniform vec3 uColor;

  varying float vAlpha;

  void main() {
    // Create circular particle
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    // Glow effect with distance-based alpha falloff
    float alpha = 1.0 - smoothstep(0.0, 0.5, d);
    alpha *= vAlpha * 0.7;

    gl_FragColor = vec4(uColor, alpha);
  }
`

function createParticleSystem(color: string, particleCount: number, sizeScale: number) {
  const geometry = new THREE.BufferGeometry()

  // Create sphere-like distribution of particles
  const positions = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)
  const phases = new Float32Array(particleCount)

  for (let i = 0; i < particleCount; i++) {
    // Fibonacci sphere for even distribution
    const phi = Math.acos(-1 + (2 * i) / particleCount)
    const theta = Math.sqrt(particleCount * Math.PI) * phi
    const radius = 2 + Math.random() * 1.5

    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius
    positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius
    positions[i * 3 + 2] = Math.cos(phi) * radius

    sizes[i] = (0.5 + Math.random() * 0.8) * sizeScale
    phases[i] = Math.random() * Math.PI * 2
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColor: { value: new THREE.Color(color) },
      uRepulsionStrength: { value: 1.5 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    fog: false,
  })

  const points = new THREE.Points(geometry, material)
  return points
}

function onMouseMove(event: MouseEvent) {
  if (!renderer)
    return

  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

function onWindowResize() {
  if (!containerRef.value || !renderer || !camera)
    return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function animate() {
  animationId = requestAnimationFrame(animate)

  time += 0.016 // ~60fps

  // Update both particle systems
  const updateParticleSystem = (points: THREE.Points) => {
    const material = points.material as THREE.ShaderMaterial
    const uTime = material.uniforms.uTime
    const uMouse = material.uniforms.uMouse
    if (uTime?.value != null)
      uTime.value = time
    uMouse?.value?.set(mouse.x, mouse.y)
  }

  updateParticleSystem(particleSystem1)
  updateParticleSystem(particleSystem2)

  // Smooth camera orbit
  const orbitSpeed = 0.0003
  camera.position.x = Math.cos(time * orbitSpeed) * 5
  camera.position.z = Math.sin(time * orbitSpeed) * 5
  camera.lookAt(0, 0, 0)

  renderer.render(scene, camera)
}

onMounted(() => {
  if (!containerRef.value)
    return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  // Scene setup
  scene = new THREE.Scene()

  // Camera setup
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.set(0, 0, 5)
  camera.lookAt(0, 0, 0)

  // Renderer setup
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })

  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setClearColor(0x0A0A0F, 0)
  renderer.sortObjects = false

  containerRef.value.appendChild(renderer.domElement)

  // Create particle systems
  particleSystem1 = createParticleSystem('#6C5CE7', 1800, 2.0) // Purple, larger
  particleSystem2 = createParticleSystem('#00CEC9', 1200, 1.2) // Teal, smaller

  scene.add(particleSystem1)
  scene.add(particleSystem2)

  // Event listeners
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('resize', onWindowResize)

  // ResizeObserver for container changes
  resizeObserver = new ResizeObserver(() => {
    onWindowResize()
  })
  resizeObserver.observe(containerRef.value)

  // Start animation loop
  animate()
})

onUnmounted(() => {
  // Clean up event listeners
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('resize', onWindowResize)

  // Stop animation
  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  // Clean up ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect()
  }

  // Dispose Three.js resources
  if (particleSystem1) {
    particleSystem1.geometry.dispose()
    ;(particleSystem1.material as THREE.Material).dispose()
  }
  if (particleSystem2) {
    particleSystem2.geometry.dispose()
    ;(particleSystem2.material as THREE.Material).dispose()
  }
  if (renderer) {
    renderer.dispose()
    renderer.domElement.remove()
  }
})
</script>

<template>
  <div ref="containerRef" class="absolute inset-0 overflow-hidden" />
</template>

<style scoped>
div {
  width: 100%;
  height: 100%;
}
</style>
