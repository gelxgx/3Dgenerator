<script setup lang="ts">
import { BufferAttribute, BufferGeometry, Color, Points, ShaderMaterial } from 'three'

defineProps<{
  progress: number
}>()

const MAX_PARTICLES = 4000
const pointsObject = shallowRef<Points | null>(null)
let geometry: BufferGeometry | null = null
let material: ShaderMaterial | null = null

const vertexShader = `
  uniform float uTime;
  uniform float uProgress;

  attribute float aSize;
  attribute float aPhase;
  attribute float aOrbit;

  varying float vAlpha;
  varying float vProgress;
  varying float vOrbit;

  void main() {
    vec3 pos = position;
    float t = uTime;

    float orbitSpeed = 0.3 + aOrbit * 0.4;
    float angle = t * orbitSpeed + aPhase;

    float r = length(pos.xz);
    float convergence = mix(1.0, 0.35, uProgress * uProgress);
    r *= convergence;

    pos.x = cos(angle) * r;
    pos.z = sin(angle) * r;
    pos.y *= convergence;

    pos.y += sin(t * 0.5 + aPhase * 2.0) * 0.15 * (1.0 - uProgress);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    float basePtSize = aSize * mix(1.8, 1.0, uProgress);
    gl_PointSize = basePtSize * (250.0 / -mvPosition.z);

    gl_Position = projectionMatrix * mvPosition;

    vAlpha = 0.25 + aSize * 0.25;
    vProgress = uProgress;
    vOrbit = aOrbit;
  }
`

const fragmentShader = `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uTime;

  varying float vAlpha;
  varying float vProgress;
  varying float vOrbit;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    float circle = 1.0 - smoothstep(0.15, 0.5, d);

    vec3 color = mix(uColorA, uColorB, vOrbit + vProgress * 0.3);

    float flicker = 0.85 + 0.15 * sin(uTime * 3.0 + vOrbit * 20.0);
    float alpha = circle * vAlpha * flicker;
    alpha *= mix(0.7, 1.0, vProgress);

    gl_FragColor = vec4(color, alpha);
  }
`

function initParticleSystem() {
  geometry = new BufferGeometry()

  const positions = new Float32Array(MAX_PARTICLES * 3)
  const sizes = new Float32Array(MAX_PARTICLES)
  const phases = new Float32Array(MAX_PARTICLES)
  const orbits = new Float32Array(MAX_PARTICLES)

  for (let i = 0; i < MAX_PARTICLES; i++) {
    const orbitRadius = 0.6 + Math.random() * 2.4
    const angle = Math.random() * Math.PI * 2
    const ySpread = (Math.random() - 0.5) * 2.5

    positions[i * 3] = Math.cos(angle) * orbitRadius
    positions[i * 3 + 1] = ySpread
    positions[i * 3 + 2] = Math.sin(angle) * orbitRadius

    sizes[i] = 0.6 + Math.random() * 1.4
    phases[i] = Math.random() * Math.PI * 2
    orbits[i] = Math.random()
  }

  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1))
  geometry.setAttribute('aPhase', new BufferAttribute(phases, 1))
  geometry.setAttribute('aOrbit', new BufferAttribute(orbits, 1))
  geometry.setDrawRange(0, 0)

  material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uColorA: { value: new Color('#6C5CE7') },
      uColorB: { value: new Color('#00CEC9') },
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
</script>

<template>
  <div class="w-full h-full">
    <ClientOnly>
      <TresCanvas clear-color="#0A0A0F">
        <TresPerspectiveCamera :position="[0, 1, 5]" :fov="50" />

        <PointCloudUpdater
          v-if="pointsObject && material"
          :points="pointsObject"
          :material="material"
          :progress="progress"
          :max-particles="MAX_PARTICLES"
        />

        <primitive v-if="pointsObject" :object="pointsObject" />
      </TresCanvas>
    </ClientOnly>
  </div>
</template>
