<script setup lang="ts">
import { BufferAttribute, BufferGeometry, Color, Points, ShaderMaterial } from 'three'

const props = defineProps<{
  progress: number
}>()

const MAX_PARTICLES = 20000
const pointsObject = shallowRef<Points | null>(null)
let geometry: BufferGeometry | null = null
let material: ShaderMaterial | null = null

const vertexShader = `
  uniform float uTime;
  uniform float uProgress;

  attribute float aSize;
  attribute float aPhase;

  varying float vAlpha;
  varying float vProgress;

  void main() {
    vec3 pos = position;

    float radius = length(pos);
    float targetRadius = mix(3.0, 1.2, uProgress);
    pos = normalize(pos) * mix(radius, targetRadius, uProgress * uProgress);

    float jitter = mix(0.3, 0.05, uProgress);
    pos.y += sin(uTime * 0.5 + aPhase) * jitter;
    pos.x += cos(uTime * 0.3 + aPhase * 1.5) * jitter * 0.7;
    pos.z += sin(uTime * 0.4 + aPhase * 0.8) * jitter * 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    float sizeScale = mix(3.0, 1.5, uProgress);
    gl_PointSize = aSize * sizeScale * (300.0 / -mvPosition.z);

    gl_Position = projectionMatrix * mvPosition;

    vAlpha = smoothstep(0.0, 0.5, aSize / 2.0);
    vProgress = uProgress;
  }
`

const fragmentShader = `
  uniform vec3 uColorStart;
  uniform vec3 uColorEnd;

  varying float vAlpha;
  varying float vProgress;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    float alpha = 1.0 - smoothstep(0.0, 0.5, d);
    alpha *= vAlpha * 0.8;

    vec3 color = mix(uColorStart, uColorEnd, vProgress);

    gl_FragColor = vec4(color, alpha);
  }
`

function initParticleSystem() {
  geometry = new BufferGeometry()

  const positions = new Float32Array(MAX_PARTICLES * 3)
  const sizes = new Float32Array(MAX_PARTICLES)
  const phases = new Float32Array(MAX_PARTICLES)

  for (let i = 0; i < MAX_PARTICLES; i++) {
    const phi = Math.acos(-1 + (2 * i) / MAX_PARTICLES)
    const theta = Math.sqrt(MAX_PARTICLES * Math.PI) * phi
    const radius = 2 + Math.random() * 1.5

    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius
    positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius
    positions[i * 3 + 2] = Math.cos(phi) * radius

    sizes[i] = 0.5 + Math.random() * 0.8
    phases[i] = Math.random() * Math.PI * 2
  }

  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1))
  geometry.setAttribute('aPhase', new BufferAttribute(phases, 1))
  geometry.setDrawRange(0, 0)

  material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uColorStart: { value: new Color('#4488FF') },
      uColorEnd: { value: new Color('#F5C542') },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
  })

  pointsObject.value = new Points(geometry, material)
}

onMounted(() => {
  initParticleSystem()
})

onUnmounted(() => {
  if (geometry)
    geometry.dispose()
  if (material)
    material.dispose()
})

watch(() => props.progress, (val) => {
  if (!geometry)
    return
  const count = Math.floor((val / 100) * MAX_PARTICLES)
  geometry.setDrawRange(0, count)
})
</script>

<template>
  <div class="w-full h-full">
    <ClientOnly>
      <TresCanvas clear-color="#0A0A0F">
        <TresPerspectiveCamera :position="[0, 0, 6]" :fov="50" />

        <PointCloudUpdater
          v-if="pointsObject && material"
          :points="pointsObject"
          :material="material"
          :progress="progress"
        />

        <primitive v-if="pointsObject" :object="pointsObject" />
      </TresCanvas>
    </ClientOnly>
  </div>
</template>
