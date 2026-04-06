import type { Object3D } from 'three'
import type { Ref, ShallowRef } from 'vue'

export type ExportFormat = 'glb' | 'obj' | 'stl'

export function useModelExport(scene: Ref<Object3D | null> | ShallowRef<Object3D | null>) {
  const isExporting = ref(false)
  const exportError = ref<string | null>(null)

  async function exportModel(format: ExportFormat, filename = 'model') {
    if (!scene.value)
      return
    isExporting.value = true
    exportError.value = null

    try {
      let blob: Blob

      switch (format) {
        case 'glb': {
          const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
          const exporter = new GLTFExporter()
          const result = await new Promise<ArrayBuffer>((resolve, reject) => {
            exporter.parse(
              scene.value!,
              gltf => resolve(gltf as ArrayBuffer),
              (error) => { reject(error) },
              { binary: true },
            )
          })
          blob = new Blob([result], { type: 'model/gltf-binary' })
          break
        }
        case 'obj': {
          const { OBJExporter } = await import('three/examples/jsm/exporters/OBJExporter.js')
          const exporter = new OBJExporter()
          const result = exporter.parse(scene.value!)
          blob = new Blob([result], { type: 'text/plain' })
          break
        }
        case 'stl': {
          const { STLExporter } = await import('three/examples/jsm/exporters/STLExporter.js')
          const exporter = new STLExporter()
          const result = exporter.parse(scene.value!, { binary: true })
          blob = new Blob([result], { type: 'application/octet-stream' })
          break
        }
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
    catch (err) {
      exportError.value = err instanceof Error ? err.message : 'Export failed'
    }
    finally {
      isExporting.value = false
    }
  }

  return {
    isExporting: readonly(isExporting),
    exportError: readonly(exportError),
    exportModel,
  }
}
