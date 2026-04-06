export default defineNuxtPlugin(async () => {
  // Helper function to load a script from CDN
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Cannot load scripts on server side'))
        return
      }

      const script = document.createElement('script')
      script.src = src
      script.type = 'text/javascript'
      script.async = true

      script.onload = () => {
        resolve()
      }

      script.onerror = () => {
        reject(new Error(`Failed to load script: ${src}`))
      }

      document.head.appendChild(script)
    })
  }

  try {
    // Load GSAP first
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js')

    // Then load ScrollTrigger
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js')

    // Access GSAP from the window object
    const gsap = (window as any).gsap
    const ScrollTrigger = (window as any).ScrollTrigger

    if (!gsap) {
      throw new Error('GSAP failed to load')
    }

    // Register ScrollTrigger with GSAP
    if (ScrollTrigger && gsap.registerPlugin) {
      gsap.registerPlugin(ScrollTrigger)
    }

    // Provide gsap and ScrollTrigger to the entire app
    return {
      provide: {
        gsap,
        ScrollTrigger,
      },
    }
  }
  catch (error) {
    console.error('Failed to load GSAP and ScrollTrigger:', error)
    // Provide null values as fallback
    return {
      provide: {
        gsap: null,
        ScrollTrigger: null,
      },
    }
  }
})
